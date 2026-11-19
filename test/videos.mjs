import {chromium} from 'playwright-core';
const URL=process.env.BASE||'http://localhost:8765/';const SH='/workspace/turkish-reader/shots/';
const R=[];const ok=(n,c,d='')=>{R.push(c);console.log(c?'PASS':'FAIL',n,d)};
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await ctx.addInitScript(()=>{class U{constructor(t){this.text=t}};window.SpeechSynthesisUtterance=U;window.__spoken=[];
 const v=[{name:'Yelda',lang:'tr-TR',voiceURI:'Yelda',localService:true}];const s={getVoices:()=>v,addEventListener(){},cancel(){},speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend({}),50)}};
 Object.defineProperty(window,'speechSynthesis',{value:s,configurable:true})});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/404|Failed to load resource|youtube|ytimg/i.test(m.text()))errs.push(m.text())});
// ---- mocked IFrame API (deterministic clock) for sync tests; the real one is tested separately below
const MOCK=`window.YT={Player:function(el,o){const me=this;window.__yt=me;me.t=0;me.state=-1;me.opts=o;
 me.getCurrentTime=()=>me.t;me.seekTo=(t)=>{me.t=t;me.seeked=t};me.playVideo=()=>{me.state=1;o.events.onStateChange({data:1})};me.pauseVideo=()=>{me.state=2;me.paused=true;o.events.onStateChange({data:2})};me.destroy=()=>{};
 setTimeout(()=>o.events.onReady&&o.events.onReady({}),10)}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`;
