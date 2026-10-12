// Storefront: api. Loaded in index.html order; shared state is in state.js.
async function api(path, options = {}) {
  const token=localStorage.getItem('shop_token');
  const res=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(options.headers||{})}});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){const error=new Error(data.error||'Không thể kết nối máy chủ');error.status=res.status;throw error;}
  return data;
}
