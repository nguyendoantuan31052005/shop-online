const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createApp}=require('../src/app');
const {openDb}=require('../src/db');
test('Product uploads require admin, reject invalid files and survive server restart',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shop-images-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const db=openDb(':memory:');let server;
 async function start(){server=createApp({db,uploadDir:dir,adminToken:'test-secret'});await new Promise(r=>server.listen(0,'127.0.0.1',r));return 'http://127.0.0.1:'+server.address().port;}
 async function stop(){server.closeAllConnections();await new Promise(r=>server.close(r));}
 t.after(async()=>{if(server.listening)await stop();});
 let base=await start();
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 assert.equal((await fetch(base+'/api/admin/images',{method:'POST',body:png})).status,401);
 const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'test-secret'})});
 const headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-Requested-With':'shop-admin'};
 assert.equal((await fetch(base+'/api/admin/images',{method:'POST',headers,body:'<svg></svg>'})).status,400);
 assert.equal((await fetch(base+'/api/admin/images',{method:'POST',headers,body:Buffer.alloc(5*1024*1024+1)})).status,413);
 const uploaded=await fetch(base+'/api/admin/images',{method:'POST',headers,body:png});assert.equal(uploaded.status,201);
 const {image}=await uploaded.json();assert.match(image,/^\/uploads\/[a-f0-9-]+\.png$/);
 const save=await fetch(base+'/api/admin/products/1',{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({image})});assert.equal(save.status,200);
 assert.equal((await save.json()).image,image);
 await stop();base=await start();
 const result=await fetch(base+image);assert.equal(result.status,200);assert.equal(result.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await result.arrayBuffer()),png);
 assert.equal((await fetch(base+'/uploads/not-a-file.png')).status,404);
});
