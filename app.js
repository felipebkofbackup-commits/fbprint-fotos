const $=id=>document.getElementById(id), C=$('canvas'); let ctx=C.getContext('2d');
const state={photos:[],page:0,selected:-1,slots:[],pages:1}; const DPI=3.2; // preview pixels/mm
const controls=['orientation','mode','preset','polaroidW','polaroidH','shape','texture','intensity','frameColor','photoW','photoH','cols','rows','respectMargin','margin','spacing','repeat','cropMarks','fit'];
controls.forEach(id=>$(id).addEventListener('input',()=>{if(id==='intensity')$('intensityVal').textContent=$('intensity').value+'%';state.page=0;render()}));
['zoom','offsetX','offsetY'].forEach(id=>$(id).addEventListener('input',()=>{let p=state.photos[state.selected];if(!p)return;p[id]=+$ (id).value;if(id==='zoom')$('zoomVal').textContent=p.zoom+'%';render()}));
$('files').onchange=e=>addFiles(e.target.files); $('clear').onclick=()=>{state.photos.forEach(p=>URL.revokeObjectURL(p.url));state.photos=[];state.selected=-1;renderThumbs();render()};
$('drop').onclick=()=>$('files').click();$('drop').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('files').click()}};$('drop').ondragover=e=>{e.preventDefault();$('drop').classList.add('drag')};$('drop').ondragleave=()=>$('drop').classList.remove('drag');$('drop').ondrop=e=>{e.preventDefault();$('drop').classList.remove('drag');addFiles(e.dataTransfer.files)};
function addFiles(files){[...files].filter(f=>f.type.startsWith('image/')).forEach(f=>{let img=new Image(),url=URL.createObjectURL(f);let p={img,url,name:f.name,zoom:100,offsetX:0,offsetY:0,rot:0};img.onload=()=>render();img.src=url;state.photos.push(p)});if(state.selected<0&&state.photos.length)state.selected=0;renderThumbs();syncPhoto();render()}
function renderThumbs(){$('thumbs').innerHTML='';state.photos.forEach((p,i)=>{let im=document.createElement('img');im.src=p.url;im.title=p.name;im.className=i===state.selected?'sel':'';im.onclick=()=>{state.selected=i;renderThumbs();syncPhoto();render()};$('thumbs').appendChild(im)})}
function syncPhoto(){let p=state.photos[state.selected];if(!p)return;$('zoom').value=p.zoom;$('zoomVal').textContent=p.zoom+'%';$('offsetX').value=p.offsetX;$('offsetY').value=p.offsetY}
$('rotate').onclick=()=>{let p=state.photos[state.selected];if(p){p.rot=(p.rot+90)%360;render()}};$('prev').onclick=()=>{if(state.page>0){state.page--;render()}};$('next').onclick=()=>{if(state.page<state.pages-1){state.page++;render()}};
function pageMM(){return $('orientation').value==='l'?[297,210]:[210,297]}
function layout(){let [pw,ph]=pageMM(),m=$('respectMargin').checked?+$('margin').value:0,s=+$('spacing').value,aw=pw-2*m,ah=ph-2*m,out=[];
 if($('mode').value==='polaroid'){let pv=$('preset').value;if(pv==='custom'){let w=+$('polaroidW').value,h=+$('polaroidH').value;if(w>0&&h>0&&w<=aw+.01&&h<=ah+.01){let cols=Math.floor((aw+s)/(w+s)),rows=Math.floor((ah+s)/(h+s));if(cols>0&&rows>0){let gw=cols*w+(cols-1)*s,gh=rows*h+(rows-1)*s,x0=m+(aw-gw)/2,y0=m+(ah-gh)/2;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)out.push({x:x0+c*(w+s),y:y0+r*(h+s),w,h})}}}else{let count=+pv, cols=count===12?4:3, rows=3,maxW=(aw-s*(cols-1))/cols,maxH=(ah-s*(rows-1))/rows,aspect=$('shape').value==='square'?.82:2/3,h=Math.min(maxH,maxW/aspect),w=h*aspect,gw=cols*w+(cols-1)*s,gh=rows*h+(rows-1)*s,x0=m+(aw-gw)/2,y0=m+(ah-gh)/2;for(let i=0;i<count;i++){let r=Math.floor(i/cols),c=i%cols;out.push({x:x0+c*(w+s),y:y0+r*(h+s),w,h})}}}
 else if($('mode').value==='grid'){let cols=+$('cols').value,rows=+$('rows').value,w=(aw-s*(cols-1))/cols,h=(ah-s*(rows-1))/rows;if(w>0&&h>0)for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)out.push({x:m+c*(w+s),y:m+r*(h+s),w,h})}
 else{let w=+$('photoW').value,h=+$('photoH').value;if(w<=aw+.01&&h<=ah+.01){let cols=Math.floor((aw+s)/(w+s)),rows=Math.floor((ah+s)/(h+s));for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){let x=m+c*(w+s),y=m+r*(h+s);if(x+w<=pw-m+.01&&y+h<=ph-m+.01)out.push({x,y,w,h})}}}return out}
