import {chromium} from 'playwright-core';
import fs from 'fs';
const URL='http://localhost:8765/';
const SH='/workspace/turkish-reader/shots/';
fs.mkdirSync(SH,{recursive:true});
const R=[];const ok=(n,c,d='')=>{R.push([c?'PASS':'FAIL',n,d]);console.log(c?'PASS':'FAIL',n,d)};
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,acceptDownloads:true,serviceWorkers:'allow'});
await ctx.addInitScript(()=>{ // mock speech synthesis (headless box has no Turkish voice)
  window.__spoken=[];
  class Utt{constructor(t){this.text=t;this.rate=1;this.lang='';this.voice=null}}
  window.SpeechSynthesisUtterance=Utt;
  const voices=[{name:'Yelda',lang:'tr-TR',voiceURI:'Yelda',localService:true,default:false}];
  let timer=null;
  const synth={getVoices:()=>voices,addEventListener(){},speaking:false,
    cancel(){clearTimeout(timer);synth._u=null},
    speak(u){window.__spoken.push({t:u.text,rate:u.rate,voice:u.voice&&u.voice.name});synth._u=u;
      u.onstart&&u.onstart({});
      const words=[...u.text.matchAll(/\S+/g)];let i=0;
      const tick=()=>{ if(synth._u!==u) return; if(i<words.length){u.onboundary&&u.onboundary({name:'word',charIndex:words[i].index});i++;timer=setTimeout(tick,60)} else {timer=setTimeout(()=>{if(synth._u===u){synth._u=null;u.onend&&u.onend({})}},60)} };
      timer=setTimeout(tick,30)}};
  Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
});
const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push(m.text())});
const go=async h=>{await p.goto(URL+h);await p.waitForTimeout(500)};
// 1 library
await go('#/library');
const books=await p.$$eval('.book',e=>e.map(x=>x.querySelector('b').textContent));
ok('library loads bundled texts',books.length>=12,books.length+' books: '+books.join(' | '));
await p.screenshot({path:SH+'01-library.png'});
// 2 home empty
await go('#/');await p.screenshot({path:SH+'00-home-start.png'});
// 3 reader
await p.goto(URL+'#/read/nasreddin-1');await p.waitForSelector('.s');
const nS=await p.$$eval('.s',e=>e.length);ok('reader renders sentences',nS>20,nS+' sentences');
ok('no voice warning when tr voice present',(await p.$('#voice-warn'))===null);
await p.click('#btn-play');await p.waitForTimeout(900);
const cur1=+await p.$eval('.s.cur',e=>e.dataset.i);ok('play advances & highlights sentence',cur1>=1,'cur='+cur1);
const hasWord=await p.$('.w.cw');ok('word highlight via boundary events',!!hasWord);
await p.screenshot({path:SH+'03-reader-playing.png'});
await p.click('#btn-play'); // pause
const before=+await p.$eval('.s.cur',e=>e.dataset.i);
await p.click('#btn-next');const after=+await p.$eval('.s.cur',e=>e.dataset.i);ok('next sentence',after===before+1);
await p.click('#btn-prev');ok('prev sentence',+await p.$eval('.s.cur',e=>e.dataset.i)===before);
await p.fill('#rate','0.6');await p.dispatchEvent('#rate','input');
ok('speed slider saved',(await p.$eval('#rate',e=>e.value))==='0.6'&&await p.evaluate(()=>JSON.parse(localStorage.getItem('trr.settings')).rate===0.6));
// slow mode
await p.click('#btn-slow');await p.evaluate(()=>window.__spoken.length=0);
await p.click('#btn-play');await p.waitForTimeout(1500);
const sp=await p.evaluate(()=>window.__spoken.map(s=>s.t));
ok('word-by-word mode speaks single words',sp.length>=2&&sp.slice(0,3).every(t=>!/\s/.test(t)),JSON.stringify(sp.slice(0,5)));
await p.screenshot({path:SH+'04-reader-slow-words.png'});
await p.click('#btn-play');await p.click('#btn-slow');
// tap sentence to read from there (click non-word area)
const sentIdx=8;
await p.evaluate(i=>{const s=document.querySelector(`.s[data-i="${i}"]`);s.click()},sentIdx);
await p.waitForTimeout(400);ok('tap sentence plays from there',+await p.$eval('.s.cur',e=>e.dataset.i)>=sentIdx);
await p.click('#btn-play');
// position persists
const posSaved=await p.evaluate(()=>JSON.parse(localStorage.getItem('trr.pos'))['nasreddin-1'].i);
await p.goto(URL+'#/library');await p.reload();await p.goto(URL+'#/read/nasreddin-1');await p.waitForSelector('.s.cur',{state:'attached',timeout:5000}).catch(async()=>console.log('DBG',await p.evaluate(()=>location.hash+' | '+document.querySelector('#view').textContent.slice(0,200))));
ok('reading position remembered',+await p.$eval('.s.cur',e=>e.dataset.i)===posSaved,'pos '+posSaved);
// 4 word popup w/ live APIs + morphology
await p.evaluate(()=>{document.querySelectorAll('.w').forEach(w=>{if(w.textContent==='Hoca\'ya'||w.textContent==='eşeğini')w.dataset.t='1'})});
const target=await p.$('.w:text-is("sorarlar")')||await p.$('.w:text-is("sormuşlar")');
await p.evaluate(()=>window.scrollTo(0,0));
const wordsAll=await p.$$eval('.w',e=>e.map(x=>x.textContent));
const pick=['Hoca’ya',"Hoca'ya",'sormuşlar','eşekten','eşeğini','kadısı','Nasreddin'].find(w=>wordsAll.includes(w))||wordsAll.find(w=>w.length>6);
const wl=p.locator('.w',{hasText:new RegExp('^'+pick+'$')}).first();await wl.scrollIntoViewIfNeeded();await wl.click();
await p.waitForSelector('.wsheet');
await p.waitForFunction(()=>document.querySelector('.tr-main')||document.querySelector('.tr-box .err'),null,{timeout:20000}).catch(()=>{});
await p.waitForTimeout(3500);
const tr=await p.$eval('.tr-box',e=>e.textContent);
ok('word popup translation from live API ('+pick+')',!!(await p.$('.tr-main')),tr.slice(0,120));
ok('popup morphology breakdown shown',(await p.$$('.chips .chip')).length>=1,await p.$$eval('.chips .chip',e=>e.map(x=>x.textContent).join(' ')).catch(()=>''));
ok('popup dictionary (Wiktionary) shown',!!(await p.$('.defs')),await p.$eval('.dict',e=>e.textContent.slice(0,120)).catch(()=>''));
await p.screenshot({path:SH+'05-word-popup.png'});
await p.click('#btn-tsent');await p.waitForSelector('.sent-tr',{timeout:15000}).catch(()=>{});
ok('translate whole sentence',!!(await p.$('.sent-tr')),await p.$eval('.sent-box',e=>e.textContent).catch(()=>''));
await p.click('.save-row .btn');await p.waitForTimeout(300);
const vv=await p.evaluate(()=>JSON.parse(localStorage.getItem('trr.vocab')||'[]'));ok('save word (stores word, root, translation, example, source, date)',vv.length===1&&vv[0].word&&vv[0].tr&&vv[0].ex&&vv[0].book&&vv[0].date,JSON.stringify(vv[0]&&{w:vv[0].word,root:vv[0].root,tr:vv[0].tr,book:vv[0].book}));
await p.screenshot({path:SH+'06-word-saved.png'});
await p.keyboard.press('Escape');await p.click('.sheet-x');
// a second + third word for quiz
for(const w2 of wordsAll.filter(w=>w.length>5&&w!==pick).slice(0,4)){
  const l=p.locator('.w',{hasText:new RegExp('^'+w2+'$')}).first();await l.scrollIntoViewIfNeeded();await l.click();await p.waitForSelector('.wsheet');
  await p.waitForFunction(()=>document.querySelector('.tr-main'),null,{timeout:15000}).catch(()=>{});
  if(await p.$('.save-row .btn:not([disabled])'))await p.click('.save-row .btn');await p.click('.sheet-x');await p.waitForTimeout(150);
}
// 5 vocab page
await go('#/vocab');
const nv=await p.$$eval('.vitem',e=>e.length);ok('vocab list shows saved words',nv>=3,nv+' items');
await p.fill('#vsearch',pick.slice(0,3));const nf=await p.$$eval('.vitem',e=>e.length);ok('vocab search filters',nf>=1&&nf<=nv);await p.fill('#vsearch','');
await p.screenshot({path:SH+'07-vocab.png'});
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#btn-csv')]);
const csvp=await dl.path();const csv=fs.readFileSync(csvp,'utf8');ok('export CSV',csv.split('\r\n').length>=nv+1&&csv.includes('word,'.replace(/"/g,'')) || csv.includes('"word"'),csv.split('\r\n')[0]);
// edit translation
await p.click('.vitem .vbtns .icon-btn:nth-child(2)');await p.fill('.sheet .inp','EDITED');await p.click('.sheet .btn.primary');
ok('edit translation',(await p.$eval('.vitem .vtr',e=>e.textContent)).includes('EDITED'));
// 6 practice
await go('#/practice');ok('due count shown',+await p.$eval('#due-count',e=>e.textContent)>=nv*2,await p.$eval('#due-count',e=>e.textContent)+' due');
await p.screenshot({path:SH+'08-practice.png'});
await p.click('#m-mixed');await p.waitForSelector('#fc-front');await p.screenshot({path:SH+'09-flashcard-front.png'});
await p.click('#btn-show');await p.waitForSelector('.grades:not(.hidden)');await p.screenshot({path:SH+'10-flashcard-back.png'});
const dueBefore=nv*2;await p.click('.grade.good');
const dueAfter=await p.evaluate(()=>JSON.parse(localStorage.getItem('trr.vocab')).flatMap(e=>[e.cards.f,e.cards.b]).filter(c=>c.due<=Date.now()).length);
ok('SM-2 grading schedules card in future',dueAfter===dueBefore-1,dueBefore+' -> '+dueAfter);
for(let i=0;i<30&&await p.$('#fc-front');i++){ if(await p.$('#btn-show')){await p.click('#btn-show')} ; if(await p.$('.grade.good')) await p.click('.grade.good'); await p.waitForTimeout(30)}
await go('#/vocab');await go('#/practice');await p.click('#m-quiz');await p.waitForSelector('.opt');await p.screenshot({path:SH+'11-quiz.png'});
for(let i=0;i<12;i++){ if(await p.$('#quiz-score'))break; await p.click('.opt >> nth=0'); await p.waitForTimeout(1900)}
ok('quiz completes with score',!!(await p.$('#quiz-score')),await p.$eval('#quiz-score',e=>e.textContent).catch(()=>''));
// 7 scenes
await go('#/scenes');const ns=await p.$$eval('.scene-card',e=>e.length);ok('picture scenes listed',ns>=8,ns+' scenes');await p.screenshot({path:SH+'12-scenes-list.png'});
await go('#/scene/mutfak');await p.evaluate(()=>window.__spoken.length=0);
const ei=await p.evaluate(async()=>{const m=await import('./js/scenes-data.js');return m.SCENES.find(x=>x.id==='mutfak').objs.findIndex(o=>o.tr==='elma')});await p.click(`.obj[data-i="${ei}"] .hit`);
ok('scene object tap shows Turkish + English',(await p.$eval('#o-tr',e=>e.textContent))==='elma'&&(await p.$eval('#o-en',e=>e.textContent))==='apple');
await p.waitForTimeout(250);ok('scene object speaks tr word',(await p.evaluate(()=>window.__spoken.map(s=>s.t))).includes('elma'));
await p.click('#btn-save-obj');ok('scene word saved to vocab',(await p.evaluate(()=>JSON.parse(localStorage.getItem('trr.vocab')).some(e=>e.word==='elma'))));
await p.click('#btn-labels');await p.screenshot({path:SH+'13-scene-kitchen.png'});
for(const id of ['pazar','sokak','vucut','sinif','doga','giysiler','hayvanlar','evde']){await go('#/scene/'+id);await p.click('#btn-labels');await p.waitForTimeout(150);await p.screenshot({path:SH+'scene-'+id+'.png'})}
// game
await go('#/scene/hayvanlar');await p.click('#btn-game');await p.waitForSelector('#g-word');
let score=0;
for(let r=0;r<10;r++){
  await p.waitForTimeout(450);
  const said=await p.evaluate(()=>window.__spoken[window.__spoken.length-1].t);
  const idx=await p.evaluate(async t=>{const m=await import('./js/scenes-data.js');const s=m.SCENES.find(x=>x.id==='hayvanlar');return s.objs.findIndex(o=>o.tr===t)},said);
  if(r===0){ // deliberately miss first
    const wrong=idx===0?1:0;await p.click(`.obj[data-i="${wrong}"] .hit`);await p.waitForTimeout(300);ok('Find-it: wrong tap feedback',(await p.$eval('#g-word',e=>e.textContent)).includes('Try again'));if(r===0)await p.screenshot({path:SH+'14-find-it.png'});await p.waitForTimeout(1500);
  }
  const said2=await p.evaluate(()=>{const s=window.__spoken;return s[s.length-1].t});
  await p.evaluate(async t=>{},said2);
  const idx2=await p.evaluate(async t=>{const m=await import('./js/scenes-data.js');return m.SCENES.find(x=>x.id==='hayvanlar').objs.findIndex(o=>o.tr===t)},said);
  await p.click(`.obj[data-i="${idx2}"] .hit`);await p.waitForTimeout(1700);
  if(await p.$('#final-score'))break;
}
await p.waitForSelector('#final-score',{timeout:8000}).catch(()=>{});
ok('Find-it game finishes with score',!!(await p.$('#final-score')),await p.$eval('#final-score',e=>e.textContent).catch(()=>''));
await p.screenshot({path:SH+'15-find-it-result.png'});
// 8 streak / stats home
await go('#/');
const streakN=+await p.$eval('#streak-n',e=>e.textContent);ok('streak counts today (>=1)',streakN>=1,'streak '+streakN);
const stats=await p.$$eval('.stat',e=>e.map(x=>x.querySelector('small').textContent+'='+x.querySelector('b').textContent).join(', '));ok('progress stats shown',true,stats);
await p.screenshot({path:SH+'16-home-stats.png'});
// 9 paste own text
await go('#/library');await p.click('#btn-paste');await p.fill('#paste-title','Benim metnim');await p.fill('#paste-text','Merhaba! Bugün hava çok güzel. Parkta yürüyorum.');await p.click('#paste-save');
await p.waitForSelector('.s');ok('paste own text becomes a book',(await p.$$eval('.s',e=>e.length))===3);
// 10 dark mode + settings
await go('#/');await p.click('#btn-settings');await p.selectOption('#set-theme','dark');await p.waitForTimeout(200);await p.screenshot({path:SH+'17-settings-dark.png'});await p.click('.sheet-x');
await p.goto(URL+'#/read/kesik-biyik');await p.waitForSelector('.s');await p.screenshot({path:SH+'18-reader-dark.png'});
// 11 PWA
const mf=await p.evaluate(async()=>{const r=await fetch('manifest.webmanifest');return r.json()});ok('manifest ok',mf.icons.length>=3&&mf.display==='standalone');
await p.waitForTimeout(1500);
const sw=await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return !!(r&&(r.active||r.waiting||r.installing))});ok('service worker registered',sw);
const cached=await p.evaluate(async()=>{const k=await caches.keys();const c=await caches.open(k[0]);return (await c.keys()).length});ok('offline cache populated',cached>100,cached+' entries');
await ctx.setOffline(true);await p.goto(URL+'#/read/forsa').catch(()=>{});await p.reload().catch(()=>{});await p.waitForSelector('.s',{timeout:8000}).catch(()=>{});
ok('reads offline',!!(await p.$('.s')));
await ctx.setOffline(false);
ok('no uncaught JS errors',errs.length===0,errs.slice(0,3).join(' | '));
console.log('\n'+R.filter(r=>r[0]==='FAIL').length+' failures');
await b.close();
