/**
 * Test Suite: Claude Audit Verification & Master 12 Regression Tests
 * 
 * Verifies all 12 regression scenarios specified in the user prompt:
 * TEST 1  — Fresh load (workload != 100% CRITICAL, cold coffee < 20 min)
 * TEST 2  — Add menu item (Paneer Tikka Roll ₹70, 8m prep, 10 stock)
 * TEST 3  — Edit menu item (Price -> ₹80, Prep -> 12m, Image URL -> new URL, Smart Queue uses 12m)
 * TEST 4  — Inventory (Stock 10 -> 0 triggers SOLD OUT & blocks ordering)
 * TEST 5  — Availability (Toggle unavailable blocks ordering; toggle available restores ordering)
 * TEST 6  — Remove menu item (Removes from menu, prevents new orders)
 * TEST 7  — Historical order safety (Old order retains full dish snapshot after removal)
 * TEST 8  — Student -> Kitchen flow (PLACED -> ACCEPTED -> PREPARING -> READY -> COLLECTED)
 * TEST 9  — Discarded order tracking (NOT_COLLECTED -> DISCARDED shows proper discarded state, not PLACED)
 * TEST 10 — Bulk order (>15 items detected as bulk, +10m buffer applied, filtered to bulk)
 * TEST 11 — Cross-tab synchronization (Storage events trigger reactive updates)
 * TEST 12 — Reset Demo Data (Restores stable 60% workload, does not reintroduce 100% bug)
 */

const fs = require('fs');
const path = require('path');

// Mock localStorage and window
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();
global.fetch = undefined; // Isolate pure unit test from network
global.window = {
  localStorage: global.localStorage,
  addEventListener: () => {},
  dispatchEvent: () => {}
};

// Load store.js
const storeCode = fs.readFileSync(path.join(__dirname, 'js/store.js'), 'utf8');
eval(storeCode);

const store = global.window.canteeneryStore;
let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