function photoForSlot(i){if(!state.photos.length)return null;if(state.photos.length===1&&$('repeat').checked)return {p:state.photos[0],idx:0};let idx=state.page*state.slots.length+i;return idx<state.photos.length?{p:state.photos[idx],idx}:null}
function render(exportMode=false,targetCanvas=C,targetDPI=DPI){let [pw,ph]=pageMM();C.width=Math.round(pw*DPI);C.height=Math.round(ph*DPI);ctx.setTransform(DPI,0,0,DPI,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,pw,ph);state.slots=layout();let spp=state.slots.length;state.pages=spp&&state.photos.length>1?Math.max(1,Math.ceil(state.photos.length/spp)):1;if(state.page>=state.pages)state.page=state.pages-1;
 state.slots.forEach((s,i)=>{let q=photoForSlot(i);if(q){if($('mode').value==='polaroid')drawPolaroid(q.p,s);else drawPhoto(q.p,s);if(!exportMode&&q.idx===state.selected){ctx.strokeStyle='#1677ff';ctx.lineWidth=.6;ctx.strokeRect(s.x,s.y,s.w,s.h)}}else{ctx.fillStyle='#f4f4f4';ctx.fillRect(s.x,s.y,s.w,s.h);}});
 if($('cropMarks').checked) drawSheetCropMarks(ctx,state.slots);
 $('pageLabel').textContent=`Página ${state.page+1}/${state.pages}`;$('prev').disabled=state.page===0;$('next').disabled=state.page>=state.pages-1;let info=spp?`${spp} espaço(s) por página • ${state.pages} página(s)`:'Nenhuma foto cabe com essas medidas';if($('mode').value==='polaroid'&&spp){let r=state.slots[0];info=`Polaroid ${r.w.toFixed(1)} × ${r.h.toFixed(1)} mm • ${spp} por página • ${state.pages} página(s)`}$('info').textContent=info;updateVisible()}
function updateVisible(){let m=$('mode').value;$('polaroidOpts').style.display=m==='polaroid'?'block':'none';$('polaroidCustom').style.display=m==='polaroid'&&$('preset').value==='custom'?'grid':'none';$('sizeOpts').style.display=m==='size'?'block':'none';$('gridOpts').style.display=m==='grid'?'block':'none';$('margin').disabled=!$('respectMargin').checked}

function drawSheetCropMarks(g,slots){
  // Marcas somente FORA da montagem. Alinham todas as linhas de corte,
  // sem desenhar traços sobre as fotos, mesmo quando o espaçamento é zero.
  if(!slots.length)return;
  const eps=.08, len=2.2, gap=.55;
  const xs=[],ys=[];
  const add=(a,v)=>{if(!a.some(n=>Math.abs(n-v)<eps))a.push(v)};
  slots.forEach(s=>{add(xs,s.x);add(xs,s.x+s.w);add(ys,s.y);add(ys,s.y+s.h)});
  xs.sort((a,b)=>a-b);ys.sort((a,b)=>a-b);
  const left=Math.min(...slots.map(s=>s.x)),right=Math.max(...slots.map(s=>s.x+s.w));
  const top=Math.min(...slots.map(s=>s.y)),bottom=Math.max(...slots.map(s=>s.y+s.h));
  g.save();g.strokeStyle='#111';g.lineWidth=.16;g.beginPath();
  // Linhas verticais de corte: tracinhos apenas acima e abaixo do conjunto.
  xs.forEach(x=>{g.moveTo(x,top-gap-len);g.lineTo(x,top-gap);g.moveTo(x,bottom+gap);g.lineTo(x,bottom+gap+len)});
  // Linhas horizontais de corte: tracinhos apenas à esquerda e à direita.
  ys.forEach(y=>{g.moveTo(left-gap-len,y);g.lineTo(left-gap,y);g.moveTo(right+gap,y);g.lineTo(right+gap+len,y)});
  g.stroke();g.restore();
}

