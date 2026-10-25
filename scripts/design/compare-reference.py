"""Align a genuine native capture and a reference crop; masks remove unrelated pixels.
This compares visual primitives, not product content. Never pass a screenshot recreation.
"""
import argparse, json
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

def box(value):
    values=tuple(map(int,value.split(',')))
    if len(values)!=4 or values[2]<=values[0] or values[3]<=values[1] or min(values)<0:
        raise argparse.ArgumentTypeError('Use x0,y0,x1,y1 with positive area')
    return values

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference',required=True,type=Path)
    parser.add_argument('--capture',required=True,type=Path)
    parser.add_argument('--reference-crop',required=True,type=box)
    parser.add_argument('--capture-crop',required=True,type=box)
    parser.add_argument('--mask',type=box,action='append',default=[],help='Repeat for photos/chrome/keyboard; normalized 390px output coordinates')
    parser.add_argument('--device',required=True,help='Actual device/OS and font setting')
    parser.add_argument('--out',required=True,type=Path)
    args=parser.parse_args()
    with Image.open(args.reference) as source:
        if args.reference_crop[2]>source.width or args.reference_crop[3]>source.height: raise ValueError('Reference crop exceeds image')
        reference=source.convert('RGB').crop(args.reference_crop)
    with Image.open(args.capture) as source:
        if args.capture_crop[2]>source.width or args.capture_crop[3]>source.height: raise ValueError('Capture crop exceeds image')
        capture=source.convert('RGB').crop(args.capture_crop)
    if abs(reference.width/reference.height-capture.width/capture.height)/(reference.width/reference.height)>0.02:
        raise ValueError('Crop aspect ratios differ by more than 2%; choose comparable regions')
    size=(390,round(reference.height*390/reference.width))
    reference=reference.resize(size);capture=capture.resize(size)
    for image in [reference,capture]:
        draw=ImageDraw.Draw(image)
        for region in args.mask: draw.rectangle(region,fill='#d8d8d8')
    output=Image.new('RGB',(size[0]*3,size[1]+32),'white')
    labels=['Reference','Native capture','Absolute difference (not a score)']
    for index,image in enumerate([reference,capture,ImageChops.difference(reference,capture)]):
        output.paste(image,(index*size[0],32));ImageDraw.Draw(output).text((index*size[0]+8,8),labels[index],fill='black')
    args.out.parent.mkdir(parents=True,exist_ok=True);output.save(args.out)
    args.out.with_suffix('.json').write_text(json.dumps({'device':args.device,'reference':str(args.reference),'capture':str(args.capture),'referenceCrop':args.reference_crop,'captureCrop':args.capture_crop,'masks':args.mask,'columns':['reference','native capture','absolute difference'],'warning':'Capture resized to reference aspect ratio; use matching crops. Difference includes platform/font/content changes, not a fidelity score.'},indent=2)+'\n')
    print(args.out)
if __name__=='__main__':main()
