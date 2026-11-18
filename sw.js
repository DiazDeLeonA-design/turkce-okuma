const VER='tr-reader-v3';
const SHELL=['./','index.html','css/style.css','manifest.webmanifest','icons/icon.svg','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png',
 'js/app.js','js/store.js','js/ui.js','js/tts.js','js/text.js','js/morph.js','js/dict.js','js/popup.js','js/reader.js','js/scenes.js','js/scenes-data.js','js/practice.js','js/songs.js','data/books.json','data/songs.json'];
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(VER); await c.addAll(SHELL);
    // picture-scene artwork (best effort)
    try{const m=await (await fetch('js/scenes-data.js')).text(); const hex=[...new Set([...m.matchAll(/'([0-9A-F]{4,5})'/g)].map(x=>x[1]))]; await Promise.all(hex.map(h=>c.add('assets/emoji/'+h+'.svg').catch(()=>{})))}catch{}
    self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys()) if(k!==VER) await caches.delete(k); await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin) return; // dictionary/translation APIs go straight to network
  e.respondWith((async()=>{
    const c=await caches.open(VER); const hit=await c.match(e.request,{ignoreSearch:true});
    const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>null);
    return hit||(await net)||(e.request.mode==='navigate'?c.match('index.html'):Response.error());
  })());
});