function drawPolaroid(p,s){ctx.save();ctx.fillStyle=$('frameColor').value;ctx.fillRect(s.x,s.y,s.w,s.h);if($('texture').value==='paper')texture(s,$('frameColor').value,+$('intensity').value);let side=s.w*.065,top=s.h*.045,bottom=s.h*($('shape').value==='square'?.20:.18);drawPhoto(p,{x:s.x+side,y:s.y+top,w:s.w-side*2,h:s.h-top-bottom});ctx.restore()}
function hexRGB(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]}
function texture(s,color,intensity){if(intensity<=0)return;let k=intensity/100,[r,g,b]=hexRGB(color),seed=Math.floor((s.x*1013+s.y*7919+s.w*3571+s.h*1237)*100);function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}let grains=Math.min(3200,Math.max(90,Math.floor(s.w*s.h*(.22+1.55*k))));for(let i=0;i<grains;i++){let dark=i%4!==0,shift=dark?(25+95*k):-(10+45*k),a=(dark?(0.06+.36*k):(.04+.22*k));ctx.fillStyle=`rgba(${Math.max(0,Math.min(255,r-shift))},${Math.max(0,Math.min(255,g-shift))},${Math.max(0,Math.min(255,b-shift))},${a})`;let d=.06+rnd()*(.12+.38*k);ctx.beginPath();ctx.arc(s.x+rnd()*s.w,s.y+rnd()*s.h,d,0,Math.PI*2);ctx.fill()}ctx.strokeStyle=`rgba(${Math.max(0,r-60)},${Math.max(0,g-60)},${Math.max(0,b-60)},${.08+.3*k})`;ctx.lineWidth=.05+.18*k;let fibers=Math.min(250,Math.floor(grains/(17-9*k)));for(let i=0;i<fibers;i++){let x=s.x+rnd()*s.w,y=s.y+rnd()*s.h,len=.3+rnd()*(1+2.4*k);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(Math.min(s.x+s.w,x+len),y+(rnd()-.5)*.25);ctx.stroke()}}
function drawPhoto(p,s){if(!p.img.complete)return;ctx.save();ctx.beginPath();ctx.rect(s.x,s.y,s.w,s.h);ctx.clip();ctx.fillStyle='#fff';ctx.fillRect(s.x,s.y,s.w,s.h);let iw=p.img.naturalWidth,ih=p.img.naturalHeight;if(p.rot%180){[iw,ih]=[ih,iw]}let mode=$('fit').value,sx=s.w/iw,sy=s.h/ih,scale=mode==='stretch'?1:(mode==='fill'?Math.max(sx,sy):Math.min(sx,sy));scale*=p.zoom/100;let dw=mode==='stretch'?s.w:iw*scale,dh=mode==='stretch'?s.h:ih*scale,cx=s.x+s.w/2+(p.offsetX/100)*s.w/2,cy=s.y+s.h/2+(p.offsetY/100)*s.h/2;ctx.translate(cx,cy);ctx.rotate(p.rot*Math.PI/180);if(p.rot%180)ctx.drawImage(p.img,-dh/2,-dw/2,dh,dw);else ctx.drawImage(p.img,-dw/2,-dh/2,dw,dh);ctx.restore()}
let drag=null;
function canvasPoint(e){let rect=C.getBoundingClientRect(),[pw,ph]=pageMM();return {x:(e.clientX-rect.left)/rect.width*pw,y:(e.clientY-rect.top)/rect.height*ph}}
function slotAt(pt){for(let i=0;i<state.slots.length;i++){let s=state.slots[i];if(pt.x>=s.x&&pt.x<=s.x+s.w&&pt.y>=s.y&&pt.y<=s.y+s.h)return {i,s,q:photoForSlot(i)}}return null}
C.onpointerdown=e=>{let hit=slotAt(canvasPoint(e));if(!hit||!hit.q)return;state.selected=hit.q.idx;renderThumbs();syncPhoto();let pt=canvasPoint(e),p=hit.q.p;drag={p,startX:pt.x,startY:pt.y,ox:p.offsetX,oy:p.offsetY,slot:hit.s};C.setPointerCapture(e.pointerId);C.style.cursor='grabbing';render()};
C.onpointermove=e=>{if(!drag)return;let pt=canvasPoint(e),dx=pt.x-drag.startX,dy=pt.y-drag.startY;drag.p.offsetX=Math.max(-100,Math.min(100,drag.ox+(dx/drag.slot.w)*200));drag.p.offsetY=Math.max(-100,Math.min(100,drag.oy+(dy/drag.slot.h)*200));syncPhoto();render()};
C.onpointerup=C.onpointercancel=e=>{drag=null;C.style.cursor='default'};
C.onwheel=e=>{let hit=slotAt(canvasPoint(e));if(!hit||!hit.q)return;e.preventDefault();state.selected=hit.q.idx;let p=hit.q.p;p.zoom=Math.max(50,Math.min(300,p.zoom+(e.deltaY<0?5:-5)));renderThumbs();syncPhoto();render()};
C.ondblclick=e=>{let hit=slotAt(canvasPoint(e));if(!hit||!hit.q)return;let p=hit.q.p;p.zoom=100;p.offsetX=0;p.offsetY=0;state.selected=hit.q.idx;renderThumbs();syncPhoto();render()};

