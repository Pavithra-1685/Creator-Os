process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test?schema=public';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';

const Module = require('module');
const path = require('path');
const prismaPath = path.resolve(__dirname, '../src/prisma/client.js');
const prismaMock = new Module(prismaPath, module);
prismaMock.filename = prismaPath;
prismaMock.loaded = true;
prismaMock.exports = {
  user: { findUnique: async () => null, create: async () => null, update: async () => null },
  refreshToken: { create: async () => null, deleteMany: async () => null, findFirst: async () => null },
  verificationToken: { create: async () => null, findFirst: async () => null, deleteMany: async () => null },
  contentItem: { findMany: async () => [], create: async () => null, findFirst: async () => null, update: async () => null },
  task: { findMany: async () => [] },
  goal: { findMany: async () => [] },
  notification: { findMany: async () => [] },
};
require.cache[prismaPath] = prismaMock;

const app = require('../src/app');

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (payload) {
    this.body = payload;
    return this;
  };
  return res;
};

const startServer = () =>
  new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        return reject(new Error('Failed to start server'));
      }
      resolve({ server, port: address.port });
    });
  });

const withServer = async (callback) => {
  const { server, port } = await startServer();
  try {
    return await callback(port);
  } finally {
    server.close();
  }
};

const jsonRequest = async ({ port, path, method = 'POST', body, headers = {} }) => {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, json: await response.json() };
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return { status: response.status, body: await response.json() };
};

const createStub = (target, method, fn) => {
  const original = target[method];
  target[method] = fn;
  return () => {
    target[method] = original;
  };
};

module.exports = {
  makeRes,
  startServer,
  withServer,
  jsonRequest,
  fetchJson,
  createStub,
};
