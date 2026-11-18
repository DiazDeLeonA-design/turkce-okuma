import {h,sheet,closeSheet,toast,$} from './ui.js';
import {lookup,translate} from './dict.js';
import {addWord,isSaved,settings} from './store.js';
import * as tts from './tts.js';
import {norm} from './morph.js';

export function openWordSheet({word,sentence,start,bookTitle,bookId,onPlayFrom,onClose}){
  const clean=word.replace(/[’‘`´]/g,"'");
  const speakBtn=h('button',{class:'icon-btn big','aria-label':'Listen',onclick:()=>tts.speakWord(clean.replace(/'/g,''))},'🔊');
  const trInp=h('input',{class:'inp',type:'text',placeholder:'translation (you can edit)','aria-label':'Translation'});
  const trBox=h('div',{class:'tr-box'},h('div',{class:'loading'},'Translating…'));
  const morphBox=h('div',{class:'morph'},h('div',{class:'loading'},'Analysing word…'));
  const dictBox=h('div',{class:'dict'});
  const sentBox=h('div',{class:'sent-box'});
  const saveBtn=h('button',{class:'btn primary',disabled:true},'⭐ Save word');
  let state={};
  const root=h('div',{class:'wsheet'},
    h('div',{class:'w-head'},h('h2',{class:'w-title',id:'popup-word'},clean),speakBtn),
    trBox,morphBox,dictBox,
    h('div',{class:'sentence-ctx'},h('div',{class:'lbl'},'In this sentence'),
      h('div',{class:'ctx-text',html:highlight(sentence,clean,start)}),
      h('div',{class:'row wrap'},
        h('button',{class:'btn small',id:'btn-tsent',onclick:async e=>{
          const b=e.target;b.disabled=true;b.textContent='Translating…';
          try{const r=await translate(sentence);sentBox.replaceChildren(h('div',{class:'sent-tr'},r.text),h('div',{class:'via'},'via '+r.via));b.textContent='Translate whole sentence'}
          catch(err){sentBox.replaceChildren(h('div',{class:'err'},'Couldn’t translate right now. '+err.message));b.textContent='Try again'}
          b.disabled=false}},'Translate whole sentence'),
        h('button',{class:'btn small',onclick:()=>tts.speak(sentence.replace(/^[–—-]\s*/,''),{})},'🔊 Hear sentence'),
        onPlayFrom&&h('button',{class:'btn small',onclick:()=>{closeSheet();onClose?.();onPlayFrom()}},'▶ Read from here')),
      sentBox),
    h('div',{class:'save-row'},trInp,saveBtn));
  const refreshSaved=()=>{ if(isSaved(clean)){saveBtn.textContent='✓ Saved';saveBtn.disabled=true;saveBtn.classList.add('done')} };
  saveBtn.addEventListener('click',()=>{
    const r=addWord({word:clean,root:state.lemma||state.root||'',tr:trInp.value.trim(),rootTr:state.rootTr||'',ex:sentence,book:bookTitle||'',bookId:bookId||'',lang:settings.tl,parts:(state.parts||[]).map(p=>p.surface)});
    toast(r.dup?'Already in your words':'Saved to your words ⭐'); refreshSaved(); saveBtn.textContent='✓ Saved'; saveBtn.disabled=true;
  });
  const s=sheet(root,{onclose:onClose,cls:'tall'});
  refreshSaved();
  const render=(r)=>{
    state={...state,...r};
    if(r.tr!==undefined){ trBox.replaceChildren(h('div',{class:'tr-main'},r.tr),h('div',{class:'via'},'Machine translation · via '+(r.via||'')));if(!trInp.value)trInp.value=r.tr; saveBtn.disabled=saveBtn.classList.contains('done'); }
    if(r.trError&&!state.tr){ trBox.replaceChildren(h('div',{class:'err'},'Couldn’t reach the translation service right now (it may be rate-limited). The dictionary below still works — or type your own translation and save.'),h('button',{class:'btn small',onclick:()=>{trBox.replaceChildren(h('div',{class:'loading'},'Translating…'));translate(clean).then(x=>render({tr:x.text,via:x.via})).catch(e=>render({trError:e.message}))}},'Retry')); saveBtn.disabled=saveBtn.classList.contains('done'); }
    if(r.cands!==undefined||r.parts!==undefined||r.done) renderMorph();
    if(r.wikt||r.done||r.rootTr) renderDict();
  };
  function renderMorph(){
    const st=state; const parts=st.parts||[]; const stem=st.stem;
    if(!st.done&&!stem&&!(st.best)){return}
    const useParts=st.done?parts:(st.best?st.best.parts:[]);
    const useStem=st.done?stem:(st.best&&st.best.stem);
    const kids=[h('div',{class:'lbl'},'Word breakdown ',h('span',{class:'tag guess'},st.done&&st.exact?'best guess · root found in dictionary':'best guess'))];
    if(useStem&&useParts.length){
      const chips=[h('div',{class:'chip root'},h('b',null,useStem),h('small',null,'root'))];
      for(const p of useParts) chips.push(h('div',{class:'chip'},h('b',null,'+'+p.surface),h('small',null,p.gloss)));
      kids.push(h('div',{class:'chips'},chips));
      if(st.lemma&&norm(st.lemma)!==norm(useStem)) kids.push(h('div',{class:'note'},'Dictionary form: ',h('b',null,st.lemma)));
    } else if(st.done){
      kids.push(h('div',{class:'note'},st.lemma&&norm(st.lemma)===norm(clean)?'This looks like a dictionary form (no suffixes found).':'No clear suffixes found.'));
    } else kids.push(h('div',{class:'loading'},'Checking dictionary…'));
    morphBox.replaceChildren(...kids);
  }
  function renderDict(){
    const st=state; const kids=[];
    if(st.wikt){
      kids.push(h('div',{class:'lbl'},'Dictionary (Wiktionary) – ',h('b',null,st.lemma),st.rootTr&&norm(st.rootTr)!==norm(st.lemma)?h('span',{class:'root-tr'},' · '+st.rootTr):null));
      for(const e of st.wikt.entries.slice(0,2)){
        kids.push(h('div',{class:'pos'},e.pos));
        kids.push(h('ol',{class:'defs'},e.defs.filter(d=>!d.form).slice(0,3).map(d=>h('li',null,d.t.length>140?d.t.slice(0,140)+'…':d.t))));
      }
      kids.push(h('a',{class:'src',href:st.wikt.url,target:'_blank',rel:'noopener'},'Open on Wiktionary ↗'));
    } else if(st.done){
      kids.push(h('div',{class:'lbl'},'Dictionary'),h('div',{class:'note'},'No Wiktionary entry found for this word or its root guesses. Rely on the translation above.'));
    }
    dictBox.replaceChildren(...kids);
  }
  lookup(clean,render).then(()=>{}).catch(e=>{trBox.replaceChildren(h('div',{class:'err'},'Lookup failed: '+e.message))});
  // speak the word on open (user gesture just happened)
  tts.speakWord(clean.replace(/'/g,''));
  return s;
}
function highlight(sentence,word,start){
  const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const i=(start!=null&&sentence.slice(start,start+word.length)===word)?start:sentence.indexOf(word);
  if(i<0) return esc(sentence);
  return esc(sentence.slice(0,i))+'<mark>'+esc(word)+'</mark>'+esc(sentence.slice(i+word.length));
}