$('savePdf').onclick=()=>savePDF();
function b64bytes(data){let bin=atob(data.split(',')[1]),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return a}
function ascii(s){return new TextEncoder().encode(s)}
function concat(parts){let n=parts.reduce((a,b)=>a+b.length,0),o=new Uint8Array(n),k=0;for(let b of parts){o.set(b,k);k+=b.length}return o}
async function savePDF(){
 let oldPage=state.page, oldDPI=DPI, [pw,ph]=pageMM(), jpgs=[];
 // Export at 300 dpi by temporarily rendering a high-resolution canvas through a scaled copy.
 const exportDPI=300/25.4;
 for(let pg=0;pg<state.pages;pg++){
   state.page=pg;
   let ec=document.createElement('canvas');ec.width=Math.round(pw*exportDPI);ec.height=Math.round(ph*exportDPI);
   let eg=ec.getContext('2d');eg.setTransform(exportDPI,0,0,exportDPI,0,0);eg.fillStyle='#fff';eg.fillRect(0,0,pw,ph);
   // temporarily redirect drawing context/canvas-independent drawing helpers
   let saveCtx=ctx;
   // replicate page drawing using local context
   state.slots=layout();
   state.slots.forEach((sl,i)=>{let q=photoForSlot(i);if(q){drawTo(eg,q.p,sl);}else{eg.fillStyle='#f4f4f4';eg.fillRect(sl.x,sl.y,sl.w,sl.h);}});
   if($('cropMarks').checked) drawSheetCropMarks(eg,state.slots);
   jpgs.push(b64bytes(ec.toDataURL('image/jpeg',0.96)));
 }
 state.page=oldPage;render();
 function drawTo(g,p,sl){let old=ctx;try{ctx=g;if($('mode').value==='polaroid')drawPolaroid(p,sl);else drawPhoto(p,sl)}finally{ctx=old}}
 let objs=[null], kids=[]; const pageW=pw*72/25.4,pageH=ph*72/25.4;
 // 1 catalog, 2 pages; each page has image+contents objects
 objs[1]=ascii('<< /Type /Catalog /Pages 2 0 R >>');
 for(let i=0;i<jpgs.length;i++){let pageObj=3+i*3,imgObj=4+i*3,contentObj=5+i*3;kids.push(`${pageObj} 0 R`);let img=jpgs[i];objs[imgObj]=concat([ascii(`<< /Type /XObject /Subtype /Image /Width ${Math.round(pw*exportDPI)} /Height ${Math.round(ph*exportDPI)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`),img,ascii('\nendstream')]);let cmd=ascii(`q\n${pageW.toFixed(3)} 0 0 ${pageH.toFixed(3)} 0 0 cm\n/Im0 Do\nQ\n`);objs[contentObj]=concat([ascii(`<< /Length ${cmd.length} >>\nstream\n`),cmd,ascii('endstream')]);objs[pageObj]=ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(3)} ${pageH.toFixed(3)}] /Resources << /XObject << /Im0 ${imgObj} 0 R >> >> /Contents ${contentObj} 0 R >>`)}
 objs[2]=ascii(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${jpgs.length} >>`);
 let parts=[ascii('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')],offsets=[0],pos=parts[0].length;
 for(let i=1;i<objs.length;i++){offsets[i]=pos;let h=ascii(`${i} 0 obj\n`),t=ascii('\nendobj\n');parts.push(h,objs[i],t);pos+=h.length+objs[i].length+t.length}
 let xref=pos, x=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;for(let i=1;i<objs.length;i++)x+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';x+=`trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 parts.push(ascii(x));let blob=new Blob(parts,{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='FBPrint_Fotos.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)
}
render();
