const test = require('node:test');
const assert = require('node:assert/strict');
const contentService = require('../src/services/contentService');
const prisma = require('../src/prisma/client');

test('content service lists user content items', async () => {
  const restore = prisma.contentItem.findMany;
  prisma.contentItem.findMany = async (query) => {
    assert.equal(query.where.userId, 'user-abc');
    return [{ id: 'item-1' }];
  };

  const items = await contentService.listContent('user-abc');
  assert.deepEqual(items, [{ id: 'item-1' }]);

  prisma.contentItem.findMany = restore;
});

test('content service creates item with default status and scheduled date', async () => {
  const restore = prisma.contentItem.create;
  prisma.contentItem.create = async (query) => {
    assert.equal(query.data.userId, 'user-abc');
    assert.equal(query.data.title, 'New post');
    assert.equal(query.data.type, 'BLOG');
    assert.equal(query.data.status, 'IDEA');
    assert.equal(query.data.notes, 'Notes here');
    assert.equal(query.data.scheduledFor.toISOString(), new Date('2026-01-01T00:00:00.000Z').toISOString());
    return { id: 'item-2', ...query.data };
  };

  const item = await contentService.createContent('user-abc', {
    title: 'New post',
    type: 'BLOG',
    scheduledFor: '2026-01-01T00:00:00.000Z',
    notes: 'Notes here',
  });
  assert.equal(item.id, 'item-2');

  prisma.contentItem.create = restore;
});

test('content service updates existing item', async () => {
  const restoreFind = prisma.contentItem.findFirst;
  const restoreUpdate = prisma.contentItem.update;

  prisma.contentItem.findFirst = async (query) => {
    assert.equal(query.where.id, 'item-2');
    assert.equal(query.where.userId, 'user-abc');
    return { id: 'item-2', title: 'Old title', type: 'BLOG', status: 'IDEA', scheduledFor: null, notes: null };
  };

  prisma.contentItem.update = async (query) => {
    assert.equal(query.where.id, 'item-2');
    assert.equal(query.data.title, 'Updated title');
    assert.equal(query.data.type, 'BLOG');
    assert.equal(query.data.status, 'PUBLISHED');
    assert.equal(query.data.scheduledFor.toISOString(), new Date('2026-01-02T00:00:00.000Z').toISOString());
    assert.equal(query.data.notes, 'Updated notes');
    return { id: 'item-2', ...query.data };
  };

  const updated = await contentService.updateContent('item-2', 'user-abc', {
    title: 'Updated title',
    type: 'BLOG',
    status: 'PUBLISHED',
    scheduledFor: '2026-01-02T00:00:00.000Z',
    notes: 'Updated notes',
  });

  assert.equal(updated.id, 'item-2');
  assert.equal(updated.title, 'Updated title');

  prisma.contentItem.findFirst = restoreFind;
  prisma.contentItem.update = restoreUpdate;
});

test('content service update throws when item not found', async () => {
  const restore = prisma.contentItem.findFirst;
  prisma.contentItem.findFirst = async () => null;

  await assert.rejects(
    async () => contentService.updateContent('missing', 'user-abc', { title: 'No item' }),
    { status: 404, message: 'Content item not found' },
  );

  prisma.contentItem.findFirst = restore;
});
