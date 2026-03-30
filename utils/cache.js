// utils/cache.js
// Centralized cache module — all cache instances in one place
const NodeCache = require('node-cache');
const { Redis } = require('@upstash/redis');

// Detect if we have Upstash Redis credentials
const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
if (isRedisConfigured) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('Redis Cache initialized (Upstash)');
  } catch (error) {
    console.error('Redis Initial Connection Error:', error.message);
    redis = null; // Ensure we fall back if init fails
  }
} else {
  console.log('Using Local Memory Cache (NodeCache fallback)');
}

// Local cache instances as fallbacks (or primary if no Redis)
const localCaches = {
  test: new NodeCache({ stdTTL: 3600 }),
  codingTest: new NodeCache({ stdTTL: 3600 }),
  user: new NodeCache({ stdTTL: 300 }),
  banks: new NodeCache({ stdTTL: 600 }),
  pages: new NodeCache({ stdTTL: 120 }),
};

// Unified Cache Wrapper (Namespace based)
const createCacheInterface = (namespace, stdTTL) => ({
  get: async (key) => {
    if (redis) {
      try {
        const val = await redis.get(`${namespace}:${key}`);
        return val ?? undefined; // normalize null → undefined
      } catch (err) {
        console.error(`Redis get failed [${namespace}:${key}]:`, err.message);
      }
    }
    return localCaches[namespace].get(key);
  },
  set: async (key, value, ttl = stdTTL) => {
    if (redis) {
      try {
        return await redis.set(`${namespace}:${key}`, value, { ex: ttl });
      } catch (err) {
        console.error(`Redis set failed [${namespace}:${key}]:`, err.message);
      }
    }
    return localCaches[namespace].set(key, value, ttl);
  },
  del: async (key) => {
    if (redis) {
      try {
        return await redis.del(`${namespace}:${key}`);
      } catch (err) {
        console.error(`Redis del failed [${namespace}:${key}]:`, err.message);
      }
    }
    return localCaches[namespace].del(key);
  },
  flushAll: async () => {
    if (redis) {
      try {
        let cursor = 0;
        do {
          const [nextCursor, keys] = await redis.scan(cursor, {
            match: `${namespace}:*`,
            count: 100,
          });
          cursor = Number(nextCursor);
          if (keys && keys.length) {
            await redis.del(...keys);
          }
        } while (cursor !== 0);
        return;
      } catch (err) {
        console.error(`Redis flushAll failed [${namespace}]:`, err.message);
      }
    }
    return localCaches[namespace].flushAll();
  },
  keys: async () => {
    if (redis) {
      try {
        const keys = [];
        let cursor = 0;
        do {
          const [nextCursor, batch] = await redis.scan(cursor, {
            match: `${namespace}:*`,
            count: 100,
          });
          cursor = Number(nextCursor);
          if (batch && batch.length) {
            keys.push(...batch);
          }
        } while (cursor !== 0);
        return keys;
      } catch (err) {
        console.error(`Redis keys failed [${namespace}]:`, err.message);
      }
    }
    return localCaches[namespace].keys();
  }
});

const caches = {
  test: createCacheInterface('test', 3600),
  codingTest: createCacheInterface('codingTest', 3600),
  user: createCacheInterface('user', 300),
  banks: createCacheInterface('banks', 600),
  pages: createCacheInterface('pages', 120),
};

// --- Targeted Invalidation Helpers ---

const invalidateTest = async (uniqueLink) => {
  await caches.test.del(`test-${uniqueLink}`);
};

const invalidateAllTests = async () => await caches.test.flushAll();

const invalidateCodingTest = async (uniqueLink) => {
  await caches.codingTest.del(`coding-test-${uniqueLink}`);
};

const invalidateAllCodingTests = async () => await caches.codingTest.flushAll();

const invalidateBanks = async () => await caches.banks.flushAll();

const invalidatePages = async () => await caches.pages.flushAll();

const invalidateUser = async (userId) => {
  await caches.user.del(`user-${userId}`);
};

const invalidateQuestionData = async () => {
  await invalidateAllTests();
  await invalidateBanks();
  await invalidatePages();
};

module.exports = {
  caches,
  invalidateTest,
  invalidateAllTests,
  invalidateCodingTest,
  invalidateAllCodingTests,
  invalidateBanks,
  invalidatePages,
  invalidateUser,
  invalidateQuestionData,
};
