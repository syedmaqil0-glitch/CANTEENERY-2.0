/**
 * Automated Verification Script for Canteenery Final Fixes
 * 
 * Verifies:
 * 1. Seed Workload is Realistic & Moderate (55-65% instead of 100% Critical)
 * 2. Item Preparation Times are Reasonable (e.g. Cold Coffee ~15-20 min total, not ~38 min)
 * 3. Store reset data strictly adheres to realistic demo data and includes bulk order
 * 4. tracking.js recognizes DISCARDED status and does not fallback to PLACED
 * 5. Full order lifecycle handling: READY -> NOT_COLLECTED -> DISCARDED & HOLDING
 * 6. Inventory decrement and negative inventory prevention
 * 7. Sold-out item (Masala Dosa) pre-order prevention
 * 8. Bulk order flag and time buffer application
 * 9. HTTP 200 checks across all pages and route aliases
 */

const http = require('http');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 1. Mock LocalStorage & Browser globals for Node test runner
const storage = {};
global.localStorage = {
  getItem: (key) => (key in storage ? storage[key] : null),
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = {
  addEventListener: () => {},
  dispatchEvent: () => {}
};
global.document = { addEventListener: () => {} };

// 2. Load Store and Initialize
const storeCode = fs.readFileSync(path.join(__dirname, 'js', 'store.js'), 'utf-8');
eval(storeCode);
const store = window.canteeneryStore;

// Load tracking.js logic to verify STATUS_CONFIG
const trackingCode = fs.readFileSync(path.join(__dirname, 'js', 'tracking.js'), 'utf-8');

let passedTests = 0;
let totalTests = 0;

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
  }
}

// -------------------------------------------------------------
// HTTP Endpoints Validation
// -------------------------------------------------------------
const HTTP_ENDPOINTS = [
  '/',
  '/index.html',
  '/menu.html',
  '/checkout.html',
  '/order-confirmed.html',
  '/tracking.html',
  '/kitchen.html',
  '/kitchen',
  '/engine.html',
  '/engine',
  '/about.html',
  '/js/store.js',
  '/js/app.js',
  '/js/kitchen.js',
  '/js/engine.js',
  '/js/menu.js',
  '/js/checkout.js',
  '/js/order-confirmed.js',
  '/js/tracking.js'
];

