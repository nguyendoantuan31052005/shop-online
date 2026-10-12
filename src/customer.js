'use strict';
const {HttpError,hashPassword,verifyPassword}=require('./db');
const commerce=require('./commerce');
function transaction(db,work){const before=structuredClone(db.data);try{const result=work();db.save();return structuredClone(result);}catch(error){db.data=before;throw error;}}
function text(value,max,required=false){if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))throw new HttpError(400,'Thông tin không hợp lệ');return value.trim();}
function userRecord(db,id){const user=db.data.users.find(u=>u.id===id);if(!user)throw new HttpError(404,'Không tìm thấy tài khoản');return user;}
function safeUser(user){return {id:user.id,name:user.name,username:user.username,email:user.email||'',phone:user.phone||'',address:user.address||'',createdAt:user.created_at};}
function account(db,id,route,body){
 const user=userRecord(db,id);
 if(route==='/api/auth/me'){
  const allowed=['name','email','phone','address'];if(!Object.keys(body).length||Object.keys(body).some(k=>!allowed.includes(k)))throw new HttpError(400,'Trường thông tin không hợp lệ');
  const values={};for(const key of Object.keys(body))values[key]=text(body[key],key==='address'?1000:key==='name'?200:254,key==='name');
  if(values.email){values.email=values.email.toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))throw new HttpError(400,'Email không hợp lệ');if(db.data.users.some(u=>u.id!==id&&(u.email?.toLowerCase()===values.email||u.username.toLowerCase()===values.email)))throw new HttpError(409,'Email đã được sử dụng');}
  if(values.phone&&!/^0\d{9,10}$/.test(values.phone))throw new HttpError(400,'Số điện thoại không hợp lệ');
  return transaction(db,()=>{Object.assign(user,values);return {user:safeUser(user)};});
 }
 if(route==='/api/auth/password'){
  if(typeof body.currentPassword!=='string'||!verifyPassword(body.currentPassword,user.password))throw new HttpError(401,'Mật khẩu hiện tại không đúng');
  if(typeof body.newPassword!=='string'||body.newPassword.length<8||body.newPassword.length>256)throw new HttpError(400,'Mật khẩu mới cần từ 8 đến 256 ký tự');
  return transaction(db,()=>{user.password=hashPassword(body.newPassword);user.tokenVersion=(user.tokenVersion||0)+1;return {changed:true,requiresLogin:true};});
 }
 return transaction(db,()=>{user.tokenVersion=(user.tokenVersion||0)+1;return {loggedOut:true};});
}
function cartView(db,user){const items=(user.cart||[]).map(line=>{const p=db.data.products.find(p=>p.id===line.productId);return {...line,product:p||null,available:!!p&&p.stock>=line.quantity&&p.sizes.includes(line.size)&&p.colors.includes(line.color)};});return {items,subtotal:items.reduce((sum,line)=>sum+(line.product?.price||0)*line.quantity,0)};}
function handle(db,id,route,method,body){
 const user=userRecord(db,id);
 if(route==='/api/cart'){
  if(method==='GET')return cartView(db,user);
  if(method==='DELETE')return transaction(db,()=>{user.cart=[];return cartView(db,user);});
  if(method!=='PUT')throw new HttpError(405,'Thao tác không được hỗ trợ');
  if(!Array.isArray(body.items)||body.items.length>100)throw new HttpError(400,'Giỏ hàng không hợp lệ');
  const quote=body.items.length?commerce.quoteOrder(db,{items:body.items}):{items:[]};
  return transaction(db,()=>{user.cart=quote.items.map(i=>({productId:i.product_id,quantity:i.quantity,size:i.size,color:i.color}));return cartView(db,user);});
 }
 if(route==='/api/wishlist'){
  if(method==='GET')return {products:(user.wishlist||[]).map(id=>db.data.products.find(p=>p.id===id)).filter(Boolean)};
  if(method!=='PUT')throw new HttpError(405,'Thao tác không được hỗ trợ');
  if(!Array.isArray(body.productIds)||body.productIds.length>200||body.productIds.some(id=>!Number.isSafeInteger(id)||!db.data.products.some(p=>p.id===id)))throw new HttpError(400,'Danh sách yêu thích không hợp lệ');
  return transaction(db,()=>{user.wishlist=[...new Set(body.productIds)];return {productIds:user.wishlist};});
 }
 const match=route.match(/^\/api\/orders\/(\d+)\/cancel$/);
 if(match&&method==='POST'){
  const order=db.data.orders.find(o=>o.id===Number(match[1])&&o.user_id===id);if(!order)throw new HttpError(404,'Không tìm thấy đơn hàng');
  if(!['new','cancelled'].includes(order.status))throw new HttpError(409,'Chỉ có thể hủy đơn chưa được xác nhận');
  return commerce.updateOrderStatus(db,order.id,'cancelled');
 }
 throw new HttpError(405,'Thao tác không được hỗ trợ');
}
function stats(db){const statuses={};for(const order of db.data.orders)statuses[order.status]=(statuses[order.status]||0)+1;return {users:db.data.users.length,lockedUsers:db.data.users.filter(u=>u.disabled).length,products:db.data.products.length,lowStock:db.data.products.filter(p=>p.stock<5).length,orders:db.data.orders.length,ordersByStatus:statuses,revenue:db.data.orders.filter(o=>o.status==='done').reduce((sum,o)=>sum+o.total,0)};}
module.exports={account,handle,stats};
