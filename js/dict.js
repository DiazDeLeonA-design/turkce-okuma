import {analyze,infinitive,norm} from './morph.js';
import {cacheGet,cacheSet,settings} from './store.js';

async function getJSON(url,ms=8000,asText=false){
  const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),ms);
  try{
    const r=await fetch(url,{signal:ctl.signal});
    if(r.status===404) return {__404:true};
    if(!r.ok) throw new Error('HTTP '+r.status);
    return asText?await r.text():await r.json();
  } finally{clearTimeout(t)}
}
const strip=html=>{const d=document.createElement('div');d.innerHTML=html;d.querySelectorAll('style,sup').forEach(x=>x.remove());return d.textContent.replace(/\s+/g,' ').trim()};

/** Wiktionary (en) – Turkish section only. Returns null if no Turkish entry. */
export async function wikt(word){
  const key='w:'+word; const c=cacheGet(key); if(c!==undefined) return c;
  let res=null;
  try{
    const j=await getJSON('https://en.wiktionary.org/api/rest_v1/page/definition/'+encodeURIComponent(word));
    if(!j.__404 && j.tr){
      const entries=[]; let formOf=null,allForms=true;
      for(const e of j.tr){
        const defs=[];
        for(const d of e.definitions||[]){
          const txt=strip(d.definition); if(!txt) continue;
          const isForm=/form-of-definition/.test(d.definition);
          if(isForm){const m=d.definition.match(/form-of-definition-link[^>]*>.*?title="([^"]+)"/s); if(m&&!formOf) formOf=m[1]}
          else allForms=false;
          defs.push({t:txt,form:isForm});
        }
        if(defs.length) entries.push({pos:e.partOfSpeech,defs:defs.slice(0,5)});
      }
      if(entries.length) res={entries:entries.slice(0,3),formOf:allForms?formOf:null,url:'https://en.wiktionary.org/wiki/'+encodeURIComponent(word)+'#Turkish'};
    }
    cacheSet(key,res);
  }catch(e){ return undefined; } // network problem: don't cache
  return res;
}

// ---- translation (free, no key): Google web endpoints -> MyMemory
async function tGoogleA(q,tl){
  const j=await getJSON('https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=tr&tl='+tl+'&q='+encodeURIComponent(q));
  const t=Array.isArray(j)?(Array.isArray(j[0])?j[0][0]:j[0]):null; if(!t) throw new Error('empty'); return t;
}
async function tGoogleB(q,tl){
  const j=await getJSON('https://translate.googleapis.com/translate_a/single?client=gtx&sl=tr&tl='+tl+'&dt=t&q='+encodeURIComponent(q));
  const t=(j[0]||[]).map(x=>x[0]).join(''); if(!t) throw new Error('empty'); return t;
}
async function tMyMemory(q,tl){
  const j=await getJSON('https://api.mymemory.translated.net/get?q='+encodeURIComponent(q)+'&langpair=tr|'+tl);
  const t=j.responseData&&j.responseData.translatedText;
  if(!t||j.responseStatus===429||/MYMEMORY WARNING/i.test(t)) throw new Error('quota');
  return t;
}
export async function translate(text,tl=settings.tl){
  const key=`t:${tl}:${text}`; const c=cacheGet(key); if(c) return c;
  const errs=[];
  for(const [via,fn] of [['Google',tGoogleA],['Google',tGoogleB],['MyMemory',tMyMemory]]){
    try{ const t=await fn(text,tl); if(t&&t.toLowerCase()!==text.toLowerCase()||t){const r={text:t,via}; cacheSet(key,r); return r;} }catch(e){errs.push(via+': '+e.message)}
  }
  const err=new Error('Translation services unavailable ('+errs.join('; ')+')'); throw err;
}

/** Full lookup for one tapped word. onUpdate(partial) is called as data arrives. */
export async function lookup(rawWord,onUpdate=()=>{}){
  const apos=rawWord.replace(/[’‘`´]/g,"'");
  const [left]=apos.split("'"); const hasApos=apos.includes("'");
  const w=norm(apos).replace(/'/g,'');
  const cands=analyze(w,hasApos?{fixedRoot:left}:{}).slice(0,16);
  const res={word:rawWord,norm:w,cands,best:cands[1]||cands[0]||null,parts:null,root:null,lemma:null,wikt:null,tr:null,rootTr:null,via:null,errors:[]};
  onUpdate({...res});
  // translation of the tapped form (parallel with dictionary)
  const trP=translate(rawWord.replace(/'/g,'’')).then(r=>{res.tr=r.text;res.via=r.via;onUpdate({tr:r.text,via:r.via})}).catch(e=>{res.errors.push(e.message);onUpdate({trError:e.message})});
  // dictionary: query candidate roots (and infinitives) in parallel, pick first hit in cost order
  const queries=[]; const seen=new Set();
  const add=(k)=>{if(k&&!seen.has(k)){seen.add(k);queries.push(k)}};
  for(const c of cands){ if(c.verbHint) add(infinitive(c.root)); add(c.root); }
  for(const c of cands.slice(0,8)) add(infinitive(c.root));
  const results=new Map();
  await Promise.all(queries.slice(0,24).map(async q=>results.set(q,await wikt(q))));
  let hit=null;
  const order=[]; for(const c of cands){ if(c.verbHint) order.push([infinitive(c.root),c]); order.push([c.root,c]); }
  for(const c of cands.slice(0,8)) order.push([infinitive(c.root),c]);
  for(const [q,c] of order){const e=results.get(q); if(e){hit={q,c,e};break}}
  if(results.size&&[...results.values()].every(v=>v===undefined)) res.errors.push('Wiktionary unreachable');
  if(hit){
    let lemma=hit.q, entry=hit.e;
    if(entry.formOf){ const t=norm(entry.formOf); const e2=await wikt(t); lemma=t; if(e2) entry=e2; }
    res.lemma=lemma; res.wikt=entry;
    // choose the suffix chain that explains this lemma
    const base=hit.c; let chain=base;
    const stemOf=l=>l.replace(/(mak|mek)$/,'');
    const match=cands.find(c=>c.root===lemma||c.root===stemOf(lemma)||c.stem===lemma||c.stem===stemOf(lemma));
    chain=match||base;
    res.root=chain.root; res.stem=chain.stem; res.parts=chain.parts;
    res.exact=true;
  } else if(res.best){
    res.root=res.best.root; res.stem=res.best.stem; res.parts=res.best.parts; res.exact=false;
  }
  onUpdate({lemma:res.lemma,wikt:res.wikt,root:res.root,stem:res.stem,parts:res.parts,exact:res.exact,done:true});
  // meaning of root (only if different from the tapped form)
  if(res.lemma && norm(res.lemma)!==w){
    translate(res.lemma).then(r=>{res.rootTr=r.text;onUpdate({rootTr:r.text})}).catch(()=>{});
  }
  await trP;
  return res;
}
