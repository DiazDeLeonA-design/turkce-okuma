// Best-effort Turkish suffix analyser. Rule based (vowel harmony aware). Results are GUESSES;
// the dictionary lookup in dict.js decides which root actually exists.
export function norm(w){
  return String(w).replace(/[’‘`´]/g,"'").replace(/İ/g,'i').replace(/I/g,'ı').toLowerCase();
}
const VOW='aeıioöuü';
const isV=c=>VOW.includes(c);
const VOICELESS='çfhkpsşt';
const lastVowel=s=>{for(let i=s.length-1;i>=0;i--) if(isV(s[i])) return s[i];return 'e'};
const endsV=s=>isV(s[s.length-1]||'');
const harmA=s=>'aıou'.includes(lastVowel(s))?'a':'e';
const harmI=s=>({a:'ı',ı:'ı',e:'i',i:'i',o:'u',u:'u',ö:'ü',ü:'ü'})[lastVowel(s)];
export function expand(tpl,stem){
  let cur=stem;
  for(const m of tpl.matchAll(/\((.)\)|(.)/gu)){
    const buf=m[1], t=m[2]; let add='';
    if(buf){
      if(buf==='I'){ if(!endsV(cur)) add=harmI(cur); }
      else if(endsV(cur)) add=buf;
    } else if(t==='A') add=harmA(cur);
    else if(t==='I') add=harmI(cur);
    else if(t==='D') add=VOICELESS.includes(cur[cur.length-1])?'t':'d';
    else if(t==='C') add=VOICELESS.includes(cur[cur.length-1])?'ç':'c';
    else add=t;
    cur+=add;
  }
  return cur.slice(stem.length);
}
// key, template, English label, cost, optional constraints
const S=(key,tpl,gloss,cost=1,extra={})=>({key,tpl,gloss,cost,...extra});
export const TEMPLATES=[
  // nouns
  S('pl','lAr','plural (more than one) – also “they” on verbs'),
  S('poss1sg','(I)m','my (noun) / I (verb)',1),
  S('poss2sg','(I)n','your (noun) / you (verb: -dIn)',1.2),
  S('poss3','(s)I','his / her / its',1),
  S('poss1pl','(I)mIz','our',1),
  S('poss2pl','(I)nIz','your (plural/formal)',1),
  S('acc','(y)I','direct object marker (accusative)'),
  S('dat','(y)A','to / toward (dative)'),
  S('loc','DA','in / at / on (locative)'),
  S('abl','DAn','from / out of (ablative)'),
  S('gen','(n)In','of / ’s (genitive)'),
  S('ins','(y)lA','with / by means of (instrumental)',1.2),
  S('acc_n','nI','direct object marker after his/her/its (-nI)',1,{needNext:'poss3'}),
  S('dat_n','nA','to / toward after his/her/its (-nA)',1,{needNext:'poss3'}),
  S('loc_n','ndA','in / at / on after his/her/its (-ndA)',1,{needNext:'poss3'}),
  S('abl_n','ndAn','from after his/her/its (-ndAn)',1,{needNext:'poss3'}),
  S('gen_n','nIn','of / ’s after his/her/its (-nIn)',1,{needNext:'poss3'}),
  S('ki','ki','“the one at/of …” (-ki relative)',2),
  S('lI','lI','with / having (-lI)',2),
  S('sIz','sIz','without (-sIz)',2),
  S('lIk','lIk','-ness / -ship / for (-lIk)',2),
  S('CI','CI','person who does / sells (-cI)',2),
  S('CA','CA','-ly / like / in the manner of (-CA)',2.2),
  // verbs
  S('inf','mAk','to … (infinitive, -mAk)',1),
  S('vn','mA','verbal noun -mA (“the act of …”)',1.5),
  S('neg','mA','negative “not” (-mA)',1,{}),
  S('neg_i','mI','negative “not” before -Iyor (-mI)',1,{before:'prog'}),
  S('prog','(I)yor','is …-ing (present continuous, -Iyor)',1),
  S('past','DI','did … (past, -DI)',1),
  S('evid','mIş','reportedly / apparently did (-mIş)',1),
  S('fut','(y)AcAk','will … (future, -AcAk)',1),
  S('fut_g','(y)AcAğ','will … (future, -AcAğ before a vowel)',1),
  S('aor','Ar','does … habitually / will (aorist, -Ar)',1.3),
  S('aor','Ir','does … habitually / will (aorist, -Ir)',1.2),
  S('aor','r','does … habitually / will (aorist, -r)',1.2,{needV:true}),
  S('cond','sA','if … (conditional, -sA)',1.2),
  S('nec','mAlI','must / should (-mAlI)',1.2),
  S('abil','(y)AbIl','can / be able to (-Abil)',1.5),
  S('caus','DIr','make/cause to … (causative, -DIr)',2.5),
  S('pass','(I)l','is being … (passive, -Il)',2.5),
  S('part_dik','DIk','participle “that I/we …-ed” (-DIk)',1.8),
  S('part_dig','DIğ','participle (-DIğ + ending)',1.8),
  S('part_an','An','participle “who …-s / …-ing” (-An)',2),
  S('ger_arak','(y)ArAk','by …-ing / while (-ArAk)',1.8),
  S('ger_inca','(y)IncA','when / upon …-ing (-IncA)',1.8),
  S('ger_ken','(y)ken','while (-ken)',1.8),
  S('ger_ip','(y)Ip','…-ing and then / having … (-Ip)',1.8),
  // person endings on verbs
  S('v1sg','(y)Im','I (am / will …) (1st person singular)',1.2),
  S('v2sg','sIn','you (singular)',1.2),
  S('v1pl','(y)Iz','we (1st person plural)',1.2),
  S('v1pl_k','k','we (after -DI / -sA)',2.3),
  S('v2pl','sInIz','you (plural / formal)',1.2),
  S('v1sg_m','m','I (after -DI / -sA / -mIş)',2.3),
];
// all surface variants per template
const VARIANTS=new Map();
for(const t of TEMPLATES){
  const set=new Set();
  for(const v of VOW) for(const tail of ['','t','l']){
    const stem='m'+v+tail;
    set.add(expand(t.tpl,stem));
  }
  VARIANTS.set(t,[...set].filter(Boolean).sort((a,b)=>b.length-a.length));
}
const hasV=s=>[...s].some(isV);
const CASES=new Set(['acc','dat','loc','abl','ins','acc_n','dat_n','loc_n','abl_n']);
function dfs(stem,chain,depth,out,lock){
  const pending=chain[0]&&chain[0].t.needNext;
  if(!pending) out.push({stem,chain:chain.slice()});
  if(depth>=4) return;
  for(const t of TEMPLATES){
    if(pending && t.key!==pending) continue;
    if(t.before && !(chain[0]&&chain[0].t.key===t.before)) continue;
    if(chain.some(c=>c.t.key===t.key)) continue;
    if((t.key==='gen'||t.key==='gen_n')&&chain[0]&&CASES.has(chain[0].t.key)) continue;
    for(const v of VARIANTS.get(t)){
      if(!stem.endsWith(v)) continue;
      const rest=stem.slice(0,-v.length);
      if(rest.length<(lock||2)||!hasV(rest)) continue;
      if(lock&&rest.length<lock) continue;
      if(expand(t.tpl,rest)!==v) continue;
      if(t.needV&&!endsV(rest)) continue;
      chain.unshift({t,surface:v});
      dfs(rest,chain,depth+1,out,lock);
      chain.shift();
    }
  }
}
function rootForms(stem){
  const forms=[[stem,0]];
  const last=stem[stem.length-1];
  const soft={b:'p',c:'ç',d:'t',ğ:'k',g:'k'};
  if(soft[last]) forms.push([stem.slice(0,-1)+soft[last],0.2]);
  if(last==='ğ') forms.push([stem.slice(0,-1)+'g',0.4]);
  // vowel-drop nouns: burn->burun, ağz->ağız
  if(stem.length>=3 && !isV(last) && !isV(stem[stem.length-2])){
    const v=harmI(stem.slice(0,-1)); forms.push([stem.slice(0,-1)+v+last,0.6]);
  }
  return forms;
}
/** Returns candidates [{root, parts:[{surface,key,gloss}], cost}] best first. */
export function analyze(word,{fixedRoot}={}){
  const w=norm(word).replace(/'/g,'');
  const lock=fixedRoot?norm(fixedRoot).replace(/'/g,'').length:0;
  const raw=[];
  dfs(w,[],0,raw,lock);
  const cands=new Map();
  for(const r of raw){
    if(fixedRoot && r.stem!==norm(fixedRoot).replace(/'/g,'')) continue;
    let cost=r.chain.reduce((a,c)=>a+c.t.cost,0);
    if(r.stem.length<3) cost+=2;
    const parts=r.chain.map(c=>({surface:c.surface,key:c.t.key,gloss:c.t.gloss}));
    const hasProg=r.chain.some(c=>c.t.key==='prog');
    for(const [root,pen] of rootForms(r.stem)){
      const key=root;
      const c=cost+pen;
      if(!cands.has(key)||cands.get(key).cost>c) cands.set(key,{root,stem:r.stem,parts,cost:c,verbHint:r.chain.some(c=>['prog','past','evid','fut','fut_g','aor','cond','nec','abil','inf','neg','neg_i','v1sg','v2sg','v1pl','v2pl','part_dik','part_an','ger_arak','ger_inca','ger_ip','ger_ken'].includes(c.t.key))});
      if(hasProg){
        for(const v of ['a','e']) {
          const alt=root+v; const cc=c+0.3;
          if(!cands.has(alt)||cands.get(alt).cost>cc) cands.set(alt,{root:alt,stem:r.stem,parts,cost:cc,verbHint:true});
        }
      }
    }
  }
  return [...cands.values()].sort((a,b)=>a.cost-b.cost||b.root.length-a.root.length);
}
export function infinitive(root){return root+(harmA(root)==='a'?'mak':'mek');}
export function explain(parts,root){
  return [{surface:root,gloss:'root (dictionary form may differ)',root:true},...parts];
}
