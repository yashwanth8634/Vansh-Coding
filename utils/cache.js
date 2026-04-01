// utils/cache.js
// Centralized cache module — hybrid L1 (local) + L2 (Redis) architecture
const NodeCache = require('node-cache');
const { Redis } = require('@upstash/redis');

// Detect if we have Upstash Redis credentials
const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
const REDIS_TIMEOUT_MS = Number.parseInt(process.env.REDIS_TIMEOUT_MS, 10) || 250;

const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Redis timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
};

const localOnlyOnServerless = !!process.env.VERCEL && process.env.REDIS_MODE === 'local-only';
if (isRedisConfigured) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log(localOnlyOnServerless
      ? 'Redis configured but disabled in Vercel (REDIS_MODE=local-only)'
      : 'Redis Cache initialized (Upstash) - using hybrid L1/L2 caching');
  } catch (error) {
    console.error('Redis Initial Connection Error:', error.message);
    redis = null;
  }
} else {
  console.log('Using Local Memory Cache only (no Redis configured)');
}

// L1 Local cache instances (fast, in-memory, per-process)
// These have shorter TTLs and serve as a buffer to reduce Redis HTTP calls
const localCaches = {
  test: new NodeCache({ stdTTL: 60, checkperiod: 30 }),       // 1 min local, reduces Redis hits
  codingTest: new NodeCache({ stdTTL: 60, checkperiod: 30 }),
  user: new NodeCache({ stdTTL: 60, checkperiod: 30 }),       // 1 min local for user data
  banks: new NodeCache({ stdTTL: 120, checkperiod: 60 }),     // 2 min local
  pages: new NodeCache({ stdTTL: 30, checkperiod: 15 }),      // 30 sec local for pages
};

// Redis TTLs (longer, shared across instances)
const redisTTLs = {
  test: 3600,       // 1 hour
  codingTest: 3600,
  user: 300,        // 5 min
  banks: 600,       // 10 min
  pages: 120,       // 2 min
};

// Hybrid Cache Wrapper (L1 Local + L2 Redis)
const createCacheInterface = (namespace) => ({
  get: async (key) => {
    const fullKey = `${namespace}:${key}`;
    
    // L1: Check local cache first (synchronous, fast)
    const localVal = localCaches[namespace].get(key);
    if (localVal !== undefined) {
      return localVal;
    }
    
    // L2: Check Redis if configured
    if (redis && !localOnlyOnServerless) {
      try {
        const val = await withTimeout(redis.get(fullKey), REDIS_TIMEOUT_MS);
        if (val !== null && val !== undefined) {
          // Populate L1 cache for future hits
          localCaches[namespace].set(key, val);
          return val;
        }
      } catch (err) {
        console.error(`Redis get failed [${fullKey}]:`, err.message);
      }
    }
    
    return undefined;
  },
  
  set: async (key, value, ttl) => {
    const fullKey = `${namespace}:${key}`;
    const redisTTL = ttl || redisTTLs[namespace];
    
    // L1: Always set local cache (synchronous)
    localCaches[namespace].set(key, value);
    
    // L2: Set Redis asynchronously (don't await unless necessary)
    if (redis && !localOnlyOnServerless) {
      // Fire and forget for better performance, but catch errors
      withTimeout(redis.set(fullKey, value, { ex: redisTTL }), REDIS_TIMEOUT_MS).catch(err => {
        console.error(`Redis set failed [${fullKey}]:`, err.message);
      });
    }
    
    return true;
  },
  
  del: async (key) => {
    const fullKey = `${namespace}:${key}`;
    
    // L1: Delete from local cache immediately
    localCaches[namespace].del(key);
    
    // L2: Delete from Redis
    if (redis && !localOnlyOnServerless) {
      try {
        await withTimeout(redis.del(fullKey), REDIS_TIMEOUT_MS);
      } catch (err) {
        console.error(`Redis del failed [${fullKey}]:`, err.message);
      }
    }
    
    return true;
  },
  
  flushAll: async () => {
    // L1: Flush local cache immediately (synchronous, fast)
    localCaches[namespace].flushAll();
    
    // L2: Flush Redis namespace (async, but don't block on it for perf)
    if (redis && !localOnlyOnServerless) {
      // Fire and forget - the local cache is already cleared
      (async () => {
        try {
          let cursor = 0;
          do {
            const [nextCursor, keys] = await withTimeout(redis.scan(cursor, {
              match: `${namespace}:*`,
              count: 100,
            }), REDIS_TIMEOUT_MS);
            cursor = Number(nextCursor);
            if (keys && keys.length) {
              await withTimeout(redis.del(...keys), REDIS_TIMEOUT_MS);
            }
          } while (cursor !== 0);
        } catch (err) {
          console.error(`Redis flushAll failed [${namespace}]:`, err.message);
        }
      })();
    }
    
    return true;
  },
  
  keys: async () => {
    // For keys listing, check Redis (more authoritative) or fall back to local
    if (redis && !localOnlyOnServerless) {
      try {
        const keys = [];
        let cursor = 0;
        do {
          const [nextCursor, batch] = await withTimeout(redis.scan(cursor, {
            match: `${namespace}:*`,
            count: 100,
          }), REDIS_TIMEOUT_MS);
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
  test: createCacheInterface('test'),
  codingTest: createCacheInterface('codingTest'),
  user: createCacheInterface('user'),
  banks: createCacheInterface('banks'),
  pages: createCacheInterface('pages'),
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
