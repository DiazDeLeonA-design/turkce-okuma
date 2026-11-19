import {h,$,$$,toast,sheet,closeSheet,confirmBox,promptBox,esc} from './ui.js';
import {settings,saveSettings,applyTheme,streak,dayStats,getVocab,setVocab,removeWord,updateWord,dueCards,mastered,getPos,lastBook,getUserBooks,setUserBooks,ls,flushCache,dayKey} from './store.js';
import {renderReader,stopReader} from './reader.js';
import {sceneList,sceneView} from './scenes.js';
import {practiceHome} from './practice.js';
import {parsePasted,wordCount,buildSentences} from './text.js';
import * as tts from './tts.js';
import {SCENES} from './scenes-data.js';
import {loadSongs,songList,songView,bundledSongs} from './songs.js';
import {loadVideos,videoList,videoView,stopVideo,bundledVideos} from './videos.js';

applyTheme();
let BOOKS=[];
const view=$('#view');
async function loadBooks(){
  try{const r=await fetch('data/books.json');BOOKS=await r.json()}catch(e){BOOKS=[];console.error(e)}
}
const allBooks=()=>[...getUserBooks(),...BOOKS];
const nav=hash=>{if(location.hash===hash) route(); else location.hash=hash};
const LV={A1:'#2e9e5b',A2:'#58b368',B1:'#e0a526',B2:'#e07a26',C1:'#c8402e',Own:'#5b6ee1'};
const bookInfo=b=>{const w=wordCount(b.paras);return {w,min:Math.max(1,Math.round(w/110))}};
const pct=b=>{const n=buildSentences(b.paras).length;return Math.round(getPos(b.id)/Math.max(1,n-1)*100)};

