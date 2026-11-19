import {h,$,$$,toast,sheet,closeSheet,confirmBox} from './ui.js';
import {tokenize} from './text.js';
import {settings,ls,bump} from './store.js';
import {translate} from './dict.js';
import {openWordSheet} from './popup.js';
import * as tts from './tts.js';

let VIDS=[];
export async function loadVideos(){try{VIDS=await (await fetch('data/videos.json')).json()}catch(e){console.error(e);VIDS=[]}}
export const bundledVideos=()=>VIDS;
export const getUserVideos=()=>ls.get('userVideos',[]);
const setUserVideos=v=>ls.set('userVideos',v);
export const allVideos=()=>[...getUserVideos(),...VIDS];
const getCaps=()=>ls.get('vidCaps',{});
const LV={A1:'#2e9e5b',A2:'#58b368',B1:'#e0a526',B2:'#e07a26',C1:'#c8402e',Own:'#5b6ee1'};
export const ytIdFrom=u=>{const m=String(u||'').match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/);return m?m[1]:''};
const fmt=s=>{s=Math.max(0,Math.round(s));const m=Math.floor(s/60);return m+':'+String(s%60).padStart(2,'0')};
const dur=s=>s>=3600?`${Math.floor(s/3600)} h ${Math.round(s%3600/60)} min`:Math.round(s/60)+' min';

export function mediaTabs(active){
  return h('div',{class:'seg',role:'tablist'},
    h('a',{href:'#/songs',class:active==='songs'?'on':'','data-seg':'songs'},'🎵 Songs'),
    h('a',{href:'#/videos',class:active==='videos'?'on':'','data-seg':'videos'},'🎬 Videos'));
}

/* ---------- subtitle parsing (SRT / VTT / plain text) ---------- */
export function parseSubs(text){
  text=String(text||'').replace(/\r/g,'').replace(/^\uFEFF/,'');
  const re=/(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})\s*-->\s*(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/;
  const secs=(h_,m,s,ms)=>(+h_||0)*3600+ +m*60+ +s+ +('0.'+ms.padEnd(3,'0').slice(0,3));
  const cues=[];
  if(re.test(text)){
    for(const blk of text.split(/\n\s*\n/)){
      const L=blk.split('\n').map(x=>x.trim()).filter(Boolean);
      const k=L.findIndex(l=>re.test(l)); if(k<0) continue;
      const m=L[k].match(re);
      const t=secs(m[1],m[2],m[3],m[4]),e=secs(m[5],m[6],m[7],m[8]);
      const x=L.slice(k+1).join(' ').replace(/<[^>]+>/g,'').replace(/\{[^}]*\}/g,'').replace(/\s+/g,' ').trim();
      if(x) cues.push({t:Math.round(t*100)/100,d:Math.round((e-t)*100)/100,x});
    }
    return cues;
  }
  for(const l of text.split('\n')){const x=l.trim(); if(x) cues.push({t:null,d:0,x})}
  return cues;
}

/* ---------- YouTube IFrame API ---------- */
let ytP=null;
function loadYT(){
  if(window.YT&&window.YT.Player) return Promise.resolve(window.YT);
  if(ytP) return ytP;
  ytP=new Promise((res,rej)=>{
    const prev=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{prev&&prev();res(window.YT)};
    const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.async=true;
    s.onerror=()=>{ytP=null;rej(new Error('offline'))};
    document.head.append(s);
    setTimeout(()=>{if(!(window.YT&&window.YT.Player)){ytP=null;rej(new Error('timeout'))}},12000);
  });
  return ytP;
}

