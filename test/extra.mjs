import {chromium} from 'playwright-core';
import fs from 'fs';
const SH='/workspace/turkish-reader/shots/';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
// A) real headless browser: no Turkish voice -> fallback message
let ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true});
let p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/#/read/keloglan');await p.waitForSelector('.s');await p.waitForTimeout(2500);
console.log('voice warning shown:',!!(await p.$('#voice-warn')),'| voices:',await p.evaluate(()=>speechSynthesis.getVoices().length));
await p.screenshot({path:SH+'02-reader-no-voice-warning.png'});
await p.click('#btn-play');await p.waitForTimeout(600);console.log('play without voice did not crash:',errs.length===0,errs);
// B) Spanish target
await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('trr.settings')||'{}');s.tl='es';localStorage.setItem('trr.settings',JSON.stringify(s))});
await p.goto('http://localhost:8765/#/library');await p.reload();await p.goto('http://localhost:8765/#/read/nasreddin-2');await p.waitForSelector('.s');
const w=p.locator('.w',{hasText:/^eşeğini$|^eşek$|^kadı$|^Hoca$/}).first();await w.scrollIntoViewIfNeeded();await w.click();await p.waitForSelector('.tr-main',{timeout:20000}).catch(()=>{});
console.log('ES translation:',await p.$eval('.tr-box',e=>e.textContent).catch(()=>'none'));
await p.screenshot({path:SH+'05b-word-popup-spanish.png'});
await ctx.close();
// C) desktop (Mac) layout
ctx=await b.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});p=await ctx.newPage();
await p.goto('http://localhost:8765/#/read/yuzaki');await p.waitForSelector('.s');await p.waitForTimeout(500);await p.screenshot({path:SH+'19-desktop-reader.png'});
await p.goto('http://localhost:8765/#/scenes');await p.waitForTimeout(500);await p.screenshot({path:SH+'20-desktop-scenes.png'});
await b.close();