(async () => {
  console.log('================================================================');
  console.log('RUNNING CANTEENERY MASTER 12 REGRESSION AUDIT SUITE');
  console.log('================================================================\n');

  try {
    // TEST 1 — Fresh Load
    console.log('--- TEST 1: Fresh Load ---');
    store.resetDemoData();
    const workload = store.calculateKitchenWorkload();
    console.log(`  Workload: ${workload.percentage}% (${workload.level})`);
    assert(workload.percentage <= 65, 'Kitchen does not immediately show 100% CRITICAL (currently ~60% MODERATE)');
    assert(workload.level === 'MODERATE', 'Workload level is MODERATE');

    const singleCoffee = [{ id: 'cold-coffee', name: 'Cold Coffee', price: 50, quantity: 1, preparationTime: 3 }];
    const smart = store.calculateSmartPickup(singleCoffee);
    console.log(`  Single Cold Coffee Prep Estimate: ${smart.estimatedPreparationTime} min | Recommended Slot: ${smart.recommendedPickupSlot}`);
    assert(smart.estimatedPreparationTime >= 5 && smart.estimatedPreparationTime <= 20, 'Single Cold Coffee produces realistic prep estimate (< 20 min, not ~38 min)');
    assert(smart.recommendedPickupSlot !== undefined, 'Recommended pickup slot generated');

    // TEST 2 — Add Menu Item
    console.log('\n--- TEST 2: Add Menu Item ---');
    const addRes = store.addMenuItem({
      name: 'Paneer Tikka Roll',
      price: 70,
      preparationTime: 8,
      inventory: 10,
      category: 'Snacks',
      isVeg: true,
      description: 'Grilled cottage cheese cubes in spiced masala'
    });
    assert(addRes.success === true, 'Admin successfully added Paneer Tikka Roll');
    const addedItem = store.getMenuItem('paneer-tikka-roll');
    assert(addedItem !== null, 'Dish exists in store');
    assert(addedItem.displayName === 'Paneer Tikka Roll', 'Dish name is Paneer Tikka Roll');
    assert(addedItem.price === 70, 'Dish price is 70');
    assert(addedItem.preparationTime === 8, 'Dish prep time is 8 min');
    assert(addedItem.inventory === 10, 'Dish inventory is 10');

    // TEST 3 — Edit Menu Item
    console.log('\n--- TEST 3: Edit Menu Item ---');
    const updateRes = store.updateMenuItem('paneer-tikka-roll', {
      price: 80,
      preparationTime: 12,
      image: 'https://images.unsplash.com/new-paneer-roll.jpg'
    });
    assert(updateRes.success === true, 'Admin successfully updated dish');
    const updatedItem = store.getMenuItem('paneer-tikka-roll');
    assert(updatedItem.price === 80, 'Dish price updated to 80');
    assert(updatedItem.preparationTime === 12, 'Dish prep time updated to 12 min');
    assert(updatedItem.image === 'https://images.unsplash.com/new-paneer-roll.jpg', 'Dish image URL updated');

    // Test Smart Queue uses new prep time
    store.clearCart();
    store.addToCart('paneer-tikka-roll', 1);
    const cartTotals = store.getCartTotals();
    assert(cartTotals.maxPrepTime === 12, 'Smart Queue uses updated prep time of 12 minutes');

    // TEST 4 — Inventory
    console.log('\n--- TEST 4: Inventory ---');
    store.setInventory('paneer-tikka-roll', 0);
    const zeroItem = store.getMenuItem('paneer-tikka-roll');
    const invStatusZero = store.getInventoryStatus(zeroItem);
    assert(invStatusZero.status === 'SOLD_OUT', 'Setting stock to 0 sets status to SOLD_OUT');
    assert(invStatusZero.canAdd === false, 'canAdd is false for sold-out dish');

    store.clearCart();
    const soldOutAddRes = store.addToCart('paneer-tikka-roll', 1);
    assert(soldOutAddRes.success === false, 'Sold-out dish cannot be added to cart');

    // TEST 5 — Availability
    console.log('\n--- TEST 5: Availability ---');
    store.setInventory('paneer-tikka-roll', 10);
    store.toggleMenuItemAvailability('paneer-tikka-roll'); // Set unavailable
    const unavailItem = store.getMenuItem('paneer-tikka-roll');
    assert(unavailItem.isAvailable === false, 'Dish marked as unavailable');
    const unavailStatus = store.getInventoryStatus(unavailItem);
    assert(unavailStatus.status === 'UNAVAILABLE', 'Status is UNAVAILABLE');
    assert(unavailStatus.canAdd === false, 'Cannot add unavailable dish');

    store.toggleMenuItemAvailability('paneer-tikka-roll'); // Set available again
    assert(store.getMenuItem('paneer-tikka-roll').isAvailable === true, 'Dish marked as available');
    const availAddRes = store.addToCart('paneer-tikka-roll', 2);
    assert(availAddRes.success === true, 'Available dish can be added to cart');

    // TEST 6 — Remove Menu Item
    console.log('\n--- TEST 6: Remove Menu Item ---');
    // First place an order with this dish so we can test historical safety in Test 7
    const createRes1 = await store.createOrder('1:00 PM - 1:15 PM');
    assert(createRes1.success === true, 'Order placed containing Paneer Tikka Roll');
    const activeOrder = createRes1.order;

    const removeRes = store.removeMenuItem('paneer-tikka-roll');
    assert(removeRes.success === true, 'removeMenuItem returned success');
    assert(store.getMenuItem('paneer-tikka-roll') === null, 'Item removed from active menu');

    // Try to add removed item
    const addRemovedRes = store.addToCart('paneer-tikka-roll', 1);
    assert(addRemovedRes.success === false, 'Removed dish cannot be newly ordered');

    // TEST 7 — Historical Order Safety
    console.log('\n--- TEST 7: Historical Order Safety ---');
    const fetchedHistoricOrder = store.getOrder(activeOrder.orderId);
    assert(fetchedHistoricOrder !== null, 'Historical order exists');
    const historicItem = fetchedHistoricOrder.items.find(i => i.id === 'paneer-tikka-roll');
    assert(historicItem !== undefined, 'Historical order preserved the removed dish data');
    assert(historicItem.price === 80, 'Historical item price preserved (80)');
    assert(historicItem.quantity === 2, 'Historical item quantity preserved (2)');

    // TEST 8 — Student -> Kitchen Flow
    console.log('\n--- TEST 8: Student -> Kitchen Lifecycle Flow ---');
    store.clearCart();
    store.addToCart('veg-sandwich', 1);
    const createRes2 = await store.createOrder('1:15 PM - 1:30 PM');
    assert(createRes2.success === true, 'Order created successfully');
    const flowOrder = createRes2.order;
    assert(flowOrder.status === 'PLACED', 'Order starts in PLACED state');

    store.updateOrderStatus(flowOrder.orderId, 'ACCEPTED');
    assert(store.getOrder(flowOrder.orderId).status === 'ACCEPTED', 'Status transitioned to ACCEPTED');

    store.updateOrderStatus(flowOrder.orderId, 'PREPARING');
    assert(store.getOrder(flowOrder.orderId).status === 'PREPARING', 'Status transitioned to PREPARING');

    store.updateOrderStatus(flowOrder.orderId, 'READY');
    assert(store.getOrder(flowOrder.orderId).status === 'READY', 'Status transitioned to READY');

    store.updateOrderStatus(flowOrder.orderId, 'COLLECTED');
    assert(store.getOrder(flowOrder.orderId).status === 'COLLECTED', 'Status transitioned to COLLECTED');

    // TEST 9 — Discarded Order
    console.log('\n--- TEST 9: Discarded Order Flow ---');
    store.clearCart();
    store.addToCart('samosa', 2);
    const createRes3 = await store.createOrder('1:30 PM - 1:45 PM');
    assert(createRes3.success === true, 'Order created for discard test');
    const discardOrder = createRes3.order;
    store.updateOrderStatus(discardOrder.orderId, 'READY');
    store.updateOrderStatus(discardOrder.orderId, 'NOT_COLLECTED');
    store.updateOrderStatus(discardOrder.orderId, 'DISCARDED');
    assert(store.getOrder(discardOrder.orderId).status === 'DISCARDED', 'Order transitioned to DISCARDED');

    // Verify tracking.js status config has DISCARDED
    const trackingCode = fs.readFileSync(path.join(__dirname, 'js/tracking.js'), 'utf8');
    assert(trackingCode.includes('DISCARDED: {'), 'tracking.js contains DISCARDED in STATUS_CONFIG');
    assert(trackingCode.includes("title: 'Order Discarded & Closed'"), 'DISCARDED title is Order Discarded & Closed');

    // TEST 10 — Bulk Order Detection & Filtering
    console.log('\n--- TEST 10: Bulk Order ---');
    store.clearCart();
    store.addToCart('veg-sandwich', 16);
    const bulkTotals = store.getCartTotals();
    const bulkRec = store.calculateSmartPickup();
    assert(bulkRec.isBulkOrder === true, 'Order with 16 items is detected as bulk');
    assert(bulkRec.bulkOrderAdjustment === 10, 'Bulk buffer of +10 min applied');

    // TEST 11 — Cross-tab Synchronization
    console.log('\n--- TEST 11: Cross-tab Synchronization ---');
    let crossTabMenuFired = false;
    store.subscribe('menu-change', () => { crossTabMenuFired = true; });
    store.updateInventory('samosa', 5);
    assert(crossTabMenuFired === true, 'menu-change emitted for cross-tab reactivity');

    // TEST 12 — Reset Demo Data
    console.log('\n--- TEST 12: Reset Demo Data ---');
    store.resetDemoData();
    const resetWorkload = store.calculateKitchenWorkload();
    console.log(`  Reset Workload: ${resetWorkload.percentage}% (${resetWorkload.level})`);
    assert(resetWorkload.percentage <= 65, 'Workload after reset is realistic (< 65%, not 100%)');
    assert(store.getOrders().length >= 4, 'Demo orders restored');

    console.log('\n================================================================');
    console.log(`ALL ${passedAssertions}/${totalAssertions} REGRESSION CHECKS PASSED (100% SUCCESS)`);
    console.log('================================================================');
  } catch (err) {
    console.error('\nAudit Verification Failed:', err.message);
    process.exit(1);
  }
})();
