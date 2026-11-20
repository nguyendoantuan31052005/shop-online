'use strict';
const {HttpError,hashPassword,verifyPassword}=require('./db');
const commerce=require('./commerce');
const {normalizeVietnamPhone,isVietnamPhone}=require('./phone');
function transaction(db,work){const before=structuredClone(db.data);try{const result=work();db.save();return structuredClone(result);}catch(error){db.data=before;throw error;}}
function text(value,max,required=false){if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))throw new HttpError(400,'Thông tin không hợp lệ');return value.trim();}
function userRecord(db,id){const user=db.data.users.find(u=>u.id===id);if(!user)throw new HttpError(404,'Không tìm thấy tài khoản');return user;}
function safeUser(user){return {id:user.id,name:user.name,username:user.username,email:user.email||'',phone:user.phone||'',address:user.address||'',birthday:user.birthday||'',gender:user.gender||'',bio:user.bio||'',avatarColor:user.avatarColor||'sage',createdAt:user.created_at};}
function overview(db,id){
 const user=userRecord(db,id),orders=db.data.orders.filter(order=>order.user_id===id),completed=orders.filter(order=>order.status==='done');
 return {user:safeUser(user),stats:{orders:orders.length,completed:completed.length,inProgress:orders.filter(order=>['new','confirmed','shipping'].includes(order.status)).length,cancelled:orders.filter(order=>order.status==='cancelled').length,totalSpent:completed.reduce((sum,order)=>sum+order.total,0),addresses:(user.addresses||[]).length,reviews:(db.data.reviews||[]).filter(review=>review.userId===id).length,openSupport:(db.data.support||[]).filter(ticket=>ticket.userId===id&&['open','reviewing'].includes(ticket.status)).length},defaultAddress:(user.addresses||[]).find(address=>address.isDefault)||null};
}
function account(db,id,route,body){
 const user=userRecord(db,id);
 if(route==='/api/auth/me'){
  const allowed=['name','email','phone','address','birthday','gender','bio','avatarColor'];if(!Object.keys(body).length||Object.keys(body).some(k=>!allowed.includes(k)))throw new HttpError(400,'Trường thông tin không hợp lệ');
  const values={};for(const key of Object.keys(body))values[key]=text(body[key],key==='address'?1000:key==='bio'?300:key==='name'?200:254,key==='name');
  if(values.birthday){const date=new Date(values.birthday+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(values.birthday)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==values.birthday||values.birthday<'1900-01-01'||values.birthday>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()))throw new HttpError(400,'Ngày sinh không hợp lệ');}
  if(values.gender!==undefined&&!['','female','male','other','undisclosed'].includes(values.gender))throw new HttpError(400,'Lựa chọn giới tính không hợp lệ');
  if(values.avatarColor!==undefined&&!['sage','teal','sand','rose','slate',''].includes(values.avatarColor))throw new HttpError(400,'Màu ảnh đại diện không hợp lệ');
  if(values.email){values.email=values.email.toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))throw new HttpError(400,'Email không hợp lệ');if(db.data.users.some(u=>u.id!==id&&(u.email?.toLowerCase()===values.email||u.username.toLowerCase()===values.email)))throw new HttpError(409,'Email đã được sử dụng');}
  if(values.phone){values.phone=normalizeVietnamPhone(values.phone);if(!isVietnamPhone(values.phone))throw new HttpError(400,'Số điện thoại không hợp lệ. Nhập số bắt đầu bằng 0 hoặc mã +84 kèm 9–10 chữ số.');if(db.data.users.some(u=>u.id!==id&&u.phone&&normalizeVietnamPhone(u.phone)===values.phone))throw new HttpError(409,'Số điện thoại đã được liên kết với tài khoản khác');}
  return transaction(db,()=>{Object.assign(user,values);return {user:safeUser(user)};});
 }
 if(route==='/api/auth/password'){
  if(typeof body.currentPassword!=='string'||!verifyPassword(body.currentPassword,user.password))throw new HttpError(401,'Mật khẩu hiện tại không đúng');
  if(typeof body.newPassword!=='string'||body.newPassword.length<8||body.newPassword.length>256)throw new HttpError(400,'Mật khẩu mới cần từ 8 đến 256 ký tự');
  return transaction(db,()=>{user.password=hashPassword(body.newPassword);user.tokenVersion=(user.tokenVersion||0)+1;return {changed:true,requiresLogin:true};});
 }
 return transaction(db,()=>{user.tokenVersion=(user.tokenVersion||0)+1;return {loggedOut:true};});
}
function resetPassword(db,id,password){
 const user=userRecord(db,id);
 if(typeof password!=='string'||password.length<12||password.length>256||!password.trim())throw new HttpError(400,'Mật khẩu mới cần từ 12 đến 256 ký tự');
 return transaction(db,()=>{user.password=hashPassword(password);user.tokenVersion=(user.tokenVersion||0)+1;return {changed:true,requiresLogin:true};});
}
function cartView(db,user){const items=(user.cart||[]).map(line=>{const stored=db.data.products.find(p=>p.id===line.productId);const p=stored?{...stored,regularPrice:stored.price,price:stored.salePrice||stored.price}:null;return {...line,product:p,available:!!stored&&stored.stock>=line.quantity&&stored.sizes.includes(line.size)&&stored.colors.includes(line.color)};});return {items,subtotal:items.reduce((sum,line)=>sum+(line.product?.price||0)*line.quantity,0)};}
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
  if(method==='GET')return {products:(user.wishlist||[]).map(id=>db.data.products.find(p=>p.id===id)).filter(Boolean).map(p=>({...p,regularPrice:p.price,price:p.salePrice||p.price}))};
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
module.exports={account,handle,stats,safeUser,overview,resetPassword};
