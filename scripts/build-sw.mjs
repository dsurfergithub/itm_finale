import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
async function walk(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) =>
      e.isDirectory() ? walk(`${path}/${e.name}`) : [`${path}/${e.name}`],
    ),
  );
  return nested.flat();
}
const files = (await walk("dist")).filter(
  (f) => !f.endsWith("/sw.js") && !f.endsWith(".txt"),
);
const digest = createHash("sha256");
for (const f of files) digest.update(await readFile(f));
const name = `itm-coastal-${digest.digest("hex").slice(0, 12)}`;
const urls = files.map((f) => f.slice(4));
await writeFile(
  "dist/sw.js",
  `
const CACHE=${JSON.stringify(name)};
const ASSETS=${JSON.stringify(urls)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('itm-coastal-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/index.html')));return;}
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
`,
);
console.log(`Offline cache: ${urls.length} local assets (${name})`);
