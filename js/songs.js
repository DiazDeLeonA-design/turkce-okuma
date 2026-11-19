import {h,$,$$,toast,sheet,closeSheet,confirmBox} from './ui.js';
import {tokenize} from './text.js';
import {settings,ls,bump} from './store.js';
import {translate} from './dict.js';
import {openWordSheet} from './popup.js';
import * as tts from './tts.js';
import {mediaTabs} from './videos.js';

let SONGS=[];
export async function loadSongs(){try{SONGS=await (await fetch('data/songs.json')).json()}catch(e){console.error(e);SONGS=[]}}
export const getUserSongs=()=>ls.get('userSongs',[]);
const setUserSongs=v=>ls.set('userSongs',v);
export const allSongs=()=>[...getUserSongs(),...SONGS];
export const bundledSongs=()=>SONGS;
const LV={A1:'#2e9e5b',A2:'#58b368',B1:'#e0a526',B2:'#e07a26',C1:'#c8402e',Own:'#5b6ee1'};
export const ytIdFrom=u=>{const m=String(u||'').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);return m?m[1]:''};
const ytSearch=s=>s.yt_search||'https://www.youtube.com/results?search_query='+encodeURIComponent(s.title+' türkü');
export function parseLyrics(text){
  const lines=[];let stanza=0,prevBlank=false;
  for(const raw of text.replace(/\r/g,'').split('\n')){
    const t=raw.trim();
    if(!t){ if(lines.length&&!prevBlank){stanza++;prevBlank=true} continue }
    prevBlank=false; lines.push({i:lines.length,text:t,stanza,words:tokenize(t)});
  }
  return lines;
}
export function songList(root,nav){
  const songs=allSongs();
  root.replaceChildren(
    h('div',{class:'page-h'},mediaTabs('songs'),h('h1',null,'Songs 🎵'),h('p',{class:'sub'},'Traditional Turkish folk songs, lullabies and children’s songs. Tap words, hear lines, sing along.')),
    h('button',{class:'btn wide',id:'btn-add-song',onclick:()=>addSong(nav)},'＋ Add your own lyrics'),
    h('div',{class:'books'},songs.map(s=>h('a',{class:'book song',href:'#/song/'+s.id,'data-id':s.id},
      h('span',{class:'lv',style:{background:LV[s.level]||'#888'}},s.level),
      h('div',{class:'bk'},h('b',null,s.title),h('small',null,s.kind),h('p',null,s.desc),h('div',{class:'bm'},s.ytId?'▶ video embedded':'🔎 YouTube search link')),
      s.user?h('button',{class:'icon-btn','aria-label':'Delete',onclick:async e=>{e.preventDefault();e.stopPropagation();if(await confirmBox('Delete “'+s.title+'”?')){setUserSongs(getUserSongs().filter(x=>x.id!==s.id));songList(root,nav)}}},'🗑'):null))),
    h('p',{class:'foot'},h('a',{href:'#/about'},'Sources & licences')));
}
function addSong(nav){
  const t=h('input',{class:'inp',id:'song-title',placeholder:'Song title'});
  const y=h('input',{class:'inp',id:'song-yt',placeholder:'YouTube link (optional)',inputmode:'url'});
  const a=h('textarea',{class:'inp',id:'song-lyrics',rows:'9',placeholder:'Paste Turkish lyrics here. Leave a blank line between verses.'});
  sheet(h('div',{class:'confirm'},h('h3',null,'Add your own song'),h('p',{class:'sub'},'Stored only on this device.'),t,y,a,h('div',{class:'row end'},
    h('button',{class:'btn ghost',onclick:closeSheet},'Cancel'),
    h('button',{class:'btn primary',id:'song-save',onclick:()=>{
      if(a.value.trim().length<5){toast('Paste some lyrics first');return}
      const s={id:'us-'+Date.now().toString(36),title:t.value.trim()||'My song',kind:'My song',level:'Own',desc:'Your own lyrics (saved on this device only).',lyrics:a.value.trim(),ytId:ytIdFrom(y.value),ytNote:'',user:true,
        yt_search:'https://www.youtube.com/results?search_query='+encodeURIComponent((t.value.trim()||'')+' lyrics')};
      setUserSongs([s,...getUserSongs()]); closeSheet(); nav('#/song/'+s.id);
    }},'Save song'))));
}
export function songView(root,id,nav){
  const song=allSongs().find(s=>s.id===id); if(!song){nav('#/songs');return}
  const lines=parseLyrics(song.lyrics);
  let cur=-1,playing=false,sync=false,showEn=false; const en={};
  const body=h('div',{class:'lyrics'});
  let st=-1,block=null;
  for(const L of lines){
    if(L.stanza!==st){st=L.stanza;block=h('div',{class:'stanza'});body.append(block)}
    const span=h('span',{class:'ltxt'});let pos=0;
    for(const w of L.words){ if(w.start>pos) span.append(L.text.slice(pos,w.start)); span.append(h('span',{class:'w','data-s':w.start},w.text)); pos=w.end }
    if(pos<L.text.length) span.append(L.text.slice(pos));
    L.enEl=h('div',{class:'len hidden'});
    L.el=h('div',{class:'line','data-i':L.i},h('span',{class:'lno'},String(L.i+1)),h('div',{class:'lbody'},span,L.enEl),
      h('button',{class:'icon-btn lsay','aria-label':'Hear this line',onclick:e=>{e.stopPropagation();say(L.i)}},'🔊'));
    block.append(L.el);
  }
  function mark(i){ $$('.line.cur',body).forEach(e=>e.classList.remove('cur')); cur=i; if(i>=0){lines[i].el.classList.add('cur');lines[i].el.scrollIntoView({block:'center',behavior:'smooth'})} syncLbl() }
  function say(i,{chain=false}={}){
    mark(i); const L=lines[i];
    tts.speak(L.text.replace(/\(.*?\)/g,'').replace(/[…]/g,'...'),{onend:()=>{bump('read');if(chain&&playing&&i<lines.length-1) setTimeout(()=>{if(playing)say(i+1,{chain:true})},350); else if(chain){stopAll()}},onerror:er=>{stopAll();toast('Speech error: '+er)}});
  }
  function stopAll(){playing=false;tts.cancel();playBtn.textContent='▶ Read aloud';}
  const playBtn=h('button',{class:'btn small primary',id:'btn-song-play',onclick:()=>{ if(playing){stopAll();return} playing=true;playBtn.textContent='⏸ Stop';say(Math.max(0,Math.min(cur,lines.length-1)),{chain:true}) }},'▶ Read aloud');
  const enBtn=h('button',{class:'chipbtn',id:'btn-en',onclick:e=>{showEn=!showEn;e.currentTarget.classList.toggle('on',showEn);$$('.len',body).forEach(x=>x.classList.toggle('hidden',!showEn));if(showEn)translateAll()}},'🇬🇧 English');
  const syncBtn=h('button',{class:'chipbtn',id:'btn-sync',onclick:e=>{sync=!sync;e.currentTarget.classList.toggle('on',sync);syncBar.classList.toggle('hidden',!sync);stopAll();mark(-1);document.body.classList.toggle('syncing',sync)}},'🎵 Sync with music');
  const syncLblEl=h('span',{class:'sync-lbl',id:'sync-lbl'});
  function syncLbl(){syncLblEl.textContent=cur<0?'Press play on the video, then tap Next line':`Line ${cur+1} / ${lines.length}`}
  const next=()=>{ if(cur<lines.length-1) mark(cur+1); else toast('End of song') };
  const prev=()=>{ if(cur>0) mark(cur-1) };
  const syncBar=h('div',{class:'syncbar hidden',id:'syncbar'},syncLblEl,h('div',{class:'row center'},
    h('button',{class:'btn',id:'sync-prev',onclick:prev},'◀ Back'),h('button',{class:'btn primary big',id:'sync-next',onclick:next},'Next line ▶'),h('button',{class:'btn',id:'sync-reset',onclick:()=>mark(-1)},'⟲ Restart')));
  syncLbl();
  async function translateAll(){
    // translate stanza by stanza (one request per verse), fall back to per-line
    const byStanza=new Map(); for(const L of lines){ if(!byStanza.has(L.stanza)) byStanza.set(L.stanza,[]); byStanza.get(L.stanza).push(L) }
    for(const [,ls_] of byStanza){
      if(ls_.every(L=>L.enEl.dataset.done)) continue;
      ls_.forEach(L=>{if(!L.enEl.textContent)L.enEl.textContent='…'});
      try{
        const key=settings.tl+'|'+ls_.map(L=>L.text).join('\n');
        let parts=en[key];
        if(!parts){const r=await translate(ls_.map(L=>L.text).join('\n')); parts=r.text.split('\n').map(x=>x.trim()); en[key]=parts}
        if(parts.length===ls_.length){ ls_.forEach((L,k)=>{L.enEl.textContent=parts[k];L.enEl.dataset.done=1}) }
        else { for(const L of ls_){ const r=await translate(L.text); L.enEl.textContent=r.text; L.enEl.dataset.done=1 } }
      }catch(e){ ls_.forEach(L=>{L.enEl.textContent='(translation unavailable right now)'}); toast('Translation service busy — try again in a moment'); return }
    }
  }
  body.addEventListener('click',e=>{
    const w=e.target.closest('.w'); const ln=e.target.closest('.line'); if(!ln) return; const i=+ln.dataset.i;
    if(w){
      const was=playing; if(was) stopAll(); mark(i);
      openWordSheet({word:w.textContent,start:+w.dataset.s,sentence:lines[i].text,bookTitle:'Song: '+song.title,bookId:'song:'+song.id,onPlayFrom:()=>{playing=false;say(i)}});
    } else if(sync) mark(i); else if(!e.target.closest('.lsay')) say(i);
  });
  const vid=song.ytId?h('div',{class:'video'},h('iframe',{id:'yt-frame',src:`https://www.youtube-nocookie.com/embed/${song.ytId}?playsinline=1&rel=0`,title:'Video: '+song.title,allow:'accelerometer; encrypted-media; picture-in-picture; fullscreen',allowfullscreen:true,loading:'lazy',referrerpolicy:'strict-origin-when-cross-origin'}),
      h('div',{class:'vnote'},song.ytNote||'')):null;
  root.replaceChildren(
    h('div',{class:'topbar'},h('button',{class:'icon-btn',onclick:()=>{stopAll();nav('#/songs')},'aria-label':'Back'},'‹'),h('div',{class:'tb-title'},h('b',null,song.title),h('small',null,song.kind)),h('span',null)),
    h('div',{class:'song-pad'},vid,
      h('div',{class:'row wrap gap song-links'},
        song.ytId?h('a',{class:'btn small',id:'yt-open',href:'https://www.youtube.com/watch?v='+song.ytId,target:'_blank',rel:'noopener'},'▶ Open on YouTube'):null,
        h('a',{class:'btn small',id:'yt-search',href:ytSearch(song),target:'_blank',rel:'noopener'},'🔎 Find more versions on YouTube')),
      h('div',{class:'row wrap gap song-tools'},playBtn,enBtn,syncBtn),
      syncBar,body,
      h('p',{class:'lic-note'},song.user?'Your own lyrics – stored only on this device.':'Lyrics: traditional/anonymous, public domain. '+(song.source?'Source: ':''),!song.user&&song.source?h('a',{href:song.source.split(', ')[0],target:'_blank',rel:'noopener'},'Turkish Wikisource ↗'):null)));
}
