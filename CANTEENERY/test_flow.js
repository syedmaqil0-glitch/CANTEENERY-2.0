/**
 * Comprehensive Automated Test Suite for Canteenery Phase 1 & Phase 2
 */

const http = require('http');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock localStorage for Node environment testing
const storage = {};
global.localStorage = {
  getItem: (key) => (key in storage ? storage[key] : null),
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = {
  addEventListener: () => {}
};

// Load Store Module
const storeCode = fs.readFileSync(path.join(__dirname, 'js', 'store.js'), 'utf-8');
eval(storeCode);
const store = window.canteeneryStore;

async function runTests() {
  console.log('=== RUNNING CANTEENERY PHASE 2 AUTOMATED TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  store.resetDemoData();
  await new Promise(r => setTimeout(r, 100));

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // 1. Initial State & Menu
  await test('Store initializes with 9 demo food items', () => {
    const menu = store.getMenu();
    assert.strictEqual(menu.length, 9, `Expected 9 items, got ${menu.length}`);
  });

  await test('Demo Inventory Rules Validation', () => {
    store.resetDemoData();
    const dosa = store.getMenuItem('masala-dosa');
    const coffee = store.getMenuItem('cold-coffee');
    const sandwich = store.getMenuItem('veg-sandwich');

    assert.strictEqual(dosa.inventory, 0, 'Masala Dosa should have 0 inventory');
    assert.strictEqual(store.getInventoryStatus(dosa).status, 'SOLD_OUT', 'Dosa status should be SOLD_OUT');
    assert.strictEqual(store.getInventoryStatus(dosa).canAdd, false, 'Dosa canAdd should be false');

    assert.strictEqual(coffee.inventory, 4, 'Cold Coffee should have 4 inventory');
    assert.strictEqual(store.getInventoryStatus(coffee).status, 'LOW_STOCK', 'Coffee status should be LOW_STOCK');
    assert.strictEqual(store.getInventoryStatus(coffee).canAdd, true, 'Coffee canAdd should be true');

    assert.strictEqual(sandwich.inventory, 23, 'Veg Sandwich should have 23 inventory');
    assert.strictEqual(store.getInventoryStatus(sandwich).status, 'AVAILABLE', 'Sandwich status should be AVAILABLE');
    assert.strictEqual(store.getInventoryStatus(sandwich).canAdd, true, 'Sandwich canAdd should be true');
  });

  // 2. Demo Seed Orders for Phase 2
  await test('Store initializes with realistic demo orders for kitchen queue', () => {
    store.resetDemoData();
    const orders = store.getOrders();
    assert.ok(orders.length >= 7, `Expected at least 7 demo orders, got ${orders.length}`);

    const aqilOrder = orders.find(o => o.orderId === '#SC-1048');
    assert.ok(aqilOrder, 'Demo order #SC-1048 should exist');
    assert.strictEqual(aqilOrder.studentName, 'Aqil');
    assert.strictEqual(aqilOrder.status, 'PREPARING');

    const rahulOrder = orders.find(o => o.orderId === '#SC-1049');
    assert.ok(rahulOrder, 'Demo order #SC-1049 should exist');
    assert.strictEqual(rahulOrder.status, 'ACCEPTED');

    const priyaOrder = orders.find(o => o.orderId === '#SC-1050');
    assert.ok(priyaOrder, 'Demo order #SC-1050 should exist');
    assert.strictEqual(priyaOrder.status, 'PLACED');

    const snehaOrder = orders.find(o => o.orderId === '#SC-1051');
    assert.ok(snehaOrder, 'Demo order #SC-1051 should exist');
    assert.strictEqual(snehaOrder.status, 'READY');

    const bulkOrder = orders.find(o => o.orderId === '#SC-1052');
    assert.ok(bulkOrder, 'Bulk demo order #SC-1052 should exist');
    assert.strictEqual(bulkOrder.isBulk, true);

    const holdingOrder = orders.find(o => o.orderId === '#SC-1045');
    assert.ok(holdingOrder, 'Holding demo order #SC-1045 should exist');
    assert.strictEqual(holdingOrder.status, 'HOLDING');

    const uncollectedOrder = orders.find(o => o.orderId === '#SC-1032');
    assert.ok(uncollectedOrder, 'Uncollected demo order #SC-1032 should exist');
    assert.strictEqual(uncollectedOrder.status, 'NOT_COLLECTED');
  });

  // 3. Bulk Order Detection Engine
  await test('Bulk Order Detector correctly classifies orders', () => {
    const normalOrder = {
      items: [
        { id: 'veg-sandwich', quantity: 2 },
        { id: 'cold-coffee', quantity: 1 }
      ]
    };
    assert.strictEqual(store.isBulkOrder(normalOrder), false, '3 items should not be bulk');

    const largeTotalOrder = {
      items: [
        { id: 'samosa', quantity: 8 },
        { id: 'veg-sandwich', quantity: 8 }
      ]
    };
    assert.strictEqual(store.isBulkOrder(largeTotalOrder), true, '16 items should trigger bulk order');

    const singleLargeItemOrder = {
      items: [
        { id: 'chicken-biryani', quantity: 10 }
      ]
    };
    assert.strictEqual(store.isBulkOrder(singleLargeItemOrder), true, 'Single item qty >= 10 should trigger bulk order');
  });

  // 4. Kitchen Workload Engine & Thresholds
  await test('Workload capacity calculation and threshold levels', () => {
    const workload = store.calculateKitchenWorkload(60);
    assert.ok(workload.percentage >= 0 && workload.percentage <= 100, 'Workload percentage should be 0-100');
    assert.ok(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(workload.level), `Invalid workload level: ${workload.level}`);
    assert.ok(workload.activeQueuedMinutes > 0, 'Should have active queued prep minutes');
  });

  // 5. Order Status Lifecycle State Machine
  await test('Full Order Lifecycle Transitions (PLACED -> ACCEPTED -> PREPARING -> READY -> COLLECTED)', () => {
    store.resetDemoData();
    assert.strictEqual(store.getNextStatusAction('PLACED').nextStatus, 'ACCEPTED');
    assert.strictEqual(store.getNextStatusAction('PLACED').label, 'Accept Order');

    assert.strictEqual(store.getNextStatusAction('ACCEPTED').nextStatus, 'PREPARING');
    assert.strictEqual(store.getNextStatusAction('ACCEPTED').label, 'Start Preparing');

    assert.strictEqual(store.getNextStatusAction('PREPARING').nextStatus, 'READY');
    assert.strictEqual(store.getNextStatusAction('PREPARING').label, 'Mark Ready');

    assert.strictEqual(store.getNextStatusAction('READY').nextStatus, 'COLLECTED');
    assert.strictEqual(store.getNextStatusAction('READY').label, 'Mark Collected');

    const orderId = '#SC-1050';
    assert.strictEqual(store.getOrder(orderId).status, 'PLACED');

    store.updateOrderStatus(orderId, 'ACCEPTED');
    assert.strictEqual(store.getOrder(orderId).status, 'ACCEPTED');

    store.updateOrderStatus(orderId, 'PREPARING');
    assert.strictEqual(store.getOrder(orderId).status, 'PREPARING');

    store.updateOrderStatus(orderId, 'READY');
    const readyOrder = store.getOrder(orderId);
    assert.strictEqual(readyOrder.status, 'READY');
    assert.ok(readyOrder.readySince, 'READY order should have readySince timestamp');

    store.updateOrderStatus(orderId, 'COLLECTED');
    const collectedOrder = store.getOrder(orderId);
    assert.strictEqual(collectedOrder.status, 'COLLECTED');
    assert.ok(collectedOrder.collectedAt, 'COLLECTED order should have collectedAt timestamp');
  });

  // 6. Uncollected & Holding State Transitions
  await test('Uncollected & Holding Order Transitions', () => {
    const orderId = '#SC-1051';
    store.simulateMissedPickup(orderId);
    assert.strictEqual(store.getOrder(orderId).status, 'NOT_COLLECTED');

    store.updateOrderStatus(orderId, 'HOLDING');
    assert.strictEqual(store.getOrder(orderId).status, 'HOLDING');

    store.updateOrderStatus(orderId, 'COLLECTED');
    assert.strictEqual(store.getOrder(orderId).status, 'COLLECTED');
  });

  // 7. Inventory Restocking & Direct Updates
  await test('Inventory stock adjustment and restock controls', () => {
    const sandwichBefore = store.getMenuItem('veg-sandwich').inventory;
    
    store.setInventory('veg-sandwich', 30);
    assert.strictEqual(store.getMenuItem('veg-sandwich').inventory, 30);

    store.updateInventory('veg-sandwich', -5);
    assert.strictEqual(store.getMenuItem('veg-sandwich').inventory, 25);

    store.setInventory('veg-sandwich', sandwichBefore);
  });

  // 8. Order Placement & Sequential ID Generation
  await test('New student order placement creates next ID, decrements stock, and enters kitchen queue', async () => {
    store.clearCart();
    store.addToCart('veg-sandwich', 2);
    store.addToCart('cold-coffee', 1);

    const sandwichStockBefore = store.getMenuItem('veg-sandwich').inventory;
    const coffeeStockBefore = store.getMenuItem('cold-coffee').inventory;

    const result = await store.createOrder();
    assert.strictEqual(result.success, true);
    assert.ok(result.orderId.startsWith('#SC-'), 'Order ID should start with #SC-');
    assert.strictEqual(result.order.status, 'PLACED');

    // Check inventory decreased
    assert.strictEqual(store.getMenuItem('veg-sandwich').inventory, sandwichStockBefore - 2);
    assert.strictEqual(store.getMenuItem('cold-coffee').inventory, coffeeStockBefore - 1);

    // Check presence in active orders
    const placed = store.getOrder(result.orderId);
    assert.ok(placed, 'New order should exist in order store');
    assert.strictEqual(placed.status, 'PLACED');
  });

  // 9. HTTP Endpoint & Route Aliasing Check
  const pages = [
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

  function checkEndpoint(page) {
    return new Promise((resolve) => {
      http.get(`http://localhost:3000${page}`, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ PASS: HTTP Endpoint: ${page} returns 200 OK`);
          passed++;
        } else {
          console.error(`❌ FAIL: HTTP Endpoint: ${page} returned ${res.statusCode}`);
          failed++;
        }
        resolve();
      }).on('error', (e) => {
        console.error(`❌ FAIL: Could not connect to http://localhost:3000${page}: ${e.message}`);
        failed++;
        resolve();
      });
    });
  }

  for (const page of pages) {
    await checkEndpoint(page);
  }

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
