import {h,$,$$,toast} from './ui.js';
import {buildSentences} from './text.js';
import {settings,saveSettings,getPos,setPos,bump} from './store.js';
import * as tts from './tts.js';
import {openWordSheet} from './popup.js';

let S=null;
export function stopReader(){ if(S){S.playing=false;clearTimeout(S.timer);tts.cancel();S=null} }

export function renderReader(root,book,{onBack}={}){
  stopReader();
  const sents=buildSentences(book.paras);
  S={book,sents,idx:Math.min(getPos(book.id),sents.length-1),playing:false,timer:null,wordEl:null};
  const body=h('div',{class:'reader-body',style:{fontSize:'var(--fs)'}});
  // build DOM
  let curP=null,lastPara=-1;
  for(const s of sents){
    if(s.para!==lastPara){ curP=h(s.kind==='h'?'h3':'p',{class:s.kind==='h'?'story-title':'para'}); body.append(curP); lastPara=s.para }
    const span=h('span',{class:'s','data-i':s.i});
    let pos=0;
    for(const w of s.words){
      if(w.start>pos) span.append(s.text.slice(pos,w.start));
      span.append(h('span',{class:'w','data-s':w.start},w.text)); pos=w.end;
    }
    if(pos<s.text.length) span.append(s.text.slice(pos));
    span.append(' ');
    s.el=span; s.wordEls=[...span.querySelectorAll('.w')];
    curP.append(span);
  }
  const playBtn=h('button',{class:'ctl play',id:'btn-play','aria-label':'Play',onclick:()=>S.playing?pause():playFrom(S.idx)},'▶');
  const prog=h('div',{class:'bar'},h('i'));
  const rateLbl=h('span',{class:'rate-lbl'},settings.rate.toFixed(2)+'×');
  const rate=h('input',{type:'range',min:'0.5',max:'1.2',step:'0.05',value:settings.rate,id:'rate','aria-label':'Speech speed',oninput:e=>{settings.rate=+e.target.value;rateLbl.textContent=settings.rate.toFixed(2)+'×';saveSettings()},onchange:()=>{if(S&&S.playing)speakCurrent()}});
  const slowBtn=h('button',{class:'chipbtn'+(settings.slow?' on':''),id:'btn-slow',title:'Word-by-word slow reading',onclick:e=>{settings.slow=!settings.slow;saveSettings();e.currentTarget.classList.toggle('on',settings.slow);toast(settings.slow?'Word-by-word mode on 🐢':'Sentence mode');if(S&&S.playing)speakCurrent()}},'🐢 Word by word');
  const gap=h('input',{type:'range',min:'0',max:'1200',step:'50',value:settings.slowGap,id:'gap','aria-label':'Pause between words',oninput:e=>{settings.slowGap=+e.target.value;saveSettings()}});
  const warn=!tts.hasVoice()?h('div',{class:'banner',id:'voice-warn'},
    h('b',null,'No Turkish voice found on this device. '),
    tts.supported?'Reading aloud will use a default voice (it may sound wrong). On iPhone: Settings → Accessibility → Spoken Content → Voices → Turkish → download “Yelda”. On Mac: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → Turkish.':'This browser has no speech synthesis. Try Safari or Chrome.'):null;
  setTimeout(()=>{ if(warn&&tts.hasVoice()) warn.remove() },1800);
  const bar=h('div',{class:'player'},prog,
    h('div',{class:'row center'},
      h('button',{class:'ctl','aria-label':'Previous sentence',id:'btn-prev',onclick:()=>step(-1)},'⏮'),playBtn,
      h('button',{class:'ctl','aria-label':'Next sentence',id:'btn-next',onclick:()=>step(1)},'⏭'),
      h('div',{class:'rate'},h('span',null,'Speed'),rate,rateLbl)),
    h('div',{class:'row center wrap small'},slowBtn,h('label',{class:'gap'},'Pause',gap)));
  root.replaceChildren(
    h('div',{class:'topbar'},h('button',{class:'icon-btn',onclick:onBack,'aria-label':'Back'},'‹'),h('div',{class:'tb-title'},h('b',null,book.title),h('small',null,book.author)),h('span',null)),
    ...[warn,body,bar].filter(Boolean));

  function mark(){
    $$('.s.cur',body).forEach(e=>e.classList.remove('cur'));
    const s=sents[S.idx]; if(!s) return; s.el.classList.add('cur');
    clearWord();
    prog.firstChild.style.width=((S.idx+1)/sents.length*100)+'%';
  }
  function clearWord(){ if(S.wordEl){S.wordEl.classList.remove('cw');S.wordEl=null} }
  function markWord(el){ clearWord(); if(el){el.classList.add('cw');S.wordEl=el} }
  function scrollTo(){ const s=sents[S.idx]; s.el.scrollIntoView({block:'center',behavior:'smooth'}) }
  function setPlaying(p){S.playing=p;playBtn.textContent=p?'⏸':'▶';playBtn.setAttribute('aria-label',p?'Pause':'Play')}
  function pause(){setPlaying(false);clearTimeout(S.timer);tts.cancel();clearWord()}
  function playFrom(i){ S.idx=i; setPos(book.id,i); mark(); scrollTo(); setPlaying(true); speakCurrent() }
  function step(d){
    const i=Math.max(0,Math.min(sents.length-1,S.idx+d)); const was=S.playing;
    clearTimeout(S.timer); tts.cancel(); S.idx=i; setPos(book.id,i); mark(); scrollTo();
    if(was) speakCurrent();
  }
  function advance(){
    bump('read');
    if(S.idx<sents.length-1){S.idx++;setPos(book.id,S.idx);mark();scrollTo();speakCurrent()}
    else{ pause(); toast('Finished! 🎉') }
  }
  function speakCurrent(){
    clearTimeout(S.timer); const s=sents[S.idx]; if(!s) return;
    if(settings.slow) return slow(s,0);
    tts.speak(s.speak,{
      onboundary:e=>{ if(e.name&&e.name!=='word') return; const ci=e.charIndex+s.skip; const w=s.words.findIndex(w=>ci>=w.start&&ci<w.end); if(w>=0) markWord(s.wordEls[w]) },
      onend:advance,
      onerror:err=>{pause();toast(err==='unsupported'?'Speech isn’t supported in this browser':'Speech error: '+err)}
    });
  }
  function slow(s,wi){
    if(!S||!S.playing) return;
    const w=s.words[wi]; if(!w) return advance();
    markWord(s.wordEls[wi]);
    tts.speak(w.text.replace(/'.*$/,m=>m),{rate:Math.max(0.5,settings.rate*0.9),onend:()=>{S.timer=setTimeout(()=>slow(s,wi+1),settings.slowGap)},onerror:err=>{pause();toast('Speech error: '+err)}});
  }
  body.addEventListener('click',e=>{
    const w=e.target.closest('.w'); const sp=e.target.closest('.s');
    if(!sp) return; const i=+sp.dataset.i; const s=sents[i];
    if(w){
      const wasPlaying=S.playing; if(wasPlaying) pause();
      S.idx=i; setPos(book.id,i); mark(); markWord(w);
      openWordSheet({word:w.textContent,start:+w.dataset.s,sentence:s.text,bookTitle:book.title,bookId:book.id,
        onPlayFrom:()=>{playFrom(i)},onClose:()=>{}});
    } else { playFrom(i) }
  });
  mark();
  setTimeout(()=>{if(S&&S.book===book)sents[S.idx]?.el.scrollIntoView({block:'center'})},50);
}
