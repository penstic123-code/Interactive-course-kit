(()=>{const res=[];
document.querySelectorAll('[data-illus]').forEach(host=>{const svg=host.querySelector('svg');if(!svg)return;const sb=svg.getBoundingClientRect();if(!sb.width)return;
 const sa=sb.width*sb.height;const ppl=[...svg.querySelectorAll('g.px-person')];if(!ppl.length)return;
 const pb=ppl.map(g=>{const r=g.getBoundingClientRect();return {l:r.left+2,t:r.top+2,r:r.right-2,b:r.bottom-2}});
 const hits=[];
 svg.querySelectorAll('rect,path,line,polygon,polyline,circle,ellipse,text').forEach(el=>{
  if(el.closest('g.px-person')||el.closest('.pp-bg'))return;const r=el.getBoundingClientRect();if(!r.width&&!r.height)return;
  const a=Math.max(1,r.width)*Math.max(1,r.height);if(a>sa*0.3)return; if(r.width>sb.width*0.85)return;
  pb.forEach((p,i)=>{const ox=Math.min(p.r,r.right)-Math.max(p.l,r.left),oy=Math.min(p.b,r.bottom)-Math.max(p.t,r.top);
   if(ox>2&&oy>2){const ov=ox*oy;if(ov>Math.min(a,60)*0.25||el.tagName==='text')hits.push(el.tagName+(el.tagName==='text'?'「'+el.textContent.slice(0,8)+'」':'')+'@'+Math.round(r.left-sb.left)+','+Math.round(r.top-sb.top)+'#p'+i);}});
 });
 if(hits.length)res.push(host.dataset.illus+' ('+ppl.length+'人): '+[...new Set(hits)].slice(0,6).join(' | ')+(hits.length>6?' …共'+hits.length:''));
});return res.join('\n');})()
