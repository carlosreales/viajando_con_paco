import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const file=name=>readFile(new URL('../src/'+name,import.meta.url),'utf8');

test('Mobile shell is installable and never caches private API responses',async()=>{
 const [html,manifest,worker,app,css]=await Promise.all([file('index.html'),file('manifest.webmanifest'),file('sw.js'),file('app.js'),file('style.css')]);
 assert.match(html,/viewport-fit=cover/);assert.match(html,/manifest\.webmanifest/);assert.match(html,/register-sw\.js/);
 assert.equal(JSON.parse(manifest).display,'standalone');
 assert.match(worker,/url\.pathname\.startsWith\('\/api\/'\)/);assert.match(worker,/request\.method!==['"]GET['"]/);
 assert.match(app,/photo-preview/);assert.match(app,/isUnauthenticated\(e\)/);assert.match(css,/safe-area-inset-bottom/);assert.match(css,/font-size:16px/);
});

