/**
 * Canteenery - Ultimate 20-Step Live Demo Sequence Test (Phase 4 Final Hardening)
 * 
 * Verifies every single step of the exact hackathon presentation flow.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

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

// 2. Load and Evaluate Store
const storeCode = fs.readFileSync(path.join(__dirname, 'js', 'store.js'), 'utf-8');
eval(storeCode);
const store = window.canteeneryStore;

let currentStep = 1;
async function step(desc, fn) {
  try {
    await fn();
    console.log(`[STEP ${currentStep}] ✅ ${desc}`);
    currentStep++;
  } catch (err) {
    console.error(`[STEP ${currentStep}] ❌ FAILED: ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

async function runSequence() {
  console.log('================================================================');
  console.log('🚀 RUNNING CANTEENERY FINAL LIVE DEMO 20-STEP END-TO-END TEST');
  console.log('================================================================\n');

  // Clean demo reset on server and client
  try {
    await fetch('http://localhost:3000/api/reset', { method: 'POST' });
  } catch (e) {}
  store.resetDemoData();
  await new Promise(r => setTimeout(r, 100));

  // STEP 1: Open Canteenery Home
  await step('Open Canteenery Home & verify menu items initialized', () => {
    const menu = store.getMenu();
    assert.strictEqual(menu.length, 9, `Expected 9 items, got ${menu.length}`);
  });

  // STEP 2: Open Menu
  await step('Open Menu & verify default inventory stock', () => {
    const vegSandwich = store.getMenuItem('veg-sandwich');
    assert.strictEqual(vegSandwich.inventory, 23);
    const coldCoffee = store.getMenuItem('cold-coffee');
    assert.strictEqual(coldCoffee.inventory, 4);
    const masalaDosa = store.getMenuItem('masala-dosa');
    assert.strictEqual(masalaDosa.inventory, 0);
  });

  // STEP 3: Add Items to Cart
  await step('Add 2 x Veg Sandwich and 1 x Cold Coffee to cart', () => {
    store.clearCart();
    const res1 = store.addToCart('veg-sandwich', 2);
    assert.strictEqual(res1.success, true);
    const res2 = store.addToCart('cold-coffee', 1);
    assert.strictEqual(res2.success, true);
  });

  // STEP 4: Open Cart
  await step('Open Cart and verify totals', () => {
    const cart = store.getCart();
    assert.strictEqual(cart.length, 2);
    const totals = store.getCartTotals();
    assert.strictEqual(totals.subtotal, 130);
    assert.strictEqual(totals.total, 136.5);
    assert.strictEqual(totals.totalQty, 3);
  });

  // STEP 5: Proceed to Checkout & Trigger Smart Queue Engine
  await step('Proceed to Checkout & trigger Smart Queue calculation', () => {
    const smart = store.calculateSmartPickup();
    assert.ok(smart.estimatedPreparationTime > 0);
    assert.ok(smart.recommendedPickupSlot);
    assert.ok(smart.explanation.length > 0);
  });

  // STEP 6: Verify Smart Queue Outputs
  await step('Verify Smart Queue Engine outputs live metrics and dynamic explanation', () => {
    const smart = store.calculateSmartPickup();
    assert.strictEqual(smart.workload.level, 'MODERATE');
    assert.ok(smart.ordersAhead >= 0, `Orders ahead should be calculated (${smart.ordersAhead})`);
    assert.ok(smart.estimatedPreparationTime >= 8, `Est prep time should be calculated (${smart.estimatedPreparationTime} min)`);
    assert.ok(smart.recommendedPickupSlot, `Recommended pickup slot should exist (${smart.recommendedPickupSlot})`);
    assert.ok(Array.isArray(smart.explanation) && smart.explanation.length >= 3, 'Dynamic explanations array must exist');
    
    console.log(`         • Kitchen Load: ${smart.workload.percentage}% (${smart.workload.level})`);
    console.log(`         • Orders Ahead: ${smart.ordersAhead}`);
    console.log(`         • Est. Prep Time: ${smart.estimatedPreparationTime} min`);
    console.log(`         • Recommended Slot: ${smart.recommendedPickupSlot}`);
    console.log(`         • Reason: ${smart.explanation[0]} | ${smart.explanation[1]}`);
  });

  // STEP 7: Place Order
  let placedOrderId = null;
  await step('Place Pre-Order -> Order ID created, Status: PLACED', async () => {
    const orderRes = await store.createOrder();
    assert.strictEqual(orderRes.success, true);
    placedOrderId = orderRes.orderId;
    assert.ok(placedOrderId.startsWith('#SC-'), 'Order ID should start with #SC-');
    assert.strictEqual(orderRes.order.status, 'PLACED');
    assert.ok(orderRes.order.pickupSlot);
    console.log(`         • Created Order: ${placedOrderId} (Status: PLACED)`);
  });

  // STEP 8: Open Kitchen Dashboard
  await step(`Open Kitchen Dashboard -> Verify new order ${placedOrderId} is present in queue`, () => {
    const orders = store.getOrders();
    const found = orders.find(o => o.orderId === placedOrderId);
    assert.ok(found, `Order ${placedOrderId} must exist in kitchen queue`);
    assert.strictEqual(found.status, 'PLACED');
  });

  // STEP 9: Kitchen Accepts Order
  await step(`Kitchen: Accept Order (${placedOrderId} -> ACCEPTED)`, () => {
    const action = store.getNextStatusAction(store.getOrder(placedOrderId).status);
    assert.strictEqual(action.nextStatus, 'ACCEPTED');
    store.updateOrderStatus(placedOrderId, action.nextStatus);
    assert.strictEqual(store.getOrder(placedOrderId).status, 'ACCEPTED');
  });

  // STEP 10: Kitchen Starts Preparing
  await step(`Kitchen: Start Preparing (${placedOrderId} -> PREPARING)`, () => {
    const action = store.getNextStatusAction(store.getOrder(placedOrderId).status);
    assert.strictEqual(action.nextStatus, 'PREPARING');
    store.updateOrderStatus(placedOrderId, action.nextStatus);
    assert.strictEqual(store.getOrder(placedOrderId).status, 'PREPARING');
  });

  // STEP 11: Return to Student Tracking
  await step('Student Tracking: Verify status reflects PREPARING', () => {
    const studentViewOrder = store.getOrder(placedOrderId);
    assert.strictEqual(studentViewOrder.status, 'PREPARING');
  });

  // STEP 12: Kitchen Marks Ready
  await step(`Kitchen: Mark Ready (${placedOrderId} -> READY)`, () => {
    const action = store.getNextStatusAction(store.getOrder(placedOrderId).status);
    assert.strictEqual(action.nextStatus, 'READY');
    store.updateOrderStatus(placedOrderId, action.nextStatus);
    const readyOrder = store.getOrder(placedOrderId);
    assert.strictEqual(readyOrder.status, 'READY');
    assert.ok(readyOrder.readySince, 'Must have readySince timestamp');
  });

  // STEP 13: Student Sees Ready For Pickup
  await step('Student Tracking: Verify status reflects READY', () => {
    const studentViewOrder = store.getOrder(placedOrderId);
    assert.strictEqual(studentViewOrder.status, 'READY');
  });

  // STEP 14: Kitchen Marks Collected
  await step(`Kitchen: Mark Collected (${placedOrderId} -> COLLECTED)`, () => {
    const action = store.getNextStatusAction(store.getOrder(placedOrderId).status);
    assert.strictEqual(action.nextStatus, 'COLLECTED');
    store.updateOrderStatus(placedOrderId, action.nextStatus);
    const collectedOrder = store.getOrder(placedOrderId);
    assert.strictEqual(collectedOrder.status, 'COLLECTED');
    assert.ok(collectedOrder.collectedAt, 'Must have collectedAt timestamp');
  });

  // STEP 15: Student Tracking Reflects Collected
  await step('Student Tracking: Verify status reflects COLLECTED', () => {
    const studentViewOrder = store.getOrder(placedOrderId);
    assert.strictEqual(studentViewOrder.status, 'COLLECTED');
  });

  // STEP 16: Verify Inventory Decreased
  await step('Verify inventory decreased (Veg Sandwich: 23 -> 21, Cold Coffee: 4 -> 3)', () => {
    const sandwich = store.getMenuItem('veg-sandwich');
    const coffee = store.getMenuItem('cold-coffee');
    assert.strictEqual(sandwich.inventory, 21, `Veg Sandwich should be 21, got ${sandwich.inventory}`);
    assert.strictEqual(coffee.inventory, 3, `Cold Coffee should be 3, got ${coffee.inventory}`);
  });

  // STEP 17: Demonstrate Sold-Out Item
  await step('Demonstrate sold-out item (Masala Dosa with 0 stock blocks order)', () => {
    store.clearCart();
    const addRes = store.addToCart('masala-dosa', 1);
    assert.strictEqual(addRes.success, false);
    assert.ok(addRes.message.includes('sold out'));
    const validation = store.validateCart();
    assert.strictEqual(validation.valid, false);
  });

  // STEP 18: Demonstrate High Workload
  await step('Demonstrate high workload adjustment (+5 min penalty and slot push)', () => {
    const highState = { workload: { percentage: 85, level: 'HIGH' }, ordersAhead: 5 };
    const smart = store.calculateSmartPickup([{ id: 'veg-sandwich', quantity: 2, preparationTime: 5 }], highState);
    assert.strictEqual(smart.workloadAdjustment, 5);
    assert.ok(smart.estimatedPreparationTime >= 15);
  });

  // STEP 19: Demonstrate Bulk Order
  await step('Demonstrate bulk order detection (>15 items, +10 min buffer, routed to bulk)', () => {
    const bulkItems = [
      { id: 'veg-sandwich', quantity: 20, preparationTime: 5 },
      { id: 'cold-coffee', quantity: 10, preparationTime: 3 }
    ];
    const smart = store.calculateSmartPickup(bulkItems);
    assert.strictEqual(smart.isBulkOrder, true);
    assert.strictEqual(smart.bulkOrderAdjustment, 10);
  });

  // STEP 20: Demonstrate Uncollected Order Handling
  await step('Demonstrate uncollected order workflow (Simulate missed window -> NOT_COLLECTED -> HOLDING)', () => {
    const demoReadyId = '#SC-1051';
    store.simulateMissedPickup(demoReadyId);
    assert.strictEqual(store.getOrder(demoReadyId).status, 'NOT_COLLECTED');
    
    store.updateOrderStatus(demoReadyId, 'HOLDING');
    assert.strictEqual(store.getOrder(demoReadyId).status, 'HOLDING');
    
    store.updateOrderStatus(demoReadyId, 'COLLECTED');
    assert.strictEqual(store.getOrder(demoReadyId).status, 'COLLECTED');
  });

  console.log('\n================================================================');
  console.log('🎉 ALL 20 LIVE DEMO STEPS COMPLETED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}

runSequence();
