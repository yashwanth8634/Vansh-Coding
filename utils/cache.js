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
    console.log('Redis Cache Initialized (Upstash)');
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
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
      return await redis.get(`${namespace}:${key}`);
    }
    return localCaches[namespace].get(key);
  },
  set: async (key, value, ttl = stdTTL) => {
    if (redis) {
      // Upstash uses seconds for EX (default for NodeCache is also seconds)
      return await redis.set(`${namespace}:${key}`, value, { ex: ttl });
    }
    return localCaches[namespace].set(key, value, ttl);
  },
  del: async (key) => {
    if (redis) {
      return await redis.del(`${namespace}:${key}`);
    }
    return localCaches[namespace].del(key);
  },
  flushAll: async () => {
    if (redis) {
      // Caution: flushall clears the entire DB. 
      // For Upstash Free tier, this is usually what you want if using one DB.
      // Alternatively, we could scan and delete by prefix, but flushall is simpler for this use case.
      return await redis.flushall();
    }
    return localCaches[namespace].flushAll();
  },
  // Added helper for warmup route
  keys: async () => {
    if (redis) {
      // Note: Upstash doesn't support glob keys() in the same way, but we can approximate or return []
      return []; 
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

const invalidatePagesCache = async () => await caches.pages.flushAll();

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
  invalidatePagesCache, // Added for codingAdmin usage
};
