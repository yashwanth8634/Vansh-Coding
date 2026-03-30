require('dotenv').config();
const { caches } = require('./utils/cache');

async function testCache() {
  console.log('--- STARTING CACHE TEST ---');

  // 1. Set values in different namespaces
  console.log('Setting test keys...');
  await caches.test.set('key1', 'test-value-1');
  await caches.pages.set('key2', 'pages-value-2');

  // 2. Verify settings
  const v1 = await caches.test.get('key1');
  const v2 = await caches.pages.get('key2');
  console.log('test:key1 =', v1);
  console.log('pages:key2 =', v2);

  if (v1 !== 'test-value-1' || v2 !== 'pages-value-2') {
    console.error('Basic set/get failed!');
    process.exit(1);
  }

  // 3. Flush only 'pages' namespace
  console.log('Flushing "pages" namespace...');
  await caches.pages.flushAll();

  // 4. Verify isolation
  const v1_after = await caches.test.get('key1');
  const v2_after = await caches.pages.get('key2');
  console.log('test:key1 (after flush) =', v1_after);
  console.log('pages:key2 (after flush) =', v2_after);

  if (v1_after === 'test-value-1' && v2_after === undefined) {
    console.log('SUCCESS: Namespace isolation verified!');
  } else {
    console.error('FAILURE: Namespace isolation broken!');
    process.exit(1);
  }

  // 5. Test keys list
  console.log('Testing keys() list...');
  await caches.test.set('a', 1);
  await caches.test.set('b', 2);
  const keys = await caches.test.keys();
  console.log('test keys =', keys);
  if (keys.length >= 2) {
      console.log('SUCCESS: keys() returned values!');
  } else {
      console.error('FAILURE: keys() returned empty or insufficient values!');
      process.exit(1);
  }

  // 6. Test normalization (null -> undefined)
  console.log('Testing null normalization...');
  const nonexistent = await caches.test.get('this-key-does-not-exist');
  console.log('Non-existent key =', nonexistent);
  if (nonexistent === undefined) {
      console.log('SUCCESS: Normalization verified (undefined)!');
  } else {
      console.error('FAILURE: Normalization failed (returned null or other value)!');
      process.exit(1);
  }

  console.log('--- ALL CACHE TESTS PASSED ---');
  process.exit(0);
}

testCache().catch(err => {
  console.error('Unexpected error during test:', err);
  process.exit(1);
});