/* ---------- list ---------- */
export function videoList(root,nav){
  let lv='all';
  const grid=h('div',{class:'books vids'});
  const chips=h('div',{class:'chips'},['all','A1','A2','B1','B2'].map(l=>h('button',{class:'chipbtn'+(l===lv?' on':''),'data-lv':l,onclick:e=>{lv=l;$$('.chips .chipbtn',root).forEach(c=>c.classList.toggle('on',c.dataset.lv===l));draw()}},l==='all'?'All':l)));
  function draw(){
    const vs=allVideos().filter(v=>lv==='all'||v.level===lv||(lv==='B1'&&v.level==='Own'&&false));
    grid.replaceChildren(...vs.map(v=>{
      const hasCaps=v.user?!!getCaps()[v.id]:v.caps;
      return h('a',{class:'book vid',href:'#/video/'+v.id,'data-id':v.id},
        h('div',{class:'thumb'},h('img',{src:`https://i.ytimg.com/vi/${v.ytId}/mqdefault.jpg`,alt:'',loading:'lazy',referrerpolicy:'no-referrer'}),h('span',{class:'dur'},v.dur?dur(v.dur):'▶')),
        h('div',{class:'bk'},h('div',{class:'row gap'},h('span',{class:'lv',style:{background:LV[v.level]||'#888'}},v.level),h('small',null,v.kind)),
          h('b',null,v.title),h('small',null,v.channel),h('p',null,v.desc),
          h('div',{class:'bm'},hasCaps?'📝 synced transcript':'🎬 video only (add subtitles to get a transcript)')),
        v.user?h('button',{class:'icon-btn','aria-label':'Delete',onclick:async e=>{e.preventDefault();e.stopPropagation();if(await confirmBox('Delete “'+v.title+'”?')){setUserVideos(getUserVideos().filter(x=>x.id!==v.id));const c=getCaps();delete c[v.id];ls.set('vidCaps',c);draw()}}},'🗑'):null);
    }));
  }
  root.replaceChildren(
    h('div',{class:'page-h'},mediaTabs('videos'),h('h1',null,'Videos 🎬'),h('p',{class:'sub'},'Free full episodes from official Turkish channels. Kids’ cartoons are the easiest place to start.')),
    h('button',{class:'btn wide',id:'btn-add-video',onclick:()=>addVideo(nav)},'＋ Add a YouTube video'),
    chips,grid,
    h('p',{class:'foot'},'Videos play from the official YouTube channels (embedded, never copied). ',h('a',{href:'#/about'},'Sources & licences')));
  draw();
}
function addVideo(nav){
  const y=h('input',{class:'inp',id:'vid-url',placeholder:'YouTube link (youtube.com/watch?v=… or youtu.be/…)',inputmode:'url'});
  const t=h('input',{class:'inp',id:'vid-title',placeholder:'Title (optional)'});
  const a=h('textarea',{class:'inp',id:'vid-subs',rows:'7',placeholder:'Optional: paste Turkish subtitles (.srt or .vtt text) to get a synced, tappable transcript. Plain text lines work too (no sync).'});
  sheet(h('div',{class:'confirm'},h('h3',null,'Add a video'),h('p',{class:'sub'},'Only the link and your subtitles are saved, on this device only. Use videos you are allowed to watch.'),y,t,a,h('div',{class:'row end'},
    h('button',{class:'btn ghost',onclick:closeSheet},'Cancel'),
    h('button',{class:'btn primary',id:'vid-save',onclick:()=>{
      const id=ytIdFrom(y.value); if(!id){toast('Paste a valid YouTube link');return}
      const vid={id:'uv-'+id,ytId:id,title:t.value.trim()||'My video','channel':'Added by you',level:'Own',kind:'My video',dur:0,desc:'Your own video link (saved on this device only).',user:true,caps:false};
      if(a.value.trim()){const cues=parseSubs(a.value);if(cues.length){const c=getCaps();c[vid.id]={cues,user:true};ls.set('vidCaps',c)}}
      setUserVideos([vid,...getUserVideos().filter(x=>x.id!==vid.id)]); closeSheet(); nav('#/video/'+vid.id);
    }},'Save video'))));
}

