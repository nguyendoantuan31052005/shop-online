const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { openDb, getOrder } = require('../src/db');
const { createApp } = require('../src/app');
const c = require('../src/commerce');
const customer = { name: '<img src=x onerror=alert(1)>', phone: '0901234567', address: '12 Test', email: 'a@example.com' };
const payload = (extra = {}) => ({ customer, items: [{productId:1,quantity:1,size:'M',color:'Đen'}], ...extra });
const voucher = (db, extra = {}) => c.saveVoucher(db, null, {code:'SALE10',type:'percent',value:10,...extra});
async function fixture(t, options = {}) {
  const db = openDb(':memory:'); const server = createApp({db,adminToken:'private-admin-password',jwtSecret:'a'.repeat(48),...options});
  await new Promise(r => server.listen(0,'127.0.0.1',r));
  t.after(async () => { server.closeAllConnections(); await new Promise(r=>server.close(r)); });
  const request = async (route, method = 'GET', body, headers = {}) => {
    const res = await fetch('http://127.0.0.1:'+server.address().port+route,{method,headers:{'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')};
  };
  return {db,request};
}
test('Admin login uses HttpOnly session; CRUD requires auth; logout revokes it',async t=>{
  const {request}=await fixture(t);
  for(const route of ['products','vouchers','orders'])assert.equal((await request('/api/admin/'+route)).status,401);
  assert.equal((await request('/api/admin/login','POST',{password:'admin123'})).status,401);
  const login=await request('/api/admin/login','POST',{password:'private-admin-password'});
  assert.equal(login.status,200);assert.match(login.cookie,/HttpOnly/);assert.match(login.cookie,/SameSite=Strict/);
  const headers={Cookie:login.cookie.split(';')[0],'X-Requested-With':'shop-admin'};
  const data={name:'Áo <b>mới</b>',category:'Thời trang',price:200000,stock:5,sizes:['S','M'],colors:['Đen'],image:'https://example.com/image.jpg'};
  const added=await request('/api/admin/products','POST',data,headers);assert.equal(added.status,201);
  const id=added.body.id;
  assert.equal((await request('/api/products/'+id)).body.name,data.name);
  assert.equal((await request('/api/admin/products/'+id,'PATCH',{price:250000,stock:8},headers)).body.stock,8);
  assert.equal((await request('/api/admin/products/'+id,'PATCH',{stock:-1},headers)).status,400);
  assert.equal((await request('/api/admin/products/'+id,'PATCH',{image:'javascript:alert(1)'},headers)).status,400);
  assert.equal((await request('/api/admin/products/'+id,'DELETE',undefined,{Cookie:headers.Cookie})).status,401);
  assert.equal((await request('/api/admin/products/'+id,'DELETE',undefined,headers)).status,200);
  assert.equal((await request('/api/products/'+id)).status,404);
  assert.equal((await request('/api/admin/logout','POST',{},headers)).status,200);
  assert.equal((await request('/api/admin/orders','GET',undefined,headers)).status,401);
});
test('Storefront admin login creates a protected session and reserves the admin name',async t=>{
  const {request}=await fixture(t);
  const invalid=await request('/api/auth/login','POST',{username:'admin',password:'wrong'});
  assert.equal(invalid.status,401);assert.equal(invalid.cookie,null);
  const login=await request('/api/auth/login','POST',{username:'admin',password:'private-admin-password'});
  assert.equal(login.status,200);assert.equal(login.body.role,'admin');assert.equal(login.body.redirect,'/admin');
  assert.equal(login.body.token,undefined);assert.match(login.cookie,/HttpOnly/);
  const headers={Cookie:login.cookie.split(';')[0],'X-Requested-With':'shop-admin'};
  assert.equal((await request('/api/admin/session','GET',undefined,headers)).status,200);
  assert.equal((await request('/api/admin/logout','POST',{},headers)).status,200);
  assert.equal((await request('/api/admin/session','GET',undefined,headers)).status,401);
  assert.equal((await request('/api/auth/register','POST',{name:'Fake admin',username:'Admin',password:'password123'})).status,409);
  assert.equal((await request('/api/auth/register','POST',{name:'Customer',username:'customer',password:'password123'})).status,201);
  const customer=await request('/api/auth/login','POST',{username:'customer',password:'password123'});
  assert.equal(customer.status,200);assert.ok(customer.body.token);assert.equal(customer.cookie,null);
});
test('Configured admin token replaces defaults',async t=>{
  const old=process.env.ADMIN_TOKEN; process.env.ADMIN_TOKEN='from-environment';
  t.after(()=>{if(old===undefined)delete process.env.ADMIN_TOKEN;else process.env.ADMIN_TOKEN=old;});
  const {request}=await fixture(t,{adminToken:undefined});
  assert.equal((await request('/api/admin/orders','GET',undefined,{'x-admin-token':'admin123'})).status,401);
  assert.equal((await request('/api/admin/orders','GET',undefined,{'x-admin-token':'from-environment'})).status,200);
});
test('Voucher CRUD, public availability and server quote',async t=>{
  const {request}=await fixture(t);const h={'x-admin-token':'private-admin-password'};
  const v=await request('/api/admin/vouchers','POST',{code:'new20',type:'percent',value:20,usageLimit:1},h);assert.equal(v.status,201);assert.equal(v.body.code,'NEW20');
  assert.equal((await request('/api/admin/vouchers','POST',{code:'NEW20',type:'fixed',value:10},h)).status,409);
  const q=await request('/api/checkout/quote','POST',payload({voucherCode:'new20'}));assert.equal(q.status,200);assert.equal(q.body.discount,29800);assert.equal(q.body.total,149200);
  const buyer=await request('/api/auth/register','POST',{name:'Buyer',username:'voucher-buyer',password:'password123'});
  const o=await request('/api/orders','POST',payload({voucherCode:'new20',total:1,shippingFee:0}),{Authorization:'Bearer '+buyer.body.token});assert.equal(o.body.total,q.body.total);
  assert.equal((await request('/api/checkout/quote','POST',payload({voucherCode:'NEW20'}))).status,400);
  await request('/api/admin/orders/'+o.body.id,'PATCH',{status:'cancelled'},h);
  assert.equal((await request('/api/admin/vouchers')).status,401);
  assert.equal((await request('/api/admin/vouchers','GET',undefined,h)).body[0].used,0);
  await request('/api/admin/vouchers/'+v.body.id,'PATCH',{active:false},h);
  assert.equal((await request('/api/vouchers')).body.length,0);
  assert.equal((await request('/api/admin/vouchers/'+v.body.id,'DELETE',undefined,h)).status,200);
});
test('Two sizes of same product persist; aggregate stock cannot be exceeded',()=>{
  const db=openDb(':memory:');
  const o=c.createOrder(db,payload({items:[{productId:1,quantity:2,size:'S',color:'Đen'},{productId:1,quantity:3,size:'M',color:'Trắng'}]}));
  assert.deepEqual(o.items.map(i=>i.size),['S','M']);assert.equal(db.data.products[0].stock,45);
  assert.throws(()=>c.createOrder(db,payload({items:[{productId:1,quantity:30,size:'S'},{productId:1,quantity:30,size:'M'}]})),e=>e.status===409);
  assert.equal(db.data.products[0].stock,45);
  assert.throws(()=>c.createOrder(db,payload({items:[{productId:1,quantity:1,size:'BAD'}]})),e=>e.status===400);
});
test('Cancel restores inventory once and terminal orders cannot reopen',()=>{
  const db=openDb(':memory:');voucher(db);const o=c.createOrder(db,payload({voucherCode:'SALE10'}));
  assert.equal(db.data.vouchers[0].used,1);
  c.updateOrderStatus(db,o.id,'cancelled');c.updateOrderStatus(db,o.id,'cancelled');
  assert.equal(db.data.products[0].stock,50);assert.equal(db.data.vouchers[0].used,0);
  assert.throws(()=>c.updateOrderStatus(db,o.id,'done'),e=>e.status===409);
  const other=c.createOrder(db,payload());assert.throws(()=>c.updateOrderStatus(db,other.id,'shipping'),e=>e.status===409);
  for(const status of ['confirmed','shipping','done'])c.updateOrderStatus(db,other.id,status);
  assert.throws(()=>c.updateOrderStatus(db,other.id,'cancelled'),e=>e.status===409);
});
test('Discount limits, expiration, future start, free shipping and invalid values',()=>{
  const db=openDb(':memory:');const v=voucher(db,{maxDiscount:5000,minOrder:100000});
  assert.equal(c.quoteOrder(db,payload({voucherCode:v.code})).discount,5000);
  c.saveVoucher(db,v.id,{minOrder:200000});assert.throws(()=>c.quoteOrder(db,payload({voucherCode:v.code})),e=>e.status===400);
  c.saveVoucher(db,v.id,{minOrder:0,expiresAt:'2000-01-01'});assert.throws(()=>c.quoteOrder(db,payload({voucherCode:v.code})),e=>e.status===400);
  c.saveVoucher(db,v.id,{expiresAt:null,startsAt:'2099-01-01'});assert.throws(()=>c.quoteOrder(db,payload({voucherCode:v.code})),e=>e.status===400);
  c.saveVoucher(db,v.id,{startsAt:null,type:'shipping'});assert.equal(c.quoteOrder(db,payload({voucherCode:v.code})).total,149000);
  c.saveVoucher(db,v.id,{type:'fixed',value:200000,maxDiscount:0});assert.equal(c.quoteOrder(db,payload({voucherCode:v.code})).total,30000);
  assert.throws(()=>c.saveVoucher(db,v.id,{type:'percent',value:101}),e=>e.status===400);
  for(const extra of [{paymentMethod:'momo'},{customer:{...customer,email:'bad'}},{items:[null]},{items:[{productId:1,quantity:'1'}]}])assert.throws(()=>c.createOrder(db,payload(extra)),e=>e.status===400);
});
test('Every commerce write rolls memory back on disk failure',()=>{
  const db=openDb(':memory:');voucher(db);const o=c.createOrder(db,payload({voucherCode:'SALE10'}));const before=structuredClone(db.data);
  db.save=()=>{throw new Error('disk full');};
  for(const run of [()=>c.createOrder(db,payload()),()=>c.updateOrderStatus(db,o.id,'cancelled'),()=>c.deleteProduct(db,1),()=>c.saveProduct(db,1,{stock:10}),()=>c.deleteVoucher(db,1),()=>c.saveVoucher(db,1,{active:false})]){
    assert.throws(run,/disk full/);assert.deepEqual(db.data,before);
  }
});
test('Changed price requires confirmation and does not debit stock',()=>{
  const db=openDb(':memory:');const q=c.quoteOrder(db,payload());
  c.saveProduct(db,1,{price:200000});
  assert.throws(()=>c.createOrder(db,payload({expectedTotal:q.total})),e=>e.status===409);
  assert.equal(db.data.products[0].stock,50);assert.equal(db.data.orders.length,0);
});
test('Orders belong to authenticated user, never to an arbitrary payload user id',async t=>{
  const {request,db}=await fixture(t);
  const a=await request('/api/auth/register','POST',{name:'A',username:'userA',password:'password123'});
  const b=await request('/api/auth/register','POST',{name:'B',username:'userB',password:'password123'});
  const ah={Authorization:'Bearer '+a.body.token};const bh={Authorization:'Bearer '+b.body.token};
  const o=await request('/api/orders','POST',payload({user_id:b.body.user.id}),ah);assert.equal(o.status,201);
  assert.equal((await request('/api/orders/mine','GET',undefined,ah)).body.length,1);
  assert.equal((await request('/api/orders/mine','GET',undefined,bh)).body.length,0);
  assert.equal((await request('/api/orders/mine')).status,401);
  assert.equal((await request('/api/orders','POST',payload(),{Authorization:'Bearer invalid'})).status,401);
  const before=JSON.stringify(db.data);
  assert.equal((await request('/api/orders','POST',payload())).status,401);
  assert.equal(JSON.stringify(db.data),before);
});
test('Products, vouchers and order snapshots survive restart and deletion',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shop-commerce-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'shop.json');let db=openDb(file);const v=voucher(db);const o=c.createOrder(db,payload({voucherCode:v.code}));
  c.saveProduct(db,1,{name:'Đã sửa',price:1});c.deleteProduct(db,1);c.deleteVoucher(db,v.id);
  db=openDb(file);assert.equal(getOrder(db,o.id).items[0].price,149000);assert.equal(getOrder(db,o.id).voucherCode,'SALE10');
  c.updateOrderStatus(db,o.id,'cancelled');assert.equal(db.data.products.some(p=>p.id===1),false);
});
