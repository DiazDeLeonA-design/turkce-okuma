const P='trr.';
export const ls={
  get(k,d){try{const v=localStorage.getItem(P+k);return v==null?d:JSON.parse(v)}catch{return d}},
  set(k,v){try{localStorage.setItem(P+k,JSON.stringify(v))}catch(e){console.warn('storage full',e)}},
  del(k){localStorage.removeItem(P+k)}
};
const DEF={tl:'en',rate:0.85,voice:'',theme:'auto',slowGap:350,fs:1.15,slow:false};
export const settings=Object.assign({},DEF,ls.get('settings',{}));
export function saveSettings(){ls.set('settings',settings);applyTheme()}
export function applyTheme(){
  const r=document.documentElement;
  if(settings.theme==='auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme',settings.theme);
  r.style.setProperty('--fs',settings.fs+'rem');
}
const pad=n=>String(n).padStart(2,'0');
export const dayKey=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
// ---- activity / streak
export function bump(kind,n=1){
  const days=ls.get('days',{}); const k=dayKey(); days[k]=days[k]||{};
  days[k][kind]=(days[k][kind]||0)+n; ls.set('days',days);
}
export const dayStats=(k=dayKey())=>ls.get('days',{})[k]||{};
const active=o=>!!o&&((o.saved||0)+(o.reviewed||0)+(o.game||0)>0||(o.read||0)>=3);
export function streak(){
  const days=ls.get('days',{}); let d=new Date(), cur=0;
  if(!active(days[dayKey(d)])) d.setDate(d.getDate()-1);
  while(active(days[dayKey(d)])){cur++;d.setDate(d.getDate()-1)}
  const keys=Object.keys(days).filter(k=>active(days[k])).sort(); let best=0,run=0,prev=null;
  for(const k of keys){const dt=new Date(k+'T12:00:00'); if(prev&&Math.round((dt-prev)/864e5)===1) run++; else run=1; best=Math.max(best,run); prev=dt}
  return {current:cur,best:Math.max(best,cur),todayDone:active(days[dayKey()]),last7:[...Array(7)].map((_,i)=>{const x=new Date();x.setDate(x.getDate()-(6-i));return {k:dayKey(x),on:active(days[dayKey(x)]),dow:'SMTWTFS'[x.getDay()]}})};
}
// ---- vocabulary + SM-2
export const getVocab=()=>ls.get('vocab',[]);
export const setVocab=v=>ls.set('vocab',v);
const newCard=()=>({n:0,ef:2.5,int:0,due:0,lapses:0});
export function addWord(e){
  const v=getVocab(); const key=e.word.toLocaleLowerCase('tr');
  const ex=v.find(x=>x.word.toLocaleLowerCase('tr')===key);
  if(ex) return {dup:true,entry:ex};
  const entry={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),date:new Date().toISOString(),cards:{f:newCard(),b:newCard()},...e};
  v.unshift(entry); setVocab(v); bump('saved'); return {dup:false,entry};
}
export function updateWord(id,patch){const v=getVocab();const i=v.findIndex(x=>x.id===id);if(i>=0){Object.assign(v[i],patch);setVocab(v)}}
export function removeWord(id){setVocab(getVocab().filter(x=>x.id!==id))}
export const isSaved=w=>getVocab().some(x=>x.word.toLocaleLowerCase('tr')===w.toLocaleLowerCase('tr'));
export function grade(id,dir,q){ // q: 1 again, 3 hard, 4 good, 5 easy
  const v=getVocab(); const e=v.find(x=>x.id===id); if(!e) return;
  const c=e.cards[dir]=e.cards[dir]||newCard(); const now=Date.now();
  if(q<3){c.n=0;c.int=0;c.lapses++;c.due=now+60e3;}
  else{
    if(c.n===0) c.int=q===5?3:1; else if(c.n===1) c.int=q===5?8:q===3?3:6; else c.int=Math.max(1,Math.round(c.int*(q===3?1.2:c.ef*(q===5?1.3:1))));
    c.n++; c.due=now+c.int*864e5;
  }
  c.ef=Math.max(1.3,c.ef+0.1-(5-q)*(0.08+(5-q)*0.02));
  c.last=now; setVocab(v); bump('reviewed');
}
export function dueCards(dirs=['f','b']){
  const now=Date.now(); const out=[];
  for(const e of getVocab()) for(const d of dirs){const c=e.cards[d]||newCard(); if((c.due||0)<=now) out.push({e,dir:d,c})}
  return out;
}
export const mastered=()=>getVocab().filter(e=>(e.cards.f.int||0)>=21&&(e.cards.b.int||0)>=21).length;
// ---- reading position & own books
export const getPos=id=>(ls.get('pos',{})[id]||{}).i||0;
export function setPos(id,i){const p=ls.get('pos',{});p[id]={i,t:Date.now()};ls.set('pos',p)}
export const lastBook=()=>{const p=ls.get('pos',{});let b=null;for(const k in p) if(!b||p[k].t>p[b].t) b=k;return b};
export const getUserBooks=()=>ls.get('userBooks',[]);
export const setUserBooks=v=>ls.set('userBooks',v);
// ---- lookup cache (bounded)
let cache=ls.get('cache',{}),dirty=false;
export const cacheGet=k=>cache[k]?.v;
export function cacheSet(k,v){cache[k]={v,t:Date.now()};dirty=true;clearTimeout(cacheSet._t);cacheSet._t=setTimeout(flushCache,400)}
export function flushCache(){
  if(!dirty) return; dirty=false;
  const keys=Object.keys(cache); if(keys.length>1800){keys.sort((a,b)=>cache[a].t-cache[b].t).slice(0,400).forEach(k=>delete cache[k])}
  ls.set('cache',cache);
}
