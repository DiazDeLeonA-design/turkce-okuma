import {h,$,$$,toast,shuffle,sheet,closeSheet} from './ui.js';
import {SCENES,emojiFile} from './scenes-data.js';
import {addWord,isSaved,bump,ls,settings} from './store.js';
import * as tts from './tts.js';

const NS='http://www.w3.org/2000/svg';
const objBox=o=>o.box?o.box:[o.x,o.y,o.s,o.s];
function svgFor(scene,{labels=false,dots=false,thumb=false}={}){
  const [w,hh]=scene.vb||[400,420]; const vbox=scene.vbox||`0 0 ${w} ${hh}`;
  let inner=scene.bg;
  scene.objs.forEach((o,i)=>{
    const [x,y,bw,bh]=objBox(o); const cx=x+bw/2, cy=y+bh/2;
    const pad=thumb?0:6;
    inner+=`<g class="obj${scene.body?' bodyobj':''}" data-i="${i}" ${thumb?'':`tabindex="0" role="button" aria-label="${o.tr}"`}>`;
    if(o.hex) inner+=`<ellipse class="halo" cx="${cx}" cy="${cy}" rx="${bw/2+4}" ry="${bh/2+4}"/><image href="${emojiFile(o.hex)}" x="${x}" y="${y}" width="${bw}" height="${bh}" preserveAspectRatio="xMidYMid meet"/>`;
    else if(scene.body&&!thumb) inner+=`<circle class="dotring" cx="${cx}" cy="${cy}" r="10"/><circle class="dot" cx="${cx}" cy="${cy}" r="5"/>`;
    else inner+=`<rect class="dhalo" x="${x}" y="${y}" width="${bw}" height="${bh}" rx="10"/>`;
    inner+=`<rect class="hit" x="${x-pad}" y="${y-pad}" width="${bw+pad*2}" height="${bh+pad*2}" fill="transparent"/>`;
    if(labels&&!thumb){
      if(scene.body&&o.lab){const [lx,ly,an]=o.lab;inner+=`<line class="lead" x1="${cx}" y1="${cy}" x2="${an==='end'?lx+2:lx-2}" y2="${ly-4}"/><text class="lbl" x="${lx}" y="${ly}" text-anchor="${an}">${o.tr}</text>`}
      else inner+=`<text class="lbl" x="${cx}" y="${y+bh+10}" text-anchor="middle">${o.tr}</text>`;
    }
    inner+='</g>';
  });
  return `<svg xmlns="${NS}" viewBox="${vbox}" class="scene-svg${thumb?' thumb':''}" role="img" aria-label="${scene.en}">${inner}</svg>`;
}
export function sceneList(root){
  root.replaceChildren(
    h('div',{class:'page-h'},h('h1',null,'Picture words'),h('p',{class:'sub'},'Tap things in the pictures to hear and learn the Turkish word. Then play “Find it”.')),
    h('div',{class:'scene-grid'},SCENES.map(sc=>{
      const best=ls.get('best:'+sc.id,null);
      const a=h('a',{class:'scene-card',href:'#/scene/'+sc.id},h('div',{class:'thumb',html:svgFor(sc,{thumb:true})}),
        h('div',{class:'meta'},h('b',null,sc.title),h('small',null,sc.en+' · '+sc.objs.length+' words'+(best!=null?' · best '+best+'/10':''))));
      return a;
    })));
}
const savedKey=o=>o.tr;
function saveObj(scene,o){
  return addWord({word:o.tr,root:o.tr,tr:o.en,rootTr:'',ex:`${o.tr} — plural: ${o.pl}`,book:'Picture words · '+scene.title,bookId:'scene:'+scene.id,lang:'en',kind:'picture',parts:[]});
}
export function sceneView(root,id,nav){
  const scene=SCENES.find(s=>s.id===id); if(!scene){root.textContent='Not found';return}
  let labels=false, selected=null;
  const stage=h('div',{class:'stage'});
  const info=h('div',{class:'obj-card empty'},'Tap a picture to see its Turkish word.');
  const lblBtn=h('button',{class:'chipbtn',id:'btn-labels',onclick:e=>{labels=!labels;e.currentTarget.classList.toggle('on',labels);draw()}},'🏷 Show words');
  function draw(){
    stage.innerHTML=svgFor(scene,{labels});
    if(selected!=null) stage.querySelector(`.obj[data-i="${selected}"]`)?.classList.add('sel');
  }
  function select(i,{speak=true}={}){
    selected=i; const o=scene.objs[i];
    $$('.obj.sel',stage).forEach(e=>e.classList.remove('sel')); stage.querySelector(`.obj[data-i="${i}"]`)?.classList.add('sel');
    const saved=isSaved(o.tr);
    const sv=h('button',{class:'btn primary'+(saved?' done':''),id:'btn-save-obj',disabled:saved,onclick:()=>{saveObj(scene,o);sv.textContent='✓ Saved';sv.disabled=true;sv.classList.add('done');toast('Saved to your words ⭐')}},saved?'✓ Saved':'⭐ Save to words');
    info.className='obj-card';
    info.replaceChildren(
      h('div',{class:'o-main'},h('div',null,h('div',{class:'o-tr',id:'o-tr'},o.tr),h('div',{class:'o-en',id:'o-en'},o.en)),h('button',{class:'icon-btn big',id:'btn-say','aria-label':'Listen',onclick:()=>tts.speakWord(o.tr)},'🔊')),
      h('div',{class:'o-pl'},'plural: ',h('b',null,o.pl)),sv);
    if(speak) tts.speakWord(o.tr);
  }
  stage.addEventListener('click',e=>{const g=e.target.closest('.obj');if(g) select(+g.dataset.i)});
  stage.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.obj')){e.preventDefault();select(+e.target.closest('.obj').dataset.i)}});
  draw();
  const list=h('div',{class:'word-chips'},scene.objs.map((o,i)=>h('button',{class:'wchip',onclick:()=>{select(i);window.scrollTo({top:0,behavior:'smooth'})}},h('b',null,o.tr),h('small',null,o.en))));
  root.replaceChildren(
    h('div',{class:'topbar'},h('button',{class:'icon-btn',onclick:()=>nav('#/scenes'),'aria-label':'Back'},'‹'),h('div',{class:'tb-title'},h('b',null,scene.title),h('small',null,scene.en)),h('span',null)),
    h('div',{class:'scene-tools'},lblBtn,h('button',{class:'btn small primary',id:'btn-game',onclick:()=>game(root,scene,()=>sceneView(root,id,nav),nav)},'🎯 Find it game'),
      h('button',{class:'btn small',onclick:()=>{let n=0;for(const o of scene.objs){if(!saveObj(scene,o).dup)n++}toast(n?`Saved ${n} new words ⭐`:'All already saved');if(selected!=null)select(selected,{speak:false})}},'⭐ Save all')),
    stage,info,
    h('h3',{class:'sec'},'All words in this picture'),list);
}
function game(root,scene,back,nav){
  tts.cancel();
  const pool=scene.objs.map((o,i)=>i); const N=Math.min(10,pool.length);
  const order=shuffle(pool).slice(0,N);
  let r=0,score=0,tries=0,locked=false,missed=[],showHint=!tts.hasVoice();
  const stage=h('div',{class:'stage'});
  const head=h('div',{class:'game-head'});
  const prompt=h('div',{class:'game-prompt'});
  function draw(){stage.innerHTML=svgFor(scene,{})}
  function say(){tts.speakWord(scene.objs[order[r]].tr)}
  function renderHead(){
    const o=scene.objs[order[r]];
    head.replaceChildren(h('div',{class:'g-stat'},h('b',null,`${r+1}/${N}`),' · score ',h('b',{id:'g-score'},String(score))));
    prompt.replaceChildren(
      h('div',{class:'row center'},h('button',{class:'btn primary',id:'btn-hear',onclick:say},'🔊 Hear it again'),
        h('button',{class:'btn small',id:'btn-hint',onclick:()=>{showHint=!showHint;renderHead()}},showHint?'Hide word':'Show word')),
      h('div',{class:'g-word',id:'g-word'},showHint?o.tr:'Which one did you hear?'));
  }
  function flash(i,cls){const g=stage.querySelector(`.obj[data-i="${i}"]`);if(g){g.classList.add(cls);setTimeout(()=>g.classList.remove(cls),cls==='good'?1200:600)}}
  function nextRound(){
    r++; tries=0; locked=false;
    if(r>=N) return finish();
    renderHead(); setTimeout(say,300);
  }
  function finish(){
    const prev=ls.get('best:'+scene.id,null); const best=prev==null?score:Math.max(prev,score); ls.set('best:'+scene.id,best);
    bump('game',1);
    root.replaceChildren(
      h('div',{class:'topbar'},h('button',{class:'icon-btn',onclick:back,'aria-label':'Back'},'‹'),h('div',{class:'tb-title'},h('b',null,'Find it'),h('small',null,scene.title)),h('span',null)),
      h('div',{class:'result'},h('div',{class:'big-score',id:'final-score'},`${score}/${N}`),h('p',null,score>=N*0.8?'Harika! 🎉':score>=N*0.5?'İyi! Keep going 👍':'Good practice — try again!'),h('p',{class:'sub'},`Best on this picture: ${best}/10`),
        missed.length?h('div',null,h('h3',null,'Words to review'),h('div',{class:'word-chips'},missed.map(i=>h('button',{class:'wchip',onclick:()=>tts.speakWord(scene.objs[i].tr)},h('b',null,scene.objs[i].tr),h('small',null,scene.objs[i].en)))),
          h('button',{class:'btn',onclick:()=>{missed.forEach(i=>saveObj(scene,scene.objs[i]));toast('Missed words saved ⭐')}},'⭐ Save missed words')):h('p',null,'No misses!'),
        h('div',{class:'row center'},h('button',{class:'btn primary',onclick:()=>game(root,scene,back,nav)},'Play again'),h('button',{class:'btn',onclick:back},'Back to picture'))));
  }
  stage.addEventListener('click',e=>{
    const g=e.target.closest('.obj'); if(!g||locked) return; const i=+g.dataset.i; const target=order[r];
    if(i===target){
      locked=true; if(tries===0){score++;bump('game',0)} else missed.push(target);
      flash(i,'good'); $('#g-word')&&($('#g-word').textContent='✓ '+scene.objs[i].tr+' — '+scene.objs[i].en); $('#g-word')?.classList.add('ok');
      tts.speakWord(scene.objs[i].tr);
      setTimeout(nextRound,1500);
    } else {
      tries++; flash(i,'bad'); tts.speakWord(scene.objs[i].tr);
      const w=$('#g-word'); if(w){w.textContent=`That’s “${scene.objs[i].tr}” (${scene.objs[i].en}). Try again!`;w.classList.add('bad');setTimeout(()=>w.classList.remove('bad'),900)}
      if(tries>=2){locked=true;missed.push(target);flash(target,'good');setTimeout(()=>{ $('#g-word')&&($('#g-word').textContent='It was “'+scene.objs[target].tr+'” ('+scene.objs[target].en+')'); tts.speakWord(scene.objs[target].tr)},1200);setTimeout(nextRound,3200)}
      else setTimeout(say,1400);
    }
  });
  draw();
  root.replaceChildren(
    h('div',{class:'topbar'},h('button',{class:'icon-btn',onclick:back,'aria-label':'Back'},'‹'),h('div',{class:'tb-title'},h('b',null,'Find it'),h('small',null,scene.title+' · listen and tap')),h('span',null)),
    head,prompt,stage);
  renderHead(); setTimeout(say,400);
}
