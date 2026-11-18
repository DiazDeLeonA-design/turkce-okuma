export function h(tag,attrs,...kids){
  const el=document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(v==null||v===false) continue;
    if(k==='class') el.className=v; else if(k==='html') el.innerHTML=v;
    else if(k.startsWith('on')) el.addEventListener(k.slice(2),v);
    else if(k==='style'&&typeof v==='object') Object.assign(el.style,v);
    else el.setAttribute(k,v===true?'':v);
  }
  for(const c of kids.flat()){ if(c==null||c===false) continue; el.append(c.nodeType?c:document.createTextNode(c)); }
  return el;
}
export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
let toastT;
export function toast(msg,ms=2200){
  let t=$('#toast'); if(!t){t=h('div',{id:'toast',role:'status'});document.body.append(t)}
  t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms);
}
export function sheet(content,{onclose,cls=''}={}){
  closeSheet();
  const back=h('div',{class:'sheet-back',id:'sheet-back',onclick:e=>{if(e.target===back){closeSheet();onclose?.()}}});
  const s=h('div',{class:'sheet '+cls,role:'dialog','aria-modal':'true'},
    h('button',{class:'sheet-x','aria-label':'Close',onclick:()=>{closeSheet();onclose?.()}},'×'),content);
  back.append(s); document.body.append(back); requestAnimationFrame(()=>back.classList.add('open'));
  return s;
}
export function closeSheet(){const b=$('#sheet-back');if(b)b.remove()}
export function confirmBox(msg){return new Promise(res=>{
  const s=sheet(h('div',{class:'confirm'},h('p',null,msg),h('div',{class:'row end'},
    h('button',{class:'btn ghost',onclick:()=>{closeSheet();res(false)}},'Cancel'),
    h('button',{class:'btn danger',onclick:()=>{closeSheet();res(true)}},'Delete'))),{onclose:()=>res(false)});
})}
export function promptBox(title,value=''){return new Promise(res=>{
  const inp=h('input',{type:'text',value,class:'inp',autocapitalize:'off'});
  sheet(h('div',{class:'confirm'},h('h3',null,title),inp,h('div',{class:'row end'},
    h('button',{class:'btn ghost',onclick:()=>{closeSheet();res(null)}},'Cancel'),
    h('button',{class:'btn primary',onclick:()=>{closeSheet();res(inp.value.trim())}},'Save'))),{onclose:()=>res(null)});
  setTimeout(()=>inp.focus(),50);
})}
export const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}