function setNav(name){
  $$('#nav a').forEach(a=>a.classList.toggle('active',a.dataset.t===name));
  const due=dueCards().length; const b=$('#due-badge'); b.textContent=due; b.style.display=due?'':'none';
}
// ---------- Home
function home(){
  const st=streak(), d=dayStats(), v=getVocab(), due=dueCards().length;
  const lb=lastBook(); const book=lb&&allBooks().find(b=>b.id===lb);
  view.replaceChildren(
    h('div',{class:'home-h'},h('div',null,h('h1',null,'Merhaba! 👋'),h('p',{class:'sub'},'Read, listen, tap, learn.')),h('button',{class:'icon-btn',id:'btn-settings','aria-label':'Settings',onclick:openSettings},'⚙️')),
    h('div',{class:'streak-card'},
      h('div',{class:'flame'},'🔥'),h('div',{class:'streak-n',id:'streak-n'},String(st.current)),h('div',{class:'streak-t'},h('b',null,st.current===1?'day streak':'day streak'),h('small',null,st.todayDone?'Today is done ✓':'Do something today to keep it going')),
      h('div',{class:'week'},st.last7.map(x=>h('span',{class:'day'+(x.on?' on':'')},x.dow)))),
    h('div',{class:'stats'},
      stat('Words saved',v.length,'stat-saved'),stat('Reviewed today',d.reviewed||0,'stat-reviewed'),stat('Due now',due,'stat-due'),stat('Mastered',mastered(),'stat-mastered')),
    h('div',{class:'stats small'},stat('Saved today',d.saved||0,'stat-saved-today'),stat('Sentences read today',d.read||0,'stat-read'),stat('Best streak',st.best,'stat-best')),
    book?h('a',{class:'continue',href:'#/read/'+book.id,id:'continue'},h('small',null,'Continue reading'),h('b',null,book.title),h('div',{class:'bar'},h('i',{style:{width:pct(book)+'%'}}))):null,
    h('div',{class:'actions'},
      h('a',{class:'big-btn',href:'#/library'},'📚',h('b',null,'Read a story'),h('small',null,'Library')),
      h('a',{class:'big-btn',href:'#/scenes'},'🖼',h('b',null,'Picture words'),h('small',null,'Tap & learn')),
      h('a',{class:'big-btn',href:'#/songs'},'🎵',h('b',null,'Songs'),h('small',null,'sing along')),
      h('a',{class:'big-btn',href:'#/videos'},'🎬',h('b',null,'Videos'),h('small',null,'cartoons & tales')),
      h('a',{class:'big-btn',href:'#/practice'},'🧠',h('b',null,due?`Practice (${due})`:'Practice'),h('small',null,due?'cards due':'flashcards & quiz')),
      h('a',{class:'big-btn',href:'#/vocab'},'🔖',h('b',null,'My words'),h('small',null,v.length+' saved'))));
  setNav('home');
}
const stat=(l,n,id)=>h('div',{class:'stat'},h('b',{id},String(n)),h('small',null,l));
// ---------- Library
let libFilter='All';
function library(){
  const books=allBooks();
  const filters=['All','A1–A2','B1–B2','C1','Mine'];
  const match=b=>libFilter==='All'||(libFilter==='Mine'?b.user:libFilter==='C1'?b.level==='C1':libFilter==='A1–A2'?['A1','A2'].includes(b.level):['B1','B2'].includes(b.level));
  view.replaceChildren(
    h('div',{class:'page-h'},h('h1',null,'Library'),h('p',{class:'sub'},'Free, public-domain Turkish texts. Levels are rough estimates.')),
    h('div',{class:'filters'},filters.map(f=>h('button',{class:'chipbtn'+(f===libFilter?' on':''),onclick:()=>{libFilter=f;library()}},f))),
    h('button',{class:'btn wide',id:'btn-paste',onclick:pasteBook},'＋ Paste your own text'),
    h('div',{class:'books'},books.filter(match).map(b=>{const i=bookInfo(b),p=pct(b);return h('a',{class:'book',href:'#/read/'+b.id,'data-id':b.id},
      h('span',{class:'lv',style:{background:LV[b.level]||'#888'}},b.level),
      h('div',{class:'bk'},h('b',null,b.title),h('small',null,b.author),h('p',null,b.desc),h('div',{class:'bm'},`${i.w} words · ~${i.min} min`+(p?` · ${p}% read`:'')),p?h('div',{class:'bar'},h('i',{style:{width:p+'%'}})):null),
      b.user?h('button',{class:'icon-btn','aria-label':'Delete',onclick:async e=>{e.preventDefault();e.stopPropagation();if(await confirmBox('Delete “'+b.title+'”?')){setUserBooks(getUserBooks().filter(x=>x.id!==b.id));library()}}},'🗑'):null)})),
    h('p',{class:'foot'},h('a',{href:'#/about'},'Sources & licences')));
  setNav('library');
}
function pasteBook(){
  const t=h('input',{class:'inp',id:'paste-title',placeholder:'Title (optional)'}); const a=h('textarea',{class:'inp',id:'paste-text',rows:'9',placeholder:'Paste Turkish text here…'});
  sheet(h('div',{class:'confirm'},h('h3',null,'Add your own text'),t,a,h('div',{class:'row end'},
    h('button',{class:'btn ghost',onclick:closeSheet},'Cancel'),
    h('button',{class:'btn primary',id:'paste-save',onclick:()=>{
      if(a.value.trim().length<10){toast('Paste some Turkish text first');return}
      const b=parsePasted(t.value.trim(),a.value); setUserBooks([b,...getUserBooks()]); closeSheet(); nav('#/read/'+b.id);
    }},'Add & read'))));
}
// ---------- Vocab
let vq='';
function vocab(){
  const list=h('div',{class:'vlist'});
  const render=()=>{
    const q=vq.toLocaleLowerCase('tr'); const v=getVocab().filter(e=>!q||[e.word,e.root,e.tr,e.ex].join(' ').toLocaleLowerCase('tr').includes(q));
    count.textContent=v.length+' word'+(v.length===1?'':'s');
    list.replaceChildren(...(v.length?v.map(e=>h('div',{class:'vitem','data-id':e.id},
      h('div',{class:'vtop'},h('div',null,h('b',{class:'vw'},e.word),e.root&&e.root.toLowerCase()!==e.word.toLowerCase()?h('span',{class:'vroot'},' ← '+e.root):null),
        h('div',{class:'vbtns'},h('button',{class:'icon-btn','aria-label':'Listen',onclick:()=>tts.speakWord(e.word)},'🔊'),h('button',{class:'icon-btn','aria-label':'Edit translation',class2:'edit',onclick:async()=>{const n=await promptBox('Edit translation for “'+e.word+'”',e.tr);if(n!==null){updateWord(e.id,{tr:n});render()}}},'✏️'),
          h('button',{class:'icon-btn','aria-label':'Delete',onclick:async()=>{if(await confirmBox('Delete “'+e.word+'”?')){removeWord(e.id);render()}}},'🗑'))),
      h('div',{class:'vtr'},e.tr||h('i',null,'(no translation)'),e.rootTr&&e.rootTr!==e.tr?h('span',{class:'vroot'},' · root: '+e.rootTr):null),
      e.ex?h('div',{class:'vex'},'“'+e.ex+'”'):null,
      h('div',{class:'vsrc'},[e.book,new Date(e.date).toLocaleDateString()].filter(Boolean).join(' · ')))):[h('div',{class:'empty'},getVocab().length?'No matches.':'No saved words yet. Tap any word while reading, then ⭐ Save.')]));
  };
  const count=h('span',{class:'count',id:'vcount'});
  const search=h('input',{class:'inp',type:'search',id:'vsearch',placeholder:'Search words…',value:vq,oninput:e=>{vq=e.target.value;render()}});
  view.replaceChildren(
    h('div',{class:'page-h row between'},h('h1',null,'My words'),count),
    h('div',{class:'row gap'},search,h('button',{class:'btn',id:'btn-csv',onclick:exportCSV},'⬇ CSV')),list);
  render(); setNav('vocab');
}
function exportCSV(){
  const v=getVocab(); if(!v.length){toast('Nothing to export yet');return}
  const q=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
  const rows=[['word','root','translation','root_meaning','example','source','date_saved','interval_days_tr_en','interval_days_en_tr'],...v.map(e=>[e.word,e.root,e.tr,e.rootTr,e.ex,e.book,e.date,e.cards?.f?.int||0,e.cards?.b?.int||0])];
  const csv='\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=h('a',{href:url,download:'turkish-words-'+dayKey()+'.csv'}); document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000);
  toast('CSV exported');
}
// ---------- About
function about(){
  view.replaceChildren(h('div',{class:'page-h'},h('h1',null,'Sources & licences')),
    h('div',{class:'prose'},
      h('p',null,'All texts were fetched from ',h('a',{href:'https://tr.wikisource.org',target:'_blank',rel:'noopener'},'Turkish Wikisource'),', which only hosts public-domain or freely licensed works.'),
      h('ul',{class:'srcs'},BOOKS.map(b=>h('li',null,h('b',null,b.title),' — '+b.author+'. ',h('span',{class:'lic'},b.license+'. '),(b.pages||[]).slice(0,1).map(u=>h('a',{href:u,target:'_blank',rel:'noopener'},'source ↗')),(b.pages||[]).length>1?` (+${b.pages.length-1} more pages)`:''))),
      h('h3',null,'Videos'),h('p',null,'Videos are embedded from the official YouTube channels that publish them (TRT Çocuk, Rafadan Tayfa, Niloya, Pepee). Nothing is downloaded or re-hosted, and every ID was checked with YouTube’s oEmbed (exists + embeddable).'),h('ul',{class:'srcs'},bundledVideos().map(x=>h('li',null,h('b',null,x.title),' — ',h('a',{href:x.channelUrl,target:'_blank',rel:'noopener'},x.channel+' ↗'),' · ',h('a',{href:'https://www.youtube.com/watch?v='+x.ytId,target:'_blank',rel:'noopener'},'watch ↗')))),
      h('h3',null,'Songs'),h('p',null,'Lyrics are traditional/anonymous Turkish folk songs, lullabies and children’s songs (tagged “Anonim metinler” on Turkish Wikisource); videos are YouTube embeds of third-party recordings (the recording belongs to its performer — only the traditional words are bundled).'),h('ul',{class:'srcs'},bundledSongs().map(x=>h('li',null,h('b',null,x.title),' — '+x.kind+'. ',h('a',{href:x.source.split(', ')[0],target:'_blank',rel:'noopener'},'lyrics source ↗')))),
      h('h3',null,'Pictures'),h('p',null,'Picture scenes use emoji artwork from ',h('a',{href:'https://openmoji.org',target:'_blank',rel:'noopener'},'OpenMoji'),' (© HfG Schwäbisch Gmünd, licence CC BY-SA 4.0) placed in backgrounds drawn for this app.'),
      h('h3',null,'Dictionary & translation'),h('p',null,'Definitions: English ',h('a',{href:'https://en.wiktionary.org',target:'_blank',rel:'noopener'},'Wiktionary'),' (CC BY-SA). Machine translation: free public Google Translate web endpoints, falling back to MyMemory. Machine translation can be wrong — especially for single words out of context. Word breakdowns are rule-based best guesses.'),
      h('h3',null,'Privacy'),h('p',null,'No account. Your saved words, progress and settings stay in this browser (localStorage). Words you tap are sent to the translation/dictionary services above.')));
  setNav('library');
}
// ---------- Settings
function openSettings(){
  const voices=tts.getVoices();
  const sel=h('select',{class:'inp',id:'set-voice',onchange:e=>{settings.voice=e.target.value;saveSettings()}},
    h('option',{value:''},voices.length?'Automatic (best Turkish voice)':'No Turkish voice found'),
    voices.map(v=>h('option',{value:v.voiceURI,selected:settings.voice===v.voiceURI||null},v.name+' ('+v.lang+')')));
  sheet(h('div',{class:'settings'},h('h3',null,'Settings'),
    lab('Translate Turkish into',h('select',{class:'inp',id:'set-tl',onchange:e=>{settings.tl=e.target.value;saveSettings()}},
      [['en','English'],['es','Español']].map(([v,l])=>h('option',{value:v,selected:settings.tl===v||null},l)))),
    lab('Voice',sel),
    h('button',{class:'btn small',onclick:()=>tts.speak('Merhaba! Türkçe öğreniyorum.')},'🔊 Test voice'),
    lab('Theme',h('select',{class:'inp',id:'set-theme',onchange:e=>{settings.theme=e.target.value;saveSettings()}},[['auto','Match device'],['light','Light'],['dark','Dark']].map(([v,l])=>h('option',{value:v,selected:settings.theme===v||null},l)))),
    lab('Reading text size',h('input',{type:'range',min:'1',max:'1.8',step:'0.05',value:settings.fs,oninput:e=>{settings.fs=+e.target.value;saveSettings()}})),
    h('div',{class:'row gap wrap'},
      h('button',{class:'btn small',onclick:()=>{ls.del('cache');toast('Lookup cache cleared')}},'Clear lookup cache'),
      h('button',{class:'btn small danger',onclick:async()=>{closeSheet();if(await confirmBox('Erase ALL saved words, progress and settings?')){Object.keys(localStorage).filter(k=>k.startsWith('trr.')).forEach(k=>localStorage.removeItem(k));location.reload()}}},'Reset everything')),
    h('p',{class:'sub'},'Tip: on iPhone use Share → “Add to Home Screen” to install.')));
}
const lab=(t,el)=>h('label',{class:'lab'},h('span',null,t),el);
// ---------- Router
function route(){
  stopReader(); stopVideo(); tts.cancel(); closeSheet(); flushCache();
  const hash=location.hash||'#/'; const [,p,id]=hash.match(/^#\/([^/]*)\/?(.*)$/)||[];
  document.body.dataset.page=p||'home';
  window.scrollTo(0,0);
  try{
    if(!p) return home();
    if(p==='library') return library();
    if(p==='read'){
      const b=allBooks().find(b=>b.id===decodeURIComponent(id)); if(!b){nav('#/library');return}
      setNav('library'); return renderReader(view,b,{onBack:()=>nav('#/library')});
    }
    if(p==='vocab') return vocab();
    if(p==='practice'){setNav('practice');return practiceHome(view)}
    if(p==='scenes'){setNav('scenes');return sceneList(view)}
    if(p==='scene'){setNav('scenes');return sceneView(view,id,nav)}
    if(p==='songs'){setNav('songs');return songList(view,nav)}
    if(p==='song'){setNav('songs');return songView(view,decodeURIComponent(id),nav)}
    if(p==='videos'){setNav('songs');return videoList(view,nav)}
    if(p==='video'){setNav('songs');return videoView(view,decodeURIComponent(id),nav)}
    if(p==='about') return about();
    home();
  }catch(e){console.error(e);view.textContent='Something went wrong: '+e.message}
}
const ready=Promise.all([loadBooks(),loadSongs(),loadVideos()]);
window.addEventListener('hashchange',()=>ready.then(route));
await ready;
route();
if('serviceWorker' in navigator && location.protocol!=='file:'){
  navigator.serviceWorker.register('sw.js').catch(e=>console.warn('SW',e));
}
window.__app={route,BOOKS:()=>BOOKS};
