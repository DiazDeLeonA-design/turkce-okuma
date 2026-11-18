import {chromium} from 'playwright-core';
const URL='http://localhost:8765/';const SH='/workspace/turkish-reader/shots/';
const R=[];const ok=(n,c,d='')=>{R.push(c);console.log(c?'PASS':'FAIL',n,d)};
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await ctx.addInitScript(()=>{window.__spoken=[];class U{constructor(t){this.text=t}};window.SpeechSynthesisUtterance=U;
 const v=[{name:'Yelda',lang:'tr-TR',voiceURI:'Yelda',localService:true}];let t;const s={getVoices:()=>v,addEventListener(){},cancel(){clearTimeout(t);s._u=null},speak(u){window.__spoken.push(u.text);s._u=u;t=setTimeout(()=>{if(s._u===u){s._u=null;u.onend&&u.onend({})}},120)}};
 Object.defineProperty(window,'speechSynthesis',{value:s,configurable:true})});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/404|Failed to load resource|youtube/i.test(m.text()))errs.push(m.text())});
await p.goto(URL+'#/songs');await p.waitForSelector('.song');
const titles=await p.$$eval('.song b',e=>e.map(x=>x.textContent));ok('songs list',titles.length>=10,titles.length+': '+titles.join(' | '));
await p.screenshot({path:SH+'21-songs-list.png'});
await p.goto(URL+'#/song/uskudar');await p.waitForSelector('.line');
ok('song lyrics render line by line',(await p.$$eval('.line',e=>e.length))===10);
ok('YouTube embed present',(await p.$eval('#yt-frame',e=>e.src)).includes('youtube-nocookie.com/embed/SFwCw1mZd1g'));
ok('YouTube search link present',(await p.$eval('#yt-search',e=>e.href)).startsWith('https://www.youtube.com/results?search_query='));
await p.screenshot({path:SH+'22-song-uskudar.png'});
// tap a word
const wl=p.locator('.line .w',{hasText:/^yağmur$/}).first();await wl.scrollIntoViewIfNeeded();await wl.click();await p.waitForSelector('.wsheet');
await p.waitForSelector('.tr-main',{timeout:20000}).catch(()=>{});await p.waitForTimeout(2500);
ok('tap word in lyrics -> popup with translation',!!(await p.$('.tr-main')),await p.$eval('.tr-box',e=>e.textContent.slice(0,60)).catch(()=>''));
await p.waitForSelector('.defs,.dict .note',{timeout:15000}).catch(()=>{});ok('popup shows morphology/dictionary',!!(await p.$('.defs')),await p.$eval('.wsheet',e=>e.textContent.slice(0,200)));
await p.screenshot({path:SH+'23-song-word-popup.png'});
await p.click('.save-row .btn');const sv=await p.evaluate(()=>JSON.parse(localStorage.getItem('trr.vocab')));
ok('save word from song (source = Song: …)',sv.length===1&&/^Song:/.test(sv[0].book)&&sv[0].ex.includes('yağmur'),JSON.stringify(sv[0]&&{w:sv[0].word,book:sv[0].book,ex:sv[0].ex}));
await p.click('.sheet-x');
// TTS per line
await p.evaluate(()=>window.__spoken.length=0);await p.click('.line[data-i="2"] .lsay');await p.waitForTimeout(300);
ok('per-line read-aloud',(await p.evaluate(()=>window.__spoken[0]||'')).startsWith('Kâtip uykudan'),await p.evaluate(()=>window.__spoken[0]));
// read all
await p.evaluate(()=>window.__spoken.length=0);await p.click('#btn-song-play');await p.waitForTimeout(2500);
ok('read aloud whole song advances lines',(await p.evaluate(()=>window.__spoken.length))>=4);await p.click('#btn-song-play');
// english
await p.click('#btn-en');await p.waitForFunction(()=>[...document.querySelectorAll('.len')].filter(e=>e.dataset.done).length>=5,null,{timeout:30000}).catch(()=>{});
const en=await p.$$eval('.len',e=>e.slice(0,3).map(x=>x.textContent));
ok('English line translation toggle',en.every(x=>x&&x!=='…'&&!/unavailable/.test(x)),JSON.stringify(en));
await p.screenshot({path:SH+'24-song-english.png'});
// sync
await p.click('#btn-sync');await p.click('#sync-next');await p.click('#sync-next');await p.click('#sync-next');
ok('manual sync: next line highlights',(await p.$eval('.line.cur',e=>e.dataset.i))==='2');
await p.click('#sync-prev');ok('sync back',(await p.$eval('.line.cur',e=>e.dataset.i))==='1');
await p.screenshot({path:SH+'25-song-sync.png'});
await p.click('#btn-sync');
// user song
await p.goto(URL+'#/songs');await p.click('#btn-add-song');await p.fill('#song-title','Benim şarkım');await p.fill('#song-yt','https://youtu.be/dQw4w9WgXcQ');
await p.fill('#song-lyrics','Merhaba dünya\nBen Türkçe öğreniyorum\n\nHer gün biraz daha\nŞarkı söylüyorum');await p.click('#song-save');await p.waitForSelector('.line');
ok('paste own lyrics -> personal song',(await p.$$eval('.line',e=>e.length))===4&&(await p.$eval('#yt-frame',e=>e.src)).includes('dQw4w9WgXcQ'));
ok('own song stored locally',(await p.evaluate(()=>JSON.parse(localStorage.getItem('trr.userSongs')).length))===1);
await p.goto(URL+'#/song/ninniler');await p.waitForSelector('.line');
ok('song without verified video -> search link only',!(await p.$('#yt-frame'))&&!!(await p.$('#yt-search')));
await p.screenshot({path:SH+'26-song-ninniler.png'});
await p.goto(URL+'#/');await p.screenshot({path:SH+'27-home-with-songs.png'});
ok('no JS errors',errs.length===0,errs.join(' | '));
console.log(R.filter(x=>!x).length+' failures');await b.close();
