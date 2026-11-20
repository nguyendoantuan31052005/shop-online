/* global SwaggerUIBundle */
if (typeof SwaggerUIBundle !== 'undefined') {
  window.ui = SwaggerUIBundle({
    url: '/api/openapi.json',
    dom_id: '#swagger-ui',
    deepLinking: true,
    filter: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 0,
    persistAuthorization: false,
    validatorUrl: null,
    onComplete() {
      const spec = window.ui.specSelectors.specJson().toJS();
      document.getElementById('apiOperationCount').textContent = Object.values(spec.paths).reduce((sum, value) => sum + Object.keys(value).length, 0);
    },
    requestInterceptor(request) {
      const target = new URL(request.url, window.location.origin);
      if (target.origin === window.location.origin && target.pathname.startsWith('/api/admin/')) {
        request.headers['X-Requested-With'] = 'shop-admin';
      }
      return request;
    },
    responseInterceptor(response) {
      const target = new URL(response.url, window.location.origin);
      if (target.origin !== window.location.origin || !response.ok) return response;
      const body = response.obj || response.data;
      let payload = body;
      if (typeof body === 'string') {
        try { payload = JSON.parse(body); } catch { return response; }
      }
      if (['/api/auth/login', '/api/auth/register'].includes(target.pathname) && payload?.token) {
        window.ui.preauthorizeApiKey('CustomerBearer', payload.token);
      }
      if (['/api/auth/logout', '/api/auth/password'].includes(target.pathname)) {
        window.ui.authActions.logout(['CustomerBearer']);
      }
      if (target.pathname === '/api/admin/logout') {
        window.ui.authActions.logout(['AdminToken', 'AdminCookie']);
      }
      return response;
    },
  });
}
