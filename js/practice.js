import {h,$,toast,shuffle,confirmBox} from './ui.js';
import {getVocab,dueCards,grade,mastered,bump,dayStats} from './store.js';
import {SCENES} from './scenes-data.js';
import * as tts from './tts.js';

const fmt=d=>d<1?'<1d':d<30?Math.round(d)+'d':Math.round(d/30)+'mo';
function nextInt(c,q){ // preview of what grade would schedule
  if(q<3) return 0.0007; const n=c.n||0; if(n===0) return q===5?3:1; if(n===1) return q===5?8:q===3?3:6; return Math.max(1,Math.round((c.int||1)*(q===3?1.2:(c.ef||2.5)*(q===5?1.3:1))));
}
export function practiceHome(root){
  const v=getVocab(); const due=dueCards(); const dueF=dueCards(['f']).length,dueB=dueCards(['b']).length;
  const st=dayStats();
  const mode=(label,sub,fn,id,disabled)=>h('button',{class:'mode',id,disabled:disabled||null,onclick:fn},h('b',null,label),h('small',null,sub));
  root.replaceChildren(
    h('div',{class:'page-h'},h('h1',null,'Practice'),h('p',{class:'sub'},v.length?`${v.length} saved words · ${mastered()} mastered · reviewed today: ${st.reviewed||0}`:'Save words while you read, then practise them here.')),
    h('div',{class:'due-card'},h('div',{class:'due-n',id:'due-count'},String(due.length)),h('div',null,h('b',null,'cards due now'),h('small',null,` Türkçe→English ${dueF} · English→Türkçe ${dueB}`))),
    v.length===0?h('div',{class:'empty'},h('p',null,'No words yet.'),h('p',null,'Tap words in a story, or open a picture and save words — then come back.'),h('div',{class:'row center'},h('a',{class:'btn primary',href:'#/library'},'Open library'),h('a',{class:'btn',href:'#/scenes'},'Picture words'))):
    h('div',{class:'modes'},
      mode('Flashcards · mixed','both directions, due cards first',()=>flash(root,['f','b']),'m-mixed',!due.length),
      mode('Türkçe → English','see Turkish, recall meaning',()=>flash(root,['f']),'m-tr',!dueF),
      mode('English → Türkçe','see English, recall Turkish',()=>flash(root,['b']),'m-en',!dueB),
      mode('Quick quiz','10 multiple-choice questions',()=>quiz(root),'m-quiz',false),
      !due.length?h('p',{class:'sub center'},'Nothing due — you’re all caught up! You can still take the quiz.'):null));
}
function flash(root,dirs){
  let queue=shuffle(dueCards(dirs)).slice(0,25); const total=queue.length; let done=0,again=0;
  if(!total) return practiceHome(root);
  function showCard(){
    if(!queue.length){
      root.replaceChildren(h('div',{class:'result'},h('div',{class:'big-score'},'🎉'),h('h2',null,'Session complete'),h('p',null,`${done} reviews · ${again} “again”`),h('div',{class:'row center'},h('button',{class:'btn primary',onclick:()=>practiceHome(root)},'Done'))));
      return;
    }
    const {e,dir,c}=queue[0]; const front=dir==='f'?e.word:e.tr||'(no translation)';
    let revealed=false;
    const back=h('div',{class:'fc-back hidden'},
      h('div',{class:'fc-ans',id:'fc-ans'},dir==='f'?(e.tr||'—'):e.word),
      e.root&&e.root.toLowerCase()!==e.word.toLowerCase()?h('div',{class:'fc-root'},'root: ',h('b',null,e.root),e.rootTr?' · '+e.rootTr:''):null,
      dir==='f'&&e.rootTr&&!e.root?null:null,
      e.ex?h('div',{class:'fc-ex'},'“'+e.ex+'”'):null,
      e.book?h('div',{class:'fc-src'},e.book):null);
    const grades=h('div',{class:'grades hidden'},[['Again',1,'bad'],['Hard',3,''],['Good',4,'good'],['Easy',5,'']].map(([l,q,cls])=>h('button',{class:'grade '+cls,'data-q':q,onclick:()=>{
      grade(e.id,dir,q); done++; const item=queue.shift(); if(q<3){again++;queue.push({e:{...e},dir,c:{...c}}); /* re-ask later in session */ item.again=true}
      showCard();
    }},h('b',null,l),h('small',null,q<3?'<1m':fmt(nextInt(c,q))))));
    const showBtn=h('button',{class:'btn primary wide',id:'btn-show',onclick:()=>{back.classList.remove('hidden');grades.classList.remove('hidden');showBtn.remove();if(dir==='b')tts.speakWord(e.word)}},'Show answer');
    root.replaceChildren(
      h('div',{class:'topbar'},h('button',{class:'icon-btn',onclick:()=>practiceHome(root),'aria-label':'Back'},'‹'),h('div',{class:'tb-title'},h('b',null,'Flashcards'),h('small',null,`${Math.min(done+1,total)} / ${total}`)),h('span',null)),
      h('div',{class:'fc'},h('div',{class:'fc-dir'},dir==='f'?'Türkçe → English':'English → Türkçe'),
        h('div',{class:'fc-front',id:'fc-front'},front,h('button',{class:'icon-btn big','aria-label':'Listen',id:'fc-audio',onclick:()=>tts.speakWord(e.word)},'🔊')),
        back,showBtn,grades));
    if(dir==='f') setTimeout(()=>tts.speakWord(e.word),200);
  }
  showCard();
}
const DECOY_EN=[...new Set(SCENES.flatMap(s=>s.objs.map(o=>o.en)))], DECOY_TR=[...new Set(SCENES.flatMap(s=>s.objs.map(o=>o.tr)))];
function quiz(root){
  const vocab=getVocab().filter(e=>e.tr); if(vocab.length<1){toast('Save some words first');return}
  const qs=shuffle(vocab).slice(0,10).map(e=>({e,dir:Math.random()<.5?'f':'b'}));
  let i=0,score=0;
  function ask(){
    if(i>=qs.length){
      root.replaceChildren(h('div',{class:'result'},h('div',{class:'big-score',id:'quiz-score'},`${score}/${qs.length}`),h('p',null,score===qs.length?'Perfect! 🎉':'Nice work!'),h('div',{class:'row center'},h('button',{class:'btn primary',onclick:()=>quiz(root)},'Again'),h('button',{class:'btn',onclick:()=>practiceHome(root)},'Done'))));
      return;
    }
    const {e,dir}=qs[i]; const correct=dir==='f'?e.tr:e.word;
    const pool=shuffle(dir==='f'?[...vocab.map(x=>x.tr),...DECOY_EN]:[...vocab.map(x=>x.word),...DECOY_TR]).filter(x=>x&&x.toLowerCase()!==correct.toLowerCase());
    const uniq=[...new Set(pool)].slice(0,3);
    const opts=shuffle([correct,...uniq]);
    const fb=h('div',{class:'fb'});
    const btns=opts.map(o=>h('button',{class:'opt',onclick:ev=>{
      if(btns.some(b=>b.disabled)) return; btns.forEach(b=>b.disabled=true);
      const ok=o===correct; if(ok) score++; ev.currentTarget.classList.add(ok?'right':'wrong'); btns.find(b=>b.textContent===correct)?.classList.add('right');
      grade(e.id,dir,ok?4:1); tts.speakWord(e.word);
      fb.textContent=ok?'Doğru! ✓':'Not quite — it’s '+correct;
      setTimeout(()=>{i++;ask()},ok?900:1700);
    }},o));
    root.replaceChildren(
      h('div',{class:'topbar'},h('button',{class:'icon-btn',onclick:()=>practiceHome(root),'aria-label':'Back'},'‹'),h('div',{class:'tb-title'},h('b',null,'Quick quiz'),h('small',null,`${i+1} / ${qs.length} · score ${score}`)),h('span',null)),
      h('div',{class:'fc'},h('div',{class:'fc-dir'},dir==='f'?'What does this mean?':'How do you say this in Turkish?'),
        h('div',{class:'fc-front',id:'q-front'},dir==='f'?e.word:e.tr,h('button',{class:'icon-btn big','aria-label':'Listen',onclick:()=>tts.speakWord(e.word)},'🔊')),
        h('div',{class:'opts'},btns),fb));
    if(dir==='f') setTimeout(()=>tts.speakWord(e.word),200);
  }
  ask();
}