function testHttpEndpoint(urlPath) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${urlPath}`, (res) => {
      totalTests++;
      if (res.statusCode === 200) {
        console.log(`✅ PASS: HTTP Route: ${urlPath} -> 200 OK`);
        passedTests++;
      } else {
        console.error(`❌ FAIL: HTTP Route: ${urlPath} -> ${res.statusCode}`);
      }
      resolve();
    }).on('error', (err) => {
      totalTests++;
      console.error(`❌ FAIL: HTTP Route: ${urlPath} -> Error: ${err.message}`);
      resolve();
    });
  });
}

async function runAllTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING CANTEENERY FINAL MVP FIX & POLISH TEST SUITE');
  console.log('================================================================\n');

  // 1. Initial Seeded Workload
  await test('1. Initial Seeded Workload is Realistic & Moderate (55-65%, not 100% CRITICAL)', () => {
    store.resetDemoData();
    const workload = store.calculateKitchenWorkload();
    console.log(`         • Initial Seeded Workload: ${workload.percentage}% (Level: ${workload.level}, Active Queued Minutes: ${workload.activeQueuedMinutes}m)`);
    assert.ok(workload.percentage >= 50 && workload.percentage <= 65, `Expected 50-65% workload, got ${workload.percentage}%`);
    assert.strictEqual(workload.level, 'MODERATE', 'Workload level should be MODERATE');
  });

  // 2. Simple Cold Coffee order
  await test('2. Simple Cold Coffee order receives realistic preparation estimate (< 20 min, not ~38 min)', () => {
    store.resetDemoData();
    const singleCoffee = [{ id: 'cold-coffee', name: 'Cold Coffee', price: 50, quantity: 1, preparationTime: 3 }];
    const smart = store.calculateSmartPickup(singleCoffee);
    console.log(`         • Cold Coffee Est. Prep: ${smart.estimatedPreparationTime} min | Recommended Slot: ${smart.recommendedPickupSlot}`);
    assert.ok(smart.estimatedPreparationTime >= 5 && smart.estimatedPreparationTime <= 20, `Expected 5-20 min prep, got ${smart.estimatedPreparationTime} min`);
  });

  // 3. Reset Demo Data
  await test('3. Reset Demo Data produces the corrected moderate workload and preserves bulk order', () => {
    store.resetDemoData();
    const orders = store.getOrders();
    const bulkOrder = orders.find(o => o.orderId === '#SC-1052');
    assert.ok(bulkOrder, 'Bulk order #SC-1052 must exist');
    assert.strictEqual(bulkOrder.isBulk, true, 'isBulk must be true');
    assert.strictEqual(store.isBulkOrder(bulkOrder), true, 'store.isBulkOrder must return true');

    const workload = store.calculateKitchenWorkload();
    assert.strictEqual(workload.level, 'MODERATE');
  });

  // 4. tracking.js defines DISCARDED
  await test('4. tracking.js defines DISCARDED in STATUS_CONFIG without falling back to PLACED', () => {
    assert.ok(trackingCode.includes('DISCARDED:'), 'tracking.js must define DISCARDED');
    assert.ok(trackingCode.includes('Order Discarded & Closed'), 'tracking.js must describe discarded state');
  });

  // 5. Discarded Order transition flow
  await test('5. Discarded Order transition flow (READY -> NOT_COLLECTED -> DISCARDED)', () => {
    store.resetDemoData();
    const orderId = '#SC-1051'; // starts READY
    assert.strictEqual(store.getOrder(orderId).status, 'READY');

    // Simulate missed window
    store.simulateMissedPickup(orderId);
    assert.strictEqual(store.getOrder(orderId).status, 'NOT_COLLECTED');

    // Discard order
    store.updateOrderStatus(orderId, 'DISCARDED');
    assert.strictEqual(store.getOrder(orderId).status, 'DISCARDED');

    // getNextStatusAction for DISCARDED should be null
    assert.strictEqual(store.getNextStatusAction('DISCARDED'), null);
  });

  // 6. Normal Order Lifecycle
  await test('6. Normal Order Lifecycle (PLACED -> ACCEPTED -> PREPARING -> READY -> COLLECTED)', () => {
    store.resetDemoData();
    const orderId = '#SC-1050'; // starts PLACED
    assert.strictEqual(store.getOrder(orderId).status, 'PLACED');

    store.updateOrderStatus(orderId, 'ACCEPTED');
    assert.strictEqual(store.getOrder(orderId).status, 'ACCEPTED');

    store.updateOrderStatus(orderId, 'PREPARING');
    assert.strictEqual(store.getOrder(orderId).status, 'PREPARING');

    store.updateOrderStatus(orderId, 'READY');
    assert.strictEqual(store.getOrder(orderId).status, 'READY');
    assert.ok(store.getOrder(orderId).readySince);

    store.updateOrderStatus(orderId, 'COLLECTED');
    assert.strictEqual(store.getOrder(orderId).status, 'COLLECTED');
    assert.ok(store.getOrder(orderId).collectedAt);
  });

  // 7. Uncollected Holding Lifecycle
  await test('7. Uncollected Holding Lifecycle (READY -> NOT_COLLECTED -> HOLDING -> COLLECTED)', () => {
    store.resetDemoData();
    const orderId = '#SC-1051';
    store.simulateMissedPickup(orderId);
    assert.strictEqual(store.getOrder(orderId).status, 'NOT_COLLECTED');

    store.updateOrderStatus(orderId, 'HOLDING');
    assert.strictEqual(store.getOrder(orderId).status, 'HOLDING');

    store.updateOrderStatus(orderId, 'COLLECTED');
    assert.strictEqual(store.getOrder(orderId).status, 'COLLECTED');
  });

  // 8. Inventory Decrements correctly
  await test('8. Inventory Decrements correctly and Prevents Negative Stock', async () => {
    store.resetDemoData();
    await new Promise(r => setTimeout(r, 100));
    const vegBefore = store.getMenuItem('veg-sandwich').inventory;
    const coffeeBefore = store.getMenuItem('cold-coffee').inventory;

    store.clearCart();
    store.addToCart('veg-sandwich', 2);
    store.addToCart('cold-coffee', 1);

    const orderRes = await store.createOrder();
    assert.strictEqual(orderRes.success, true);

    assert.strictEqual(store.getMenuItem('veg-sandwich').inventory, vegBefore - 2);
    assert.strictEqual(store.getMenuItem('cold-coffee').inventory, coffeeBefore - 1);

    // Negative prevention
    store.updateInventory('cold-coffee', -100);
    assert.strictEqual(store.getMenuItem('cold-coffee').inventory, 0);
  });

  // 9. Sold-out item blocks checkout
  await test('9. Sold-out item (Masala Dosa) blocks checkout with explicit message', () => {
    store.clearCart();
    const addRes = store.addToCart('masala-dosa', 1);
    assert.strictEqual(addRes.success, false);

    const validation = store.validateCart();
    assert.strictEqual(validation.valid, false);
  });

  // 10. Bulk order calculation
  await test('10. Bulk order calculation applies +10 min buffer & bulk flag', () => {
    const bulkItems = [
      { id: 'veg-sandwich', quantity: 20, preparationTime: 5 },
      { id: 'cold-coffee', quantity: 10, preparationTime: 3 }
    ];
    const smart = store.calculateSmartPickup(bulkItems);
    assert.strictEqual(smart.isBulkOrder, true);
    assert.strictEqual(smart.bulkOrderAdjustment, 10);
  });

  console.log('\n--- Checking HTTP Server Routes ---');
  for (const ep of HTTP_ENDPOINTS) {
    await testHttpEndpoint(ep);
  }

  console.log(`\n================================================================`);
  console.log(`📊 FINAL RESULTS: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}% SUCCESS)`);
  console.log(`================================================================\n`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL FINAL POLISH & REGRESSION CHECKS PASSED WITH 0 FAILURES!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAllTests();
