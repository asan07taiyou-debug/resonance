// ソウルアリーナ：オフライン対応用サービスワーカー
const VERSION='resonance-v0.77';
const ICON_V='0.68'; // アイコンを変えたら、この数字と index.html・manifest.webmanifest の ?v= をそろえて上げる
const CORE=['./','./index.html','./manifest.webmanifest',
  './icon-192.png?v='+ICON_V,'./icon-512.png?v='+ICON_V,'./icon-maskable-512.png?v='+ICON_V,'./apple-touch-icon.png?v='+ICON_V];
// ブラウザの記録（HTTPキャッシュ）ではなく、必ずサーバーから取りなおして保存する
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
const netFirst=(req,key)=>fetch(req).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(VERSION).then(c=>c.put(key||req,cp));}return r;}).catch(()=>caches.match(key||req));
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url),same=url.origin===location.origin;
  // ゲーム本体は「まずネット、だめならキャッシュ」：更新がすぐ届き、オフラインでも遊べる
  if(req.mode==='navigate'||(same&&url.pathname.endsWith('.html'))){e.respondWith(netFirst(req,'./index.html'));return;}
  // アプリの設定とアイコンも「まずネット」：アイコンや名前を変えたときに、古いものが残らないように
  if(same&&(url.pathname.endsWith('.webmanifest')||url.pathname.endsWith('.png'))){e.respondWith(netFirst(req));return;}
  // フォント・通信ライブラリ・Firebaseの読み込みファイルだけ「まずキャッシュ」。Googleのログインやデータの通信は保存せず、そのままネットへ
  const cacheable=['fonts.googleapis.com','fonts.gstatic.com','cdn.jsdelivr.net'].includes(url.hostname)||(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/'));
  if(cacheable){
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque')){const cp=r.clone();caches.open(VERSION).then(c=>c.put(req,cp));}return r;})));
  }
});
