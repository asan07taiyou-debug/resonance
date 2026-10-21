// レゾナンス：オフライン対応用サービスワーカー
const VERSION='resonance-v0.32';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  // ゲーム本体は「まずネット、だめならキャッシュ」：更新がすぐ届き、オフラインでも遊べる
  if(req.mode==='navigate'||(url.origin===location.origin&&url.pathname.endsWith('.html'))){
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(VERSION).then(c=>c.put('./index.html',cp));return r;}).catch(()=>caches.match('./index.html')));
    return;
  }
  // それ以外（アイコン・フォント・通信ライブラリ）は「まずキャッシュ」
  if(url.protocol.startsWith('http')){
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque')){const cp=r.clone();caches.open(VERSION).then(c=>c.put(req,cp));}return r;})));
  }
});
