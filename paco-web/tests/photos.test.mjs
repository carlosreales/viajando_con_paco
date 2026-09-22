import {test} from 'node:test';import assert from 'node:assert/strict';import sharp from 'sharp';
import {normalizePhoto,MAX_FILE,readLimited} from '../lib/photos.mjs';
test('JPEG processing resizes, strips EXIF and preserves a valid image',async()=>{
 const source=await sharp({create:{width:2500,height:1300,channels:3,background:'#ccaa66'}}).jpeg().withExif({'IFD0':{Artist:'Private author',ImageDescription:'Private data'}}).toBuffer();
 const before=await sharp(source).metadata();assert.ok(before.exif);
 const output=await normalizePhoto(source);const meta=await sharp(output).metadata();
 assert.equal(meta.format,'jpeg');assert.equal(meta.width,2048);assert.equal(meta.exif,undefined);assert.equal(meta.icc,undefined);assert.ok(output.length<MAX_FILE);
});
test('PNG/WebP accepted and converted; SVG, false magic, huge body rejected',async()=>{
 for(const format of ['png','webp']){
  const source=await sharp({create:{width:10,height:10,channels:4,background:'#fff0'}}).toFormat(format).toBuffer();
  assert.equal((await sharp(await normalizePhoto(source)).metadata()).format,'jpeg');
 }
 await assert.rejects(normalizePhoto(Buffer.from('<svg></svg>')),/PHOTO_FORMAT/);
 await assert.rejects(normalizePhoto(Buffer.from([255,216,255,0,0])),/PHOTO_INVALID/);
 await assert.rejects(normalizePhoto(Buffer.alloc(MAX_FILE+1)),/PHOTO_TOO_LARGE/);
});
test('stream reader bounds unknown-length upload',async()=>{
 async function* oversized(){yield Buffer.alloc(MAX_FILE);yield Buffer.alloc(1);}
 await assert.rejects(readLimited(oversized()),/PHOTO_TOO_LARGE/);
});