/* ---------- view ---------- */
let teardown=()=>{};
export function stopVideo(){teardown();teardown=()=>{}}
export function videoView(root,id,nav){
  stopVideo();
  const v=allVideos().find(x=>x.id===id); if(!v){nav('#/videos');return}
  let cues=[],auto=false,timed=false,showEn=false,follow=true,curI=-1,player=null,poll=null,chunkObs=null;
  const enCache=new Map();
  const body=h('div',{class:'transcript',id:'transcript'});
  const note=h('div',{class:'vnote-box hidden',id:'vid-note'});
  const playerBox=h('div',{class:'video'},h('div',{id:'yt-player'}));
  const hdrStatus=h('div',{class:'sub',id:'player-status'});
  function setCues(list,isAuto){
    cues=list;auto=!!isAuto;timed=cues.length>0&&cues.every(c=>c.t!=null);
    body.replaceChildren();chunkObs&&chunkObs.disconnect();
    if(!cues.length){
      note.classList.remove('hidden');
      note.replaceChildren(h('b',null,'No transcript yet for this video.'),h('p',null,'Watch it as a listening exercise, or paste Turkish subtitles (.srt/.vtt or plain text) to get a transcript with tappable words that follows the video.'),
        h('p',{class:'sub'},'Tip: if you have the subtitle file, open it in a text editor, copy everything and paste it here.'));
      return;
    }
    note.classList.toggle('hidden',!auto);
    if(auto) note.replaceChildren(h('b',null,'Auto-generated captions'),h('p',null,'These captions were generated automatically by YouTube, so some words may be wrong.'));
    for(let g=0;g<cues.length;g+=12){
      const grp=h('div',{class:'cgroup','data-g':g/12});
      cues.slice(g,g+12).forEach((c,k)=>{
        const i=g+k;const span=h('span',{class:'ltxt'});let pos=0;
        for(const w of tokenize(c.x)){ if(w.start>pos) span.append(c.x.slice(pos,w.start)); span.append(h('span',{class:'w','data-s':w.start},w.text)); pos=w.end }
        if(pos<c.x.length) span.append(c.x.slice(pos));
        c.en=h('div',{class:'len'+(showEn?'':' hidden')});
        c.el=h('div',{class:'cue','data-i':i},h('button',{class:'ctime',type:'button','aria-label':'Jump to this line'},timed?fmt(c.t):'▶'),h('div',{class:'lbody'},span,c.en));
        grp.append(c.el);
      });
      body.append(grp);
    }
    chunkObs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting&&showEn) translateGroup(+e.target.dataset.g)})},{rootMargin:'300px'});
    $$('.cgroup',body).forEach(g=>chunkObs.observe(g));
  }
  async function translateGroup(gi){
    if(enCache.get(gi+settings.tl)) return; enCache.set(gi+settings.tl,1);
    const part=cues.slice(gi*12,gi*12+12); part.forEach(c=>{if(!c.en.textContent)c.en.textContent='…'});
    try{
      const r=await translate(part.map(c=>c.x).join('\n')); const lines=r.text.split('\n').map(x=>x.trim());
      if(lines.length===part.length) part.forEach((c,k)=>c.en.textContent=lines[k]);
      else for(const c of part){const q=await translate(c.x);c.en.textContent=q.text}
    }catch(e){enCache.delete(gi+settings.tl);part.forEach(c=>{if(c.en.textContent==='…')c.en.textContent=''});toast('Translation service busy — scroll a bit to retry')}
  }
  function setCur(i,scroll){
    if(i===curI) return;
    if(curI>=0&&cues[curI]) cues[curI].el.classList.remove('cur');
    curI=i; if(i>=0){const el=cues[i].el;el.classList.add('cur');if(scroll&&follow){const r=el.getBoundingClientRect();if(r.top<120||r.bottom>innerHeight-110) el.scrollIntoView({block:'center',behavior:'smooth'})}}
  }
  function tick(){
    if(!player||!timed||!player.getCurrentTime) return;
    const t=player.getCurrentTime();let lo=0,hi=cues.length-1,r=-1;
    while(lo<=hi){const m=(lo+hi)>>1;if(cues[m].t<=t+0.15){r=m;lo=m+1}else hi=m-1}
    if(r>=0&&t>cues[r].t+cues[r].d+4) r=-1; // long gap with no speech
    setCur(r,true);
  }
  body.addEventListener('click',e=>{
    const cue=e.target.closest('.cue'); if(!cue) return; const i=+cue.dataset.i; const c=cues[i];
    const w=e.target.closest('.w');
    if(w){
      try{player&&player.pauseVideo&&player.pauseVideo()}catch{}
      setCur(timed?i:-1,false);
      openWordSheet({word:w.textContent,start:+w.dataset.s,sentence:c.x,bookTitle:'Video: '+v.title,bookId:'video:'+v.id,onPlayFrom:()=>{if(timed&&player){player.seekTo(c.t,true);player.playVideo()}else tts.speak(c.x,{})}});
    } else if(timed&&player&&player.seekTo){ player.seekTo(Math.max(0,c.t-0.2),true); player.playVideo(); setCur(i,false) }
    else tts.speak(c.x,{});
  });
  function addSubs(){
    const a=h('textarea',{class:'inp',id:'subs-text',rows:'10',placeholder:'Paste Turkish subtitles here (.srt / .vtt text, or plain lines).'});
    sheet(h('div',{class:'confirm'},h('h3',null,cues.length?'Replace transcript':'Add transcript'),h('p',{class:'sub'},'Saved on this device only.'),a,h('div',{class:'row end'},
      h('button',{class:'btn ghost',onclick:closeSheet},'Cancel'),
      cues.length&&getCaps()[v.id]?h('button',{class:'btn ghost',onclick:()=>{const c=getCaps();delete c[v.id];ls.set('vidCaps',c);closeSheet();videoView(root,id,nav)}},'Remove mine'):null,
      h('button',{class:'btn primary',id:'subs-save',onclick:()=>{const list=parseSubs(a.value);if(!list.length){toast('Nothing to import');return}const c=getCaps();c[v.id]={cues:list,user:true};ls.set('vidCaps',c);closeSheet();videoView(root,id,nav)}},'Save'))));
  }
  const enBtn=h('button',{class:'chipbtn'+(showEn?' on':''),id:'btn-en',onclick:e=>{showEn=!showEn;e.currentTarget.classList.toggle('on',showEn);$$('.len',body).forEach(x=>x.classList.toggle('hidden',!showEn));if(showEn){const vis=$$('.cgroup',body).filter(g=>{const r=g.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight+300});vis.forEach(g=>translateGroup(+g.dataset.g))}}},'🇬🇧 English');
  const followBtn=h('button',{class:'chipbtn on',id:'btn-follow',onclick:e=>{follow=!follow;e.currentTarget.classList.toggle('on',follow)}},'⤵ Follow video');
  const subsBtn=h('button',{class:'chipbtn',id:'btn-subs',onclick:addSubs},'📝 Paste subtitles');
  root.replaceChildren(
    h('div',{class:'topbar'},h('button',{class:'icon-btn',onclick:()=>{stopVideo();nav('#/videos')},'aria-label':'Back'},'‹'),h('div',{class:'tb-title'},h('b',null,v.title),h('small',null,v.channel)),h('span',null)),
    h('div',{class:'song-pad'},playerBox,hdrStatus,
      h('div',{class:'row wrap gap song-links'},
        h('a',{class:'btn small',id:'yt-open',href:'https://www.youtube.com/watch?v='+v.ytId,target:'_blank',rel:'noopener'},'▶ Open on YouTube'),
        v.channelUrl?h('a',{class:'btn small',href:v.channelUrl,target:'_blank',rel:'noopener'},'📺 '+v.channel):null),
      h('div',{class:'row wrap gap song-tools'},enBtn,followBtn,subsBtn),
      note,body,
      h('p',{class:'lic-note'},v.user?'Your own link. Playback and rights belong to the video’s uploader.':v.official+'. Streamed from YouTube; nothing is copied or re-hosted.')));
  // transcript source: user's pasted > bundled
  (async()=>{
    const mine=getCaps()[v.id];
    if(mine){setCues(mine.cues,false);return}
    if(!v.user&&v.caps){try{const d=await (await fetch('data/captions/'+v.id+'.json')).json();setCues(d.cues,d.auto);return}catch{}}
    setCues([],false);
  })();
  // player
  loadYT().then(YT=>{
    player=new YT.Player('yt-player',{videoId:v.ytId,host:'https://www.youtube-nocookie.com',width:'100%',height:'100%',playerVars:{playsinline:1,rel:0,modestbranding:1,hl:'tr',cc_lang_pref:'tr'},
      events:{onReady:()=>{hdrStatus.textContent='';},onStateChange:e=>{ if(e.data===1){ if(!poll) poll=setInterval(tick,250); bump('video') } else if(poll&&e.data!==3){clearInterval(poll);poll=null;tick()} },
        onError:e=>{hdrStatus.textContent='This video can’t be played here (error '+e.data+'). Use “Open on YouTube”.'}}});
  }).catch(()=>{playerBox.replaceChildren(h('div',{class:'vfail'},'The video player needs an internet connection.',h('br'),h('a',{href:'https://www.youtube.com/watch?v='+v.ytId,target:'_blank',rel:'noopener'},'Open on YouTube ↗')))});
  teardown=()=>{clearInterval(poll);poll=null;try{player&&player.destroy&&player.destroy()}catch{}player=null;chunkObs&&chunkObs.disconnect();tts.cancel()};
}
