import sharp from 'file:///C:/Users/Carlos%20Reales/Documents/Codex/2026-09-13/qu/outputs/Paco/real/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js';
export const MAX_FILE=8*1024*1024;
export class PhotoError extends Error{constructor(code,status=400){super(code);this.code=code;this.status=status;}}
export async function normalizePhoto(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length>MAX_FILE)throw new PhotoError('PHOTO_TOO_LARGE',413);
 const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const webp=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 if(!jpeg&&!png&&!webp)throw new PhotoError('PHOTO_FORMAT');
 try{
  const image=sharp(bytes,{limitInputPixels:40000000,failOn:'warning'});
  const meta=await image.metadata();
  if(!['jpeg','png','webp'].includes(meta.format)||(meta.pages||1)>1)throw new PhotoError('PHOTO_FORMAT');
  // Sharp strips metadata unless explicitly retained. Rotate honors EXIF before removal.
  const result=await image.rotate().resize({width:2048,height:2048,fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality:85}).toBuffer();
  if(result.length>MAX_FILE)throw new PhotoError('PHOTO_TOO_LARGE',413);
  return result;
 }catch(e){if(e instanceof PhotoError)throw e;throw new PhotoError('PHOTO_INVALID');}
}
export async function readLimited(request){
 const chunks=[];let total=0;
 for await(const chunk of request){total+=chunk.length;if(total>MAX_FILE)throw new PhotoError('PHOTO_TOO_LARGE',413);chunks.push(chunk);}
 return Buffer.concat(chunks);
}
export function validId(id){return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id||'');}

