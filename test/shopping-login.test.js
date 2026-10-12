const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
test('Guest add-to-cart opens login without changing cart; signed-in customer can add',()=>{
 const saved=new Map();const actions=[];
 const nodes=new Map();
 function node(id){if(!nodes.has(id))nodes.set(id,{classList:{remove(){},add(){},toggle(){}},setAttribute(){},style:{},textContent:''});return nodes.get(id);}
 const context=vm.createContext({localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},document:{getElementById:node,querySelector:()=>node('badge')},closeDetail:()=>actions.push('close-detail'),allProducts:[{id:1,name:'Product',stock:5}],cart:[],showToast:()=>{}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/js/auth.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/js/cart.js'),'utf8'),context);
 context.renderCart=()=>actions.push('render');
 assert.equal(context.addToCart(1,{size:'M',color:'Black'}),false);
 assert.equal(context.cart.length,0);assert.equal(saved.has('shop_cart'),false);
 assert.match(node('authStatus').textContent,/đăng nhập/);
 saved.set('shop_token','customer-token');saved.set('shop_user',JSON.stringify({id:1,name:'Buyer'}));
 assert.equal(context.addToCart(1,{size:'M',color:'Black'}),true);
 assert.equal(context.cart.length,1);assert.equal(context.cart[0].qty,1);
});
