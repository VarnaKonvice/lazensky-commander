const CACHE_NAME = 'komander-v8-two-next';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-1024.png', './lazensky-import-28dni.json'];
const EXTRA_CSS = `.next.compact{padding:16px}.next.compact .nexttime{font-size:clamp(43px,13vw,58px);margin-top:12px}.next.compact .nexttitle{font-size:clamp(27px,7.7vw,35px);margin-top:10px}.next.compact .nextplace{font-size:22px;margin-top:10px}.next.compact .leavegrid{margin-top:14px}.next.compact .leave .value{font-size:32px}`;
const OLD_NEXT = `function nextCard(next,now){if(!next)return'';const meal=next.type==='meal',start=dt(next.date,next.start),leave=addMinDate(start,-state.data.stay.leaveBufferMinutes),toStart=Math.max(0,mins(now,start)),toLeave=Math.max(0,mins(now,leave)),tomorrow=iso(now)!==next.date;return\`<section class="card next ${meal?'meal':'procedure'}"><span class="pill">Následuje</span><div class="kicker">${meal?'Další jídlo':'Další procedura'}${tomorrow?' · '+fmtDate(next.date):''}</div><div class="nexttime">${next.start}</div><div class="nexttitle">${esc(next.title)}</div><div class="nextplace">${meal?'♨':'⌖'} ${esc(next.place)}</div><div class="leavegrid"><div class="leave"><div class="label">Odejít nejpozději</div><div class="value">${fmtTime(leave)}</div><b>za ${countdown(toLeave)}</b></div><div class="startlabel">Začíná za${ringHtml(toStart)}</div></div></section>\`}`;
const NEW_NEXT = `function nextCard(next,now,rank=0){if(!next)return'';const meal=next.type==='meal',start=dt(next.date,next.start),leave=addMinDate(start,-state.data.stay.leaveBufferMinutes),toStart=Math.max(0,mins(now,start)),toLeave=Math.max(0,mins(now,leave)),otherDay=iso(now)!==next.date,label=rank===0?'Následuje':'Potom',headline=(rank===0?'Další':'Potom')+' '+(meal?'jídlo':'procedura');return\`<section class="card next ${meal?'meal':'procedure'} ${rank>0?'compact':''}"><span class="pill">${label}</span><div class="kicker">${headline}${otherDay?' · '+fmtDate(next.date):''}</div><div class="nexttime">${next.start}</div><div class="nexttitle">${esc(next.title)}</div><div class="nextplace">${meal?'♨':'⌖'} ${esc(next.place)}</div><div class="leavegrid"><div class="leave"><div class="label">Odejít nejpozději</div><div class="value">${fmtTime(leave)}</div><b>za ${countdown(toLeave)}</b></div><div class="startlabel">Začíná za${ringHtml(toStart)}</div></div></section>\`}`;
const OLD_TODAY = `function todayView(){const now=new Date(),ds=dates(),today=ds.includes(iso(now))?iso(now):ds[0],viewNow=ds.includes(iso(now))?now:dt(today,'07:20'),list=dayItems(today),cur=list.find(i=>viewNow>=dt(i.date,i.start)&&viewNow<=dt(i.date,i.end)),nextToday=list.find(i=>dt(i.date,i.start)>viewNow),nextAny=state.data.items.filter(i=>dt(i.date,i.start)>viewNow).sort((a,b)=>dt(a.date,a.start)-dt(b.date,b.start))[0],visible=list.filter(i=>!isDone(i,viewNow));return\`<main class="content">${cur?nowCard(cur,viewNow):emptyNow(nextToday)}${nextCard(nextAny,viewNow)}${summary(today,'Dnešní program')}${visible.length?\`<div class="list">${visible.map(i=>itemCard(i,viewNow)).join('')}</div>\`:''}</main>\`}`;
const NEW_TODAY = `function todayView(){const now=new Date(),ds=dates(),today=ds.includes(iso(now))?iso(now):ds[0],viewNow=ds.includes(iso(now))?now:dt(today,'07:20'),list=dayItems(today),cur=list.find(i=>viewNow>=dt(i.date,i.start)&&viewNow<=dt(i.date,i.end)),nextToday=list.find(i=>dt(i.date,i.start)>viewNow),nextTwo=state.data.items.filter(i=>dt(i.date,i.start)>viewNow).sort((a,b)=>dt(a.date,a.start)-dt(b.date,b.start)).slice(0,2),visible=list.filter(i=>!isDone(i,viewNow)),showToday=Boolean(cur||nextToday||visible.length);return\`<main class="content">${cur?nowCard(cur,viewNow):emptyNow(nextToday)}${nextTwo.map((i,idx)=>nextCard(i,viewNow,idx)).join('')}${showToday?summary(today,'Dnešní program'):''}${visible.length?\`<div class="list">${visible.map(i=>itemCard(i,viewNow)).join('')}</div>\`:''}</main>\`}`;
async function patchIndex(response) {
  let html = await response.text();
  html = html.replace("const VERSION='v6-ring-clean';", "const VERSION='v8-two-next';");
  if (!html.includes('.next.compact')) html = html.replace('</style>', EXTRA_CSS + '</style>');
  html = html.replace(OLD_NEXT, NEW_NEXT).replace(OLD_TODAY, NEW_TODAY);
  return new Response(html, {headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
}
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).catch(() => undefined));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isIndex = event.request.mode === 'navigate' || url.pathname.endsWith('/komander/') || url.pathname.endsWith('/komander/index.html');
  if (isIndex) {
    event.respondWith((async () => {
      try { return await patchIndex(await fetch(event.request, {cache:'no-store'})); }
      catch (error) { const cached = await caches.match('./index.html'); return cached ? patchIndex(cached) : new Response('Komandér se nepodařilo načíst.', {status:500}); }
    })());
    return;
  }
  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, fresh.clone()).catch(() => undefined);
      return fresh;
    } catch (error) {
      const cached = await caches.match(event.request);
      return cached || caches.match('./index.html');
    }
  })());
});
