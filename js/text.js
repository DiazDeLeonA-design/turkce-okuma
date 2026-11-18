const ABBR=/(?:\b(?:Dr|Prof|Doç|Bay|Hz|Sn|vs|vb|örn|St|Alb|Yrd|Müh|Av|Gen|Kur|Bkz|No)|(?:^|\s)[A-ZÇĞİÖŞÜ])\.$/;
const START=/^[A-ZÇĞİÖŞÜ“«"‘'(–—\-\d]/;
export function splitSentences(par){
  const out=[]; let start=0; const re=/([.!?…]+["”»’)]*)(\s+)/g; let m;
  while((m=re.exec(par))){
    const end=m.index+m[1].length; const before=par.slice(start,end);
    if(ABBR.test(before)) continue;
    if(!START.test(par.slice(m.index+m[0].length))) continue;
    out.push(before.trim()); start=m.index+m[0].length;
  }
  const rest=par.slice(start).trim(); if(rest) out.push(rest);
  // break very long sentences at ; : ,
  const final=[];
  for(let s of out){
    while(s.length>300){
      let cut=-1; for(const sep of ['; ',': ',', ']){const k=s.lastIndexOf(sep,260); if(k>120){cut=k+sep.length;break}}
      if(cut<0) break; final.push(s.slice(0,cut).trim()); s=s.slice(cut);
    }
    final.push(s.trim());
  }
  return final.filter(Boolean);
}
export const WORD_RE=/[\p{L}\p{M}\d]+(?:['’][\p{L}\p{M}]+)*/gu;
export function tokenize(text){
  const words=[]; for(const m of text.matchAll(WORD_RE)) words.push({text:m[0],start:m.index,end:m.index+m[0].length});
  return words;
}
/** Convert a book's paragraphs into a flat sentence list. */
export function buildSentences(paras){
  const sents=[];
  paras.forEach((p,pi)=>{
    if(p.h){sents.push({text:p.h,kind:'h',para:pi});return}
    for(const t of splitSentences(p.t)) sents.push({text:t,kind:'s',para:pi});
  });
  sents.forEach((s,i)=>{s.i=i;s.skip=(s.text.match(/^[–—-]\s*/)||[''])[0].length;s.speak=s.text.slice(s.skip).replace(/[«»“”"]/g,'').replace(/…/g,'...');s.words=tokenize(s.text)});
  return sents;
}
export const wordCount=paras=>paras.reduce((a,p)=>a+((p.t||p.h||'').split(/\s+/).length),0);
export function parsePasted(title,text){
  const paras=text.split(/\n+/).map(x=>x.trim()).filter(Boolean).map(t=>({t}));
  return {id:'u-'+Date.now().toString(36),title:title||'My text',author:'Pasted by you',level:'Own',desc:'Your own text.',source:'Pasted text',license:'Your own text',paras,user:true,pages:[]};
}
