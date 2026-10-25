import type { MemoryBoard } from '@afterglow/contracts/memories';
function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ]!,
  );
}
export function publicMemoryPage(board: MemoryBoard, nonce = 'public-memory') {
  const frames = board.preview?.frames ?? [],
    sections = board.preview?.sections ?? [];
  const width = Math.max(
    390,
    ...frames.map((frame) => frame.x + frame.width),
    ...sections.map((section) => section.x + section.width),
  );
  const height = Math.max(
    390,
    ...frames.map((frame) => frame.y + frame.height),
    ...sections.map((section) => section.y + section.height),
  );
  const entry =
    frames.find((frame) => frame.id === sections[0]?.songItemId) ?? frames[0];
  const center = entry
    ? { x: entry.x + entry.width / 2, y: entry.y + entry.height / 2 }
    : { x: 195, y: 195 };
  const cards = frames
    .map((frame) => {
      const item = board.items.find((entry) => entry.id === frame.id);
      if (!item) return '';
      const song = item.song;
      return `<article style="left:${frame.x}px;top:${frame.y}px;width:${frame.width}px;height:${frame.height}px" class="${item.kind === 'PHOTO' ? 'photo' : ''}">${item.assetId ? `<img alt="Shared memory photo" src="/api/public/boards/${board.id}/media/${item.assetId}">` : ''}${song ? `${song.artworkUrl ? `<img class="art" alt="Album artwork" src="${escape(song.artworkUrl)}">` : ''}<h2>${escape(song.title)}</h2><small>${escape(song.artist)}</small>${song.previewUrl ? `<audio controls preload="none" src="${escape(song.previewUrl)}"></audio><small>Preview provided courtesy of iTunes</small>` : ''}<p><a rel="noopener noreferrer" href="${escape(song.storeUrl)}">View on Apple Music ↗</a></p>` : `<p>${escape(item.text)}</p>${item.songUrl ? `<a rel="noopener noreferrer" href="${escape(item.songUrl)}">Open song ↗</a>` : ''}`}</article>`;
    })
    .join('');
  const halos = board.items
    .filter((item) => item.kind === 'PHOTO' && item.color)
    .map((item) => {
      const frame = frames.find((entry) => entry.id === item.id);
      if (!frame) return '';
      const radius = Math.max(frame.width, frame.height) * 1.8;
      return `<div class="halo" style="left:${frame.x + frame.width / 2 - radius}px;top:${frame.y + frame.height / 2 - radius}px;width:${radius * 2}px;height:${radius * 2}px;background:radial-gradient(ellipse,${item.color}b8 0%,${item.color}4d 35%,transparent 72%)"></div>`;
    })
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(board.title)} · Afterglow</title><style>body{margin:0;background:#0b0b0b;color:#fff;font:16px/1.5 system-ui,sans-serif}header{padding:24px;max-width:800px;margin:auto}h1{font-size:32px;line-height:1.1}h2{font-size:20px;margin:8px 0}small{color:#d8d8d8}a{color:#fff}p{white-space:pre-wrap;overflow-wrap:anywhere}.shell{position:relative;width:min(100%,800px);margin:auto}.viewport{aspect-ratio:1;overflow:auto;position:relative;scrollbar-width:none}.world{position:relative;overflow:hidden}article{box-sizing:border-box;position:absolute;background:rgba(11,11,11,.88);padding:16px;border-radius:8px;overflow:auto}.photo{padding:0;background:transparent}.photo p{padding:8px;background:rgba(11,11,11,.88);margin:0}img{width:100%;display:block}.art{width:72px;height:72px;border-radius:8px}audio{width:100%;margin:12px 0}.halo,.name{position:absolute;pointer-events:none}.fog{position:absolute;pointer-events:none;opacity:0;transition:opacity .15s}.left{left:0;top:0;bottom:0;width:40px;background:linear-gradient(to right,#0b0b0bf5,transparent)}.right{right:0;top:0;bottom:0;width:40px;background:linear-gradient(to left,#0b0b0bf5,transparent)}.top{top:0;left:0;right:0;height:40px;background:linear-gradient(to bottom,#0b0b0bf5,transparent)}.bottom{bottom:0;left:0;right:0;height:40px;background:linear-gradient(to top,#0b0b0bf5,transparent)}</style></head><body><header><strong>afterglow</strong><h1>${escape(board.title)}</h1><small>${escape(board.eventDate ?? '')} · Public memory</small></header><main class="shell"><div class="viewport" data-x="${center.x}" data-y="${center.y}"><div class="world" style="width:${width}px;height:${height}px">${halos}${sections.map((section) => `<strong class="name" style="left:${section.x}px;top:${section.y - 40}px">${escape(section.contributorName)}</strong>`).join('')}${cards || '<p>No items remain in this memory.</p>'}</div></div><div class="fog left"></div><div class="fog right"></div><div class="fog top"></div><div class="fog bottom"></div></main><script nonce="${escape(nonce)}">const v=document.querySelector('.viewport');function fog(){for(const [name,visible] of [['left',v.scrollLeft>1],['right',v.scrollLeft+v.clientWidth<v.scrollWidth-1],['top',v.scrollTop>1],['bottom',v.scrollTop+v.clientHeight<v.scrollHeight-1]])document.querySelector('.fog.'+name).style.opacity=visible?'1':'0'}v.addEventListener('scroll',fog,{passive:true});v.scrollTo(Number(v.dataset.x)-v.clientWidth/2,Number(v.dataset.y)-v.clientHeight/2);fog();window.addEventListener('resize',fog);document.addEventListener('play',event=>{if(event.target.tagName==='AUDIO')for(const audio of document.querySelectorAll('audio'))if(audio!==event.target)audio.pause()},true);</script></body></html>`;
}
