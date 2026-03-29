
const mongoose = require('mongoose');
require('dotenv').config();
const { caches, invalidateQuestionData } = require('./utils/cache');

async function runTest() {
  console.log('--- STARTING CACHE INTEGRATION TEST ---');
  
  try {
    // 1. Test SET
    console.log('Testing SET (test namespace)...');
    const testData = { id: 123, name: 'Sample Quiz' };
    await caches.test.set('sample-key', testData, 60);
    console.log('SET successful.');

    // 2. Test GET
    console.log('Testing GET (test namespace)...');
    const retrievedData = await caches.test.get('sample-key');
    if (retrievedData && retrievedData.id === 123) {
      console.log('GET successful: ', retrievedData);
    } else {
      throw new Error(`GET failed. Expected {id: 123}, got ${JSON.stringify(retrievedData)}`);
    }

    // 3. Test DEL
    console.log('Testing DEL (test namespace)...');
    await caches.test.del('sample-key');
    const afterDel = await caches.test.get('sample-key');
    if (!afterDel) {
      console.log('DEL successful.');
    } else {
      throw new Error('DEL failed. Key still exists.');
    }

    // 4. Test Invalidation Helper (invalidateQuestionData)
    console.log('Testing invalidateQuestionData helper...');
    await caches.banks.set('bank-key', { data: 'bank' });
    await caches.pages.set('page-key', { data: 'page' });
    
    await invalidateQuestionData();
    
    const bankAfter = await caches.banks.get('bank-key');
    const pageAfter = await caches.pages.get('page-key');
    
    if (!bankAfter && !pageAfter) {
      console.log('invalidateQuestionData successful (all cleared).');
    } else {
      throw new Error('invalidateQuestionData failed. Some keys still exist.');
    }

    console.log('--- CACHE INTEGRATION TEST PASSED ---');
  } catch (error) {
    console.error('--- CACHE INTEGRATION TEST FAILED ---');
    console.error(error.message);
    process.exit(1);
  }
}

runTest();
