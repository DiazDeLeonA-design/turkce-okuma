import {settings} from './store.js';
const synth=window.speechSynthesis;
export const supported=!!synth&&typeof SpeechSynthesisUtterance!=='undefined';
let voices=[],gen=0;
function score(v){
  const n=v.name.toLowerCase(); let s=0;
  if(/yelda/.test(n)) s+=6; if(/premium|enhanced|neural|natural/.test(n)) s+=4; if(/google/.test(n)) s+=2; if(/emel|filiz|tolga|cem/.test(n)) s+=3;
  if(v.localService) s+=1; return s;
}
export function loadVoices(){
  if(!supported) return [];
  voices=synth.getVoices().filter(v=>/^tr([-_]|$)/i.test(v.lang)).sort((a,b)=>score(b)-score(a));
  return voices;
}
if(supported){loadVoices(); synth.addEventListener?.('voiceschanged',loadVoices); setTimeout(loadVoices,300); setTimeout(loadVoices,1500);}
export const getVoices=()=>voices;
export function currentVoice(){
  if(settings.voice){const v=voices.find(v=>v.voiceURI===settings.voice||v.name===settings.voice); if(v) return v}
  return voices[0]||null;
}
export const hasVoice=()=>supported&&voices.length>0;
export function cancel(){gen++;if(supported)try{synth.cancel()}catch{}}
/** speak text. Returns a token. Calls opts.onend only if not cancelled/superseded. */
export function speak(text,opts={}){
  if(!supported){opts.onerror?.('unsupported');return 0}
  const my=++gen;
  try{synth.cancel()}catch{}
  const u=new SpeechSynthesisUtterance(text);
  u.lang='tr-TR'; const v=currentVoice(); if(v){u.voice=v;u.lang=v.lang.replace('_','-')}
  u.rate=opts.rate??settings.rate; u.pitch=1;
  u.onstart=()=>{if(my===gen)opts.onstart?.()};
  u.onboundary=e=>{if(my===gen)opts.onboundary?.(e)};
  u.onend=()=>{if(my===gen)opts.onend?.()};
  u.onerror=e=>{if(my===gen&&e.error!=='interrupted'&&e.error!=='canceled')opts.onerror?.(e.error)};
  setTimeout(()=>{if(my===gen){try{synth.speak(u)}catch(err){opts.onerror?.(String(err))}}},40);
  return my;
}
export const speakWord=(w,rate)=>speak(w,{rate:rate??Math.min(settings.rate,0.9)});