await ctx.route('https://www.youtube.com/iframe_api',r=>r.fulfill({contentType:'application/javascript',body:MOCK}));
// pretend one bundled video has bundled (auto) captions
const CAP={auto:true,cues:[{t:1,d:3,x:'Merhaba arkadaşlar, bugün hava çok güzel.'},{t:5,d:3,x:'Çocuklar parkta oynuyor.'},{t:9,d:3,x:'Annem bana elma verdi.'},{t:13,d:3,x:'Okula gidiyorum.'}]};
await ctx.route('**/data/videos.json',async r=>{const j=await (await r.fetch()).json();j.find(x=>x.id==='Ywpudy3yN4Y').caps=true;r.fulfill({json:j})});
await ctx.route('**/data/captions/Ywpudy3yN4Y.json',r=>r.fulfill({json:CAP}));
await p.goto(URL+'#/videos');await p.waitForSelector('.vid');
const n=await p.$$eval('.vid',e=>e.length);ok('video list loads (>=10)',n>=10,n+' videos');
ok('levels shown',(await p.$$eval('.vid .lv',e=>e.map(x=>x.textContent))).every(l=>/^(A1|A2|B1|B2)$/.test(l)));
ok('segmented Songs|Videos control',!!(await p.$('.seg a[data-seg=songs]')));
await p.screenshot({path:SH+'28-videos-list.png'});
await p.click('.chips [data-lv=A1]');ok('level filter A1',(await p.$$eval('.vid .lv',e=>e.every(x=>x.textContent==='A1')))&&(await p.$$eval('.vid',e=>e.length))>=3);
// bundled video w/o transcript
await p.goto(URL+'#/video/Rafadan%20x');await p.waitForTimeout(100);
await p.goto(URL+'#/video/dvXcSC3vmPk');await p.waitForSelector('#yt-player');
await p.waitForFunction(()=>window.__yt);ok('player created with correct video id',await p.evaluate(()=>window.__yt&&window.__yt.opts.videoId==='dvXcSC3vmPk'));
ok('no-captions note shown',!(await p.$eval('#vid-note',e=>e.classList.contains('hidden')))&&(await p.$eval('#vid-note',e=>e.textContent)).includes('No transcript'));
await p.screenshot({path:SH+'29-video-no-captions.png'});
// bundled video WITH captions (fixture)
await p.goto(URL+'#/video/Ywpudy3yN4Y');await p.waitForSelector('.cue');
ok('transcript renders cues',(await p.$$eval('.cue',e=>e.length))===4);
ok('auto-caption warning',(await p.$eval('#vid-note',e=>e.textContent)).includes('Auto-generated'));
await p.evaluate(()=>{window.__yt.playVideo();window.__yt.t=5.5});await p.waitForTimeout(600);
ok('highlight follows playback (cue 2 at 5.5s)',(await p.$eval('.cue.cur',e=>e.dataset.i))==='1');
await p.evaluate(()=>window.__yt.t=9.4);await p.waitForTimeout(600);
ok('highlight advances (cue 3 at 9.4s)',(await p.$eval('.cue.cur',e=>e.dataset.i))==='2');
await p.screenshot({path:SH+'30-video-transcript-sync.png'});
await p.click('.cue[data-i="3"] .ctime');
ok('tap line seeks player',await p.evaluate(()=>Math.abs(window.__yt.seeked-12.8)<0.01),await p.evaluate(()=>window.__yt.seeked));
// word popup live
await p.evaluate(()=>{window.__yt.paused=false});
const w=p.locator('.cue .w',{hasText:/^elma$/}).first();await w.click();await p.waitForSelector('.wsheet');
ok('tapping word pauses the video',await p.evaluate(()=>window.__yt.paused===true));
await p.waitForSelector('.tr-main',{timeout:20000}).catch(()=>{});await p.waitForTimeout(2500);
ok('word popup has live translation',!!(await p.$('.tr-main')),await p.$eval('.tr-box',e=>e.textContent.slice(0,50)).catch(()=>''));
await p.screenshot({path:SH+'31-video-word-popup.png'});
await p.click('.save-row .btn');const sv=await p.evaluate(()=>JSON.parse(localStorage.getItem('trr.vocab')));
ok('save word from video',sv.length===1&&/^Video:/.test(sv[0].book)&&sv[0].ex.includes('elma'),JSON.stringify(sv[0]&&{w:sv[0].word,book:sv[0].book}));
await p.click('.sheet-x');
// English toggle
await p.click('#btn-en');await p.waitForFunction(()=>[...document.querySelectorAll('.len')].filter(e=>e.textContent&&e.textContent!=='…').length>=4,null,{timeout:30000}).catch(()=>{});
const en=await p.$$eval('.len',e=>e.map(x=>x.textContent));ok('English line translation',en.length===4&&en.every(x=>x&&x!=='…'),JSON.stringify(en.slice(0,2)));
await p.screenshot({path:SH+'32-video-english.png'});
// user-added video + pasted SRT
await p.goto(URL+'#/videos');await p.click('#btn-add-video');
await p.fill('#vid-url','https://www.youtube.com/watch?v=aqz-KE-bpKQ');await p.fill('#vid-title','Test videom');
await p.fill('#vid-subs','1\n00:00:01,000 --> 00:00:03,500\nBen eve gidiyorum.\n\n2\n00:00:04,000 --> 00:00:06,000\n<i>Sen nereye gidiyorsun?</i>\n\n3\n00:01:02,000 --> 00:01:05,000\nYarın görüşürüz.\n');
await p.click('#vid-save');await p.waitForSelector('.cue');
ok('add own video + SRT -> timed transcript',(await p.$$eval('.cue',e=>e.length))===3&&(await p.$$eval('.ctime',e=>e.map(x=>x.textContent))).join()==='0:01,0:04,1:02');
ok('own video stored locally',await p.evaluate(()=>JSON.parse(localStorage.getItem('trr.userVideos')).length===1&&Object.keys(JSON.parse(localStorage.getItem('trr.vidCaps'))).length===1));
await p.evaluate(()=>{window.__yt.playVideo();window.__yt.t=64});await p.waitForTimeout(600);
ok('own transcript syncs (cue 3 at 64s)',(await p.$eval('.cue.cur',e=>e.dataset.i))==='2');
// add transcript to a bundled video via paste (plain text -> untimed)
await p.goto(URL+'#/video/dvXcSC3vmPk');await p.click('#btn-subs');await p.fill('#subs-text','Merhaba\nBugün okula gidiyorum');await p.click('#subs-save');await p.waitForSelector('.cue');
ok('paste plain subtitles on bundled video (untimed)',(await p.$$eval('.cue',e=>e.length))===2);
await p.evaluate(()=>window.__spoken.length=0);await p.click('.cue[data-i="1"] .ctime');await p.waitForTimeout(200);
ok('untimed line tap -> TTS',(await p.evaluate(()=>window.__spoken[0]||'')).includes('okula'));
await p.goto(URL+'#/videos');ok('own video listed first',(await p.$eval('.vid .bk b',e=>e.textContent))==='Test videom');
await p.screenshot({path:SH+'33-videos-own.png'});
await p.goto(URL+'#/songs');ok('Songs page still works with Media tab',(await p.$$eval('.song',e=>e.length))>=11&&await p.$eval('#nav a.active',e=>e.dataset.t==='songs'));
await p.goto(URL+'#/');await p.screenshot({path:SH+'34-home-videos.png'});
ok('no JS errors',errs.length===0,errs.join(' | '));
// ---- real IFrame API (no mock) loads and creates an embed iframe
const p2=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
await p2.goto(URL+'#/video/Ywpudy3yN4Y');
const real=await p2.waitForSelector('#transcript',{state:'attached',timeout:8000}).then(async()=>{await p2.waitForSelector('iframe',{timeout:15000});return p2.$eval('iframe',f=>f.src)}).catch(e=>'ERR '+e.message.slice(0,60));
ok('real YouTube IFrame API creates embed (nocookie)',/youtube-nocookie\.com\/embed\/Ywpudy3yN4Y/.test(real),real.slice(0,90));
console.log(R.filter(x=>!x).length+' failures');await b.close();
