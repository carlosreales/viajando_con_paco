const CACHE='pawco-shell-v1';
const APP_SHELL=['/','/index.html','/app.js','/style.css','/dog.svg','/paco-mark.svg','/manifest.webmanifest','/register-sw.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 event.respondWith(fetch(request).then(response=>{
  if(response.ok&&(request.mode==='navigate'||APP_SHELL.includes(url.pathname)))caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
  return response;
 }).catch(async()=>await caches.match(request)||await caches.match('/')));
});

