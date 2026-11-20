const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createOpenApi } = require('../src/openapi');
const { postmanCollection, apiMarkdown } = require('../src/api-export');
function checkExample(value, schema, schemas) {
  if (schema.$ref) return checkExample(value, schemas[schema.$ref.split('/').pop()], schemas);
  if (schema.oneOf) return;
  if (schema.allOf) return checkExample(value, schema.allOf[0], schemas);
  if (value === null && schema.nullable) return;
  if (schema.enum) assert.ok(schema.enum.includes(value));
  if (schema.type === 'object') {
    assert.ok(value && typeof value === 'object' && !Array.isArray(value));
    for (const key of schema.required || []) assert.ok(Object.hasOwn(value, key), 'Missing ' + key);
    for (const [key, property] of Object.entries(schema.properties || {})) if (Object.hasOwn(value, key)) checkExample(value[key], property, schemas);
  } else if (schema.type === 'array') {
    assert.ok(Array.isArray(value));
    if (schema.minItems !== undefined) assert.ok(value.length >= schema.minItems);
    if (schema.maxItems !== undefined) assert.ok(value.length <= schema.maxItems);
    for (const item of value) checkExample(item, schema.items, schemas);
  } else if (schema.type === 'integer') assert.ok(Number.isInteger(value));
  else if (schema.type) assert.equal(typeof value, schema.type);
  if (typeof value === 'number') { if (schema.minimum !== undefined) assert.ok(value >= schema.minimum); if (schema.maximum !== undefined) assert.ok(value <= schema.maximum); }
  if (typeof value === 'string') { if (schema.minLength !== undefined) assert.ok(value.length >= schema.minLength); if (schema.maxLength !== undefined) assert.ok(value.length <= schema.maxLength); }
}
test('Every documented operation has detailed text and schema-compatible examples; Postman covers the same routes', () => {
  const spec = createOpenApi('docs-test'); let count = 0;
  for (const [route, operations] of Object.entries(spec.paths)) for (const [method, operation] of Object.entries(operations)) {
    count++; assert.ok(operation.description.length > 150, method + route);
    const request = operation.requestBody?.content['application/json'];
    if (request) checkExample(request.example, request.schema, spec.components.schemas);
    for (const [code, response] of Object.entries(operation.responses)) {
      const json = response.content['application/json'];
      assert.ok(json.example !== undefined, route + code);
      checkExample(json.example, json.schema, spec.components.schemas);
    }
    if (!operation.security.length && !['/api/auth/login', '/api/admin/login'].includes(route)) assert.equal(operation.responses[401], undefined);
  }
  const collection = postmanCollection(spec);
  assert.equal(collection.item.reduce((sum, group) => sum + group.item.length, 0), count);
  assert.ok(collection.variable.filter(item => /Token/.test(item.key)).every(item => !item.value));
  assert.ok(apiMarkdown(spec).includes('POST /api/checkout/quote'));
  assert.equal(spec.paths['/health'].get.responses[200].content['application/json'].example.status, 'ok');
  assert.notEqual(spec.paths['/api/orders'].post.responses[400].content['application/json'].example.error, spec.paths['/api/orders'].post.responses[500].content['application/json'].example.error);
});
