"""Preserve and safely inventory the supplied Bond reference archive (Python 3 + Pillow)."""
import argparse, hashlib, io, json, re, shutil, stat, zipfile
from pathlib import Path, PurePosixPath, PureWindowsPath
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
def safe_member(name):
    normalized = name.replace('\\', '/')
    path = PurePosixPath(normalized)
    if path.is_absolute() or PureWindowsPath(name).drive or '..' in path.parts or '\x00' in name:
        raise ValueError(f'Unsafe archive path: {name!r}')
    return path

def import_archive(archive, root=ROOT):
    target = root / 'design/reference/bond'
    if target.exists():
        raise ValueError('Reference directory already exists; preserve it and use a fresh checkout for a different source')
    with zipfile.ZipFile(archive) as zipped:
        entries=[]; names=set()
        for info in zipped.infolist():
            path=safe_member(info.filename)
            if stat.S_ISLNK(info.external_attr >> 16): raise ValueError('Archive symlinks are not allowed')
            if path.as_posix().casefold() in names: raise ValueError('Duplicate archive path')
            names.add(path.as_posix().casefold())
            if info.is_dir() or '__MACOSX' in path.parts or path.name.startswith('._') or path.name=='.DS_Store': continue
            if path.suffix.lower() not in {'.png','.jpg','.jpeg','.webp'}: continue
            if info.file_size > 40*1024*1024: raise ValueError('Reference image exceeds import size limit')
            entries.append((info,path))
        if not entries or len(entries)>2000 or sum(i.file_size for i,_ in entries)>2*1024**3: raise ValueError('Unexpected archive size/count')
        entries.sort(key=lambda pair:[int(v) if v.isdigit() else v.lower() for v in re.split(r'(\d+)',pair[1].as_posix())])
        target.mkdir(parents=True)
        shutil.copyfile(archive,target/'source.zip')
        images=[]
        for index,(info,path) in enumerate(entries,1):
            data=zipped.read(info)
            with Image.open(io.BytesIO(data)) as im:
                width,height=im.size
                if width*height>25_000_000: raise ValueError('Reference decoded dimensions exceed limit')
                im.load()
                rgb=im.convert('RGB'); small=rgb.resize((9,8)).convert('L')
                dhash=sum((small.getpixel((x,y))>small.getpixel((x+1,y))) << (y*8+x) for y in range(8) for x in range(8))
                destination=target/'originals'/path
                destination.parent.mkdir(parents=True,exist_ok=True); destination.write_bytes(data)
                readable=target/'readable'/f'BOND-{index:03d}.jpg';readable.parent.mkdir(exist_ok=True)
                rgb.resize((600,round(height*600/width))).save(readable,quality=92)
            images.append({'id':f'BOND-{index:03d}','originalFilename':info.filename,'width':width,'height':height,'sha256':hashlib.sha256(data).hexdigest(),'dHash':f'{dhash:016x}','path':destination.relative_to(root).as_posix(),'inspected':False})
    (root/'design/reference-manifest.json').write_text(json.dumps({'version':1,'source':{'filename':archive.name,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()},'screenshotCount':len(images),'images':images},indent=2)+'\n')
    try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
    except OSError: font=ImageFont.load_default(size=18)
    for start in range(0,len(images),20):
        sheet=Image.new('RGB',(1200,4*570),'#d8d8d8');draw=ImageDraw.Draw(sheet)
        for offset,item in enumerate(images[start:start+20]):
            im=Image.open(root/item['path']).convert('RGB');im.thumbnail((224,524))
            x=(offset%5)*240+8;y=(offset//5)*570+30
            sheet.paste(im,(x,y));draw.text((x,y-24),item['id'],fill='black',font=font)
        output=target/'contact-sheets'/f'{start//20+1:02d}.jpg';output.parent.mkdir(exist_ok=True);sheet.save(output,quality=88)
    print(f'Imported {len(images)} screenshots; archive SHA-256 recorded; originals and sheets ignored by Git.')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('archive',type=Path);args=parser.parse_args();import_archive(args.archive)
