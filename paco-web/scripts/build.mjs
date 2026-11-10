import {build} from 'esbuild';
import {mkdir,copyFile,readFile,access,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const EXTENSIONS=['','.mjs','.js','.cjs','.json'];
async function resolveFile(candidate){
 for(const suffix of EXTENSIONS){
  const target=candidate+suffix;
  try{const info=await stat(target);if(info.isFile())return target;}catch{}
 }
 for(const suffix of EXTENSIONS.slice(1)){
  const target=path.join(candidate,'index'+suffix);
  try{const info=await stat(target);if(info.isFile())return target;}catch{}
 }
 throw Error('Cannot resolve '+candidate);
}
const workspaceFiles={name:'workspace-files',setup(builder){
 builder.onResolve({filter:/.*/},async args=>{
  if(/^https:\/\//.test(args.path))return {path:args.path,external:true};
  let resolved;
  if(args.path.startsWith('.')||path.isAbsolute(args.path)){
   resolved=await resolveFile(path.resolve(args.importer?path.dirname(args.importer):root,args.path));
  }else{
   const require=createRequire(args.importer||path.join(root,'package.json'));
   resolved=require.resolve(args.path);
   if(resolved.endsWith('.cjs')){
    const esm=resolved.slice(0,-4)+'.mjs';
    try{await access(esm);resolved=esm;}catch{}
   }
   resolved=await resolveFile(resolved);
  }
  return {path:resolved,namespace:'workspace'};
 });
 builder.onLoad({filter:/.*/,namespace:'workspace'},async args=>({contents:await readFile(args.path,'utf8'),loader:args.path.endsWith('.json')?'json':'js'}));
}};
await mkdir(path.join(root,'dist'),{recursive:true});
await build({entryPoints:[path.join(root,'src','app.js')],plugins:[workspaceFiles],bundle:true,format:'esm',outfile:path.join(root,'dist','app.js'),platform:'browser',target:['es2022'],minify:true});
for(const file of ['index.html','style.css','dog.svg','paco-mark.svg'])await copyFile(path.join(root,'src',file),path.join(root,'dist',file));
console.log('Paco build OK');
