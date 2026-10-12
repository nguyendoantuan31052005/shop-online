const {test}=require('node:test');const assert=require('node:assert/strict');const {openDb,createUser}=require('../src/db');const backend=require('../src/customer');
test('Customer backend isolates carts, validates variants, rolls back failed saves and manages profiles',()=>{
 const db=openDb(':memory:');const a=createUser(db,{name:'A',username:'a',password:'password123'});const b=createUser(db,{name:'B',username:'b',password:'password123'});
 const item={productId:1,quantity:2,size:'M',color:db.data.products[0].colors[0]};
 backend.handle(db,a.id,'/api/cart','PUT',{items:[item]});assert.equal(backend.handle(db,a.id,'/api/cart','GET',{}).items.length,1);assert.equal(backend.handle(db,b.id,'/api/cart','GET',{}).items.length,0);
 assert.throws(()=>backend.handle(db,a.id,'/api/cart','PUT',{items:[{...item,quantity:999}]}));
 const original=JSON.stringify(db.data);const save=db.save;db.save=()=>{throw Error('disk');};assert.throws(()=>backend.handle(db,a.id,'/api/cart','DELETE',{}));assert.equal(JSON.stringify(db.data),original);db.save=save;
 assert.throws(()=>backend.account(db,a.id,'/api/auth/me',{email:'bad'}));assert.throws(()=>backend.account(db,a.id,'/api/auth/me',{disabled:false}));
 assert.equal(backend.account(db,a.id,'/api/auth/me',{name:'Updated'}).user.name,'Updated');
 assert.throws(()=>backend.account(db,a.id,'/api/auth/password',{currentPassword:'wrong',newPassword:'password456'}));
 backend.account(db,a.id,'/api/auth/password',{currentPassword:'password123',newPassword:'password456'});assert.equal(db.data.users[0].tokenVersion,1);
 backend.handle(db,a.id,'/api/wishlist','PUT',{productIds:[1,1]});assert.equal(backend.handle(db,a.id,'/api/wishlist','GET',{}).products.length,1);
});
const {createApp}=require('../src/app');
test('HTTP account changes revoke tokens; customer cancellation enforces ownership',async t=>{
 const db=openDb(':memory:');const server=createApp({db,jwtSecret:'x'.repeat(48),adminToken:'private-admin'});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));});
 const base='http://127.0.0.1:'+server.address().port;
 async function req(route,method='GET',body,token){const res=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,body:await res.json()};}
 const a=await req('/api/auth/register','POST',{name:'A',username:'alpha',password:'password123'});const b=await req('/api/auth/register','POST',{name:'B',username:'beta',password:'password123'});
 assert.equal((await req('/api/cart')).status,401);
 const item={productId:1,quantity:1,size:'M',color:db.data.products[0].colors[0]};
 assert.equal((await req('/api/cart','PUT',{items:[item]},a.body.token)).status,200);
 const order=await req('/api/orders','POST',{customer:{name:'Buyer',phone:'0901234567',address:'Test address'},items:[item]},a.body.token);assert.equal(order.status,201);
 assert.equal((await req('/api/cart','GET',undefined,a.body.token)).body.items.length,0);
 assert.equal((await req('/api/orders/'+order.body.id+'/cancel','POST',{},b.body.token)).status,404);
 assert.equal((await req('/api/orders/'+order.body.id+'/cancel','POST',{},a.body.token)).status,200);
 assert.equal((await req('/api/auth/password','POST',{currentPassword:'password123',newPassword:'changed-password'},a.body.token)).status,200);
 assert.equal((await req('/api/auth/me','GET',undefined,a.body.token)).status,401);
 const login=await req('/api/auth/login','POST',{username:'alpha',password:'changed-password'});assert.equal(login.status,200);
 assert.equal((await req('/api/auth/logout','POST',{},login.body.token)).status,200);
 assert.equal((await req('/api/auth/me','GET',undefined,login.body.token)).status,401);
});
