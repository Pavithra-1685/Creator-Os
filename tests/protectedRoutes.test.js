const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer, fetchJson, createStub } = require('./testUtils');
const dashboardService = require('../src/services/dashboardService');
const contentService = require('../src/services/contentService');
const jwtUtils = require('../src/utils/jwt');

const token = jwtUtils.generateAuthTokens({ userId: 'user-test' }).accessToken;

test('dashboard route returns summary for authenticated user', async () => {
  const restore = createStub(dashboardService, 'getDashboardSummary', async (userId) => {
    assert.equal(userId, 'user-test');
    return { tasks: [], contentItems: [], goals: [], notifications: [] };
  });

  const { server, port } = await startServer();
  const res = await fetchJson(`http://127.0.0.1:${port}/api/v1/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  server.close();
  restore();

  assert.equal(res.status, 200);
  assert.equal(res.body.message, 'Dashboard fetched');
  assert.deepEqual(res.body.data, { tasks: [], contentItems: [], goals: [], notifications: [] });
});

test('content list route returns items for authenticated user', async () => {
  const restore = createStub(contentService, 'listContent', async (userId) => {
    assert.equal(userId, 'user-test');
    return [{ id: 'item-1', title: 'Test item' }];
  });

  const { server, port } = await startServer();
  const res = await fetchJson(`http://127.0.0.1:${port}/api/v1/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  server.close();
  restore();

  assert.equal(res.status, 200);
  assert.equal(res.body.message, 'Content items fetched');
  assert.deepEqual(res.body.data.items, [{ id: 'item-1', title: 'Test item' }]);
});

test('content create route creates item for authenticated user', async () => {
  const restore = createStub(contentService, 'createContent', async (userId, data) => {
    assert.equal(userId, 'user-test');
    assert.equal(data.title, 'New content');
    return { id: 'item-2', title: data.title, type: data.type };
  });

  const { server, port } = await startServer();
  const res = await fetchJson(`http://127.0.0.1:${port}/api/v1/content`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { title: 'New content', type: 'POST' },
  });
  server.close();
  restore();

  assert.equal(res.status, 200);
  assert.equal(res.body.message, 'Content item created');
  assert.equal(res.body.data.item.id, 'item-2');
});

test('content update route updates item for authenticated user', async () => {
  const restore = createStub(contentService, 'updateContent', async (id, userId, data) => {
    assert.equal(id, 'item-2');
    assert.equal(userId, 'user-test');
    assert.equal(data.title, 'Updated content');
    return { id, title: data.title, type: data.type };
  });

  const { server, port } = await startServer();
  const res = await fetchJson(`http://127.0.0.1:${port}/api/v1/content/item-2`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: { title: 'Updated content', type: 'POST' },
  });
  server.close();
  restore();

  assert.equal(res.status, 200);
  assert.equal(res.body.message, 'Content item updated');
  assert.equal(res.body.data.item.title, 'Updated content');
});

test('protected routes reject unauthenticated requests', async () => {
  const { server, port } = await startServer();
  const res = await fetchJson(`http://127.0.0.1:${port}/api/v1/dashboard`);
  server.close();

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});
