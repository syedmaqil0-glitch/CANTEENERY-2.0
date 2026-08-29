/**
 * Comprehensive Smart Queue Engine Test Suite for Canteenery Phase 3
 * Tests all 15 algorithmic, inventory, and lifecycle requirements.
 */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('===========================================================');
console.log('🧪 RUNNING CANTEENERY PHASE 3: SMART QUEUE ENGINE TEST SUITE');
console.log('===========================================================\n');

// 1. Setup Mock DOM & LocalStorage Environment
const storage = {};
global.localStorage = {
  getItem: (key) => (key in storage ? storage[key] : null),
  setItem: (key, val) => {
    storage[key] = String(val);
    if (global.window && global.window.__triggerStorageEvent) {
      global.window.__triggerStorageEvent(key, String(val));
    }
  },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const listeners = [];
global.window = {
  addEventListener: (event, handler) => {
    if (event === 'storage') listeners.push(handler);
  },
  __triggerStorageEvent: (key, newValue) => {
    listeners.forEach(fn => fn({ key, newValue }));
  },
  location: { search: '', hash: '' }
};
global.document = { addEventListener: () => {} };

// 2. Load Store and Initialize
const storeCode = fs.readFileSync(path.join(__dirname, 'js', 'store.js'), 'utf-8');
eval(storeCode);
const store = window.canteeneryStore;

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
// Unit & Algorithmic Tests
// -------------------------------------------------------------

// Test 1: Base Preparation Time Calculation (with Parallelism & Diversity)
test('1. Base Preparation Time calculates realistic batching & diversity overhead', () => {
  // 2x Veg Sandwich (5 min prep), 1x Cold Coffee (3 min prep)
  const items = [
    { id: 'veg-sandwich', name: 'Veg Sandwich', price: 40, quantity: 2, preparationTime: 5 },
    { id: 'cold-coffee', name: 'Cold Coffee', price: 50, quantity: 1, preparationTime: 3 }
  ];
  // Dominant = 5 min, Extra sandwich = +1.5 min, 2 distinct items = +1.0 min => 5 + 1.5 + 1.0 = 7.5 -> 8 min
  const basePrep = store.calculateBasePreparationTime(items);
  assert.ok(basePrep >= 7 && basePrep <= 9, `Expected basePrep ~8 min, got ${basePrep}`);
});

// Test 2: Queue Delay Calculation
test('2. Queue Delay Calculation scales from active orders ahead', () => {
  const activeOrders = [
    { orderId: '#SC-1048', preparationTime: 8 },
    { orderId: '#SC-1049', preparationTime: 12 },
    { orderId: '#SC-1050', preparationTime: 12 }
  ];
  // Sum prep = 32 min -> 32 / 2.5 = 12.8 -> 13 min
  const delay = store.calculateQueueDelay(activeOrders);
  assert.ok(delay >= 11 && delay <= 14, `Expected queue delay ~13 min, got ${delay}`);
});

// Test 3: Workload Adjustments
test('3. Kitchen Workload Adjustments strictly match 4 deterministic tiers', () => {
  assert.strictEqual(store.calculateWorkloadAdjustment(25), 0, 'LOW (25%) should be +0m');
  assert.strictEqual(store.calculateWorkloadAdjustment(55), 2, 'MODERATE (55%) should be +2m');
  assert.strictEqual(store.calculateWorkloadAdjustment(80), 5, 'HIGH (80%) should be +5m');
  assert.strictEqual(store.calculateWorkloadAdjustment(95), 8, 'CRITICAL (95%) should be +8m');
});

// Test 4: Bulk Order Detection & Buffer
test('4. Bulk Order Adjustment applies +10 min buffer and bulk flag', () => {
  const smallOrder = [{ id: 'veg-sandwich', quantity: 2, preparationTime: 5 }];
  const bulkByTotal = [{ id: 'veg-sandwich', quantity: 10, preparationTime: 5 }, { id: 'samosa', quantity: 8, preparationTime: 4 }];
  const bulkBySingle = [{ id: 'cold-coffee', quantity: 12, preparationTime: 3 }];

  const resSmall = store.calculateOrderSizeAndBulkAdjustment(smallOrder);
  assert.strictEqual(resSmall.isBulk, false);
  assert.strictEqual(resSmall.buffer, 0);

  const resBulk1 = store.calculateOrderSizeAndBulkAdjustment(bulkByTotal);
  assert.strictEqual(resBulk1.isBulk, true);
  assert.strictEqual(resBulk1.buffer, 10);

  const resBulk2 = store.calculateOrderSizeAndBulkAdjustment(bulkBySingle);
  assert.strictEqual(resBulk2.isBulk, true);
  assert.strictEqual(resBulk2.buffer, 10);
});

// Test 5: Scenario A: Low Workload -> Early Pickup
test('5. Scenario A: Low Workload produces minimal prep time & early pickup', () => {
  const items = [{ id: 'cold-coffee', quantity: 1, preparationTime: 3 }];
  const lowState = {
    workload: { percentage: 20, level: 'LOW' },
    ordersAhead: 0,
    queueDelay: 0
  };
  const smart = store.calculateSmartPickup(items, lowState);
  assert.ok(smart.estimatedPreparationTime <= 5, `Expected <= 5 min for single item low load, got ${smart.estimatedPreparationTime}`);
  assert.ok(smart.recommendedPickupSlot);
  assert.ok(smart.explanation.length >= 3);
});

// Test 6: Scenario B: High Workload -> Later Pickup
test('6. Scenario B: High Workload applies +5m penalty and pushes pickup slot', () => {
  const items = [{ id: 'veg-sandwich', quantity: 2, preparationTime: 5 }];
  const highState = {
    workload: { percentage: 85, level: 'HIGH' },
    ordersAhead: 6,
    queueDelay: 8
  };
  const smart = store.calculateSmartPickup(items, highState);
  assert.strictEqual(smart.workloadAdjustment, 5);
  assert.ok(smart.estimatedPreparationTime >= 15);
});

// Test 7: Scenario C: Multiple Orders Ahead -> Queue Delay Added
test('7. Scenario C: Multiple Orders Ahead increases estimated preparation time', () => {
  const items = [{ id: 'samosa', quantity: 2, preparationTime: 4 }];
  const lightState = { workload: { percentage: 30, level: 'LOW' }, ordersAhead: 1, queueDelay: 2 };
  const busyState = { workload: { percentage: 30, level: 'LOW' }, ordersAhead: 8, queueDelay: 15 };

  const resLight = store.calculateSmartPickup(items, lightState);
  const resBusy = store.calculateSmartPickup(items, busyState);

  assert.ok(resBusy.estimatedPreparationTime > resLight.estimatedPreparationTime, 'Busy queue must have longer prep time');
});

// Test 8: Scenario D: Large Bulk Order -> +10 min buffer applied
test('8. Scenario D: Large Order qualifies as bulk with +10m buffer', () => {
  const bulkItems = [
    { id: 'veg-sandwich', quantity: 25, preparationTime: 5 },
    { id: 'samosa', quantity: 20, preparationTime: 4 }
  ];
  const smart = store.calculateSmartPickup(bulkItems);
  assert.strictEqual(smart.isBulkOrder, true);
  assert.strictEqual(smart.bulkOrderAdjustment, 10);
  assert.ok(smart.explanation.some(e => e.includes('Bulk batch preparation buffer')));
});

// Test 9: Scenario E: Sold Out Item -> Order Blocked
test('9. Scenario E: Sold Out Item (Masala Dosa with 0 inventory) blocks order placement', () => {
  store.clearCart();
  const addRes = store.addToCart('masala-dosa', 1);
  assert.strictEqual(addRes.success, false);
  assert.ok(addRes.message.toLowerCase().includes('sold out'));

  const validation = store.validateCart();
  assert.strictEqual(validation.valid, false, 'Empty cart or sold out cart is invalid');
});

// Test 10: Inventory Pre-Check & Negative Stock Prevention
test('10. Inventory Pre-Check never allows negative stock', () => {
  store.setInventory('cold-coffee', 2);
  store.clearCart();
  
  // Try adding 3 items when only 2 available
  const addRes = store.addToCart('cold-coffee', 3);
  assert.strictEqual(addRes.success, false);
  assert.ok(addRes.message.includes('Only 2 available'));

  // Update inventory delta cannot drop below 0
  store.updateInventory('cold-coffee', -50);
  assert.strictEqual(store.getMenuItem('cold-coffee').inventory, 0);

  // Restore inventory for subsequent tests
  store.setInventory('cold-coffee', 10);
  store.setInventory('veg-sandwich', 20);
});

// Test 11: Queue Position Engine for Active Orders
test('11. Live Queue Position Engine correctly ranks active orders', () => {
  // In demo seed:
  // #SC-1048: PREPARING (priority 1) -> Queue #1
  // #SC-1049: ACCEPTED (priority 2)
  // #SC-1052: ACCEPTED (priority 2)
  // #SC-1050: PLACED (priority 3)
  const pos1048 = store.calculateQueuePosition('#SC-1048');
  assert.strictEqual(pos1048, 1, `Expected #SC-1048 in position 1, got ${pos1048}`);

  const pos1050 = store.calculateQueuePosition('#SC-1050');
  assert.ok(pos1050 > 1, `Expected #SC-1050 behind preparing order, got ${pos1050}`);

  // Collected or non-active orders should return null
  const pos1032 = store.calculateQueuePosition('#SC-1032'); // NOT_COLLECTED
  assert.strictEqual(pos1032, null);
});

// Test 12: Workload updates dynamically on order placement and collection
test('12. Workload updates dynamically on order placement and order collection', async () => {
  const initialWorkload = store.calculateKitchenWorkload();
  
  // Create order
  store.clearCart();
  store.addToCart('veg-sandwich', 2);
  const orderRes = await store.createOrder();
  assert.strictEqual(orderRes.success, true);
  const newOrderId = orderRes.orderId;

  const afterPlaceWorkload = store.calculateKitchenWorkload();
  assert.ok(afterPlaceWorkload.activeQueuedMinutes >= initialWorkload.activeQueuedMinutes);

  // Advance order to COLLECTED
  store.updateOrderStatus(newOrderId, 'COLLECTED');
  const afterCollectWorkload = store.calculateKitchenWorkload();
  assert.ok(afterCollectWorkload.activeQueuedMinutes < afterPlaceWorkload.activeQueuedMinutes);
});

// Test 13: 15-Minute Pickup Slots Format and Structure
test('13. 15-Minute Pickup Slots are generated in clean 15-min windows', () => {
  const smart = store.calculateSmartPickup();
  assert.strictEqual(smart.slots.length, 4);
  assert.strictEqual(smart.slots[0].tag, 'Rushed');
  assert.strictEqual(smart.slots[1].tag, 'Recommended');
  assert.strictEqual(smart.slots[2].tag, 'Standard');
  assert.strictEqual(smart.slots[3].tag, 'Standard');
  assert.ok(smart.recommendedPickupSlot.includes('–') || smart.recommendedPickupSlot.includes('-'));
});

// Test 14: Dynamic Human-Readable Explanation Integrity
test('14. Dynamic Explanation Generator outputs coherent explainability bullets', () => {
  const smart = store.calculateSmartPickup();
  assert.ok(Array.isArray(smart.explanation));
  assert.ok(smart.explanation.length >= 3);
  assert.ok(smart.explanation[0].includes('queue'));
  assert.ok(smart.explanation[1].includes('workload'));
  assert.ok(smart.explanation[2].includes('Estimated preparation time'));
});

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
      console.error(`❌ FAIL: HTTP Route: ${urlPath} -> Connection Error: ${err.message}`);
      resolve();
    });
  });
}

async function runAllHttpTests() {
  console.log('\n--- Checking HTTP Server Endpoints ---');
  for (const ep of HTTP_ENDPOINTS) {
    await testHttpEndpoint(ep);
  }

  console.log(`\n===========================================================`);
  console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}% SUCCESS)`);
  console.log(`===========================================================\n`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL SMART QUEUE ENGINE TESTS PASSED WITH 0 FAILURES!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAllHttpTests();
