/**
 * Canteenery - Smart Queue Engine Interactive Visualizer Controller (Phase 3)
 */

document.addEventListener('DOMContentLoaded', () => {
  initEnginePage();
});

const ITEM_PRESETS = {
  standard: [
    { id: 'veg-sandwich', name: 'Veg Sandwich', price: 40, quantity: 2, preparationTime: 5 },
    { id: 'cold-coffee', name: 'Cold Coffee', price: 50, quantity: 1, preparationTime: 3 }
  ],
  single: [
    { id: 'cold-coffee', name: 'Cold Coffee', price: 50, quantity: 1, preparationTime: 3 }
  ],
  heavy: [
    { id: 'chicken-biryani', name: 'Chicken Biryani', price: 120, quantity: 1, preparationTime: 12 },
    { id: 'samosa', name: 'Samosa', price: 20, quantity: 2, preparationTime: 4 }
  ],
  bulk: [
    { id: 'veg-sandwich', name: 'Veg Sandwich', price: 40, quantity: 25, preparationTime: 5 },
    { id: 'samosa', name: 'Samosa', price: 20, quantity: 20, preparationTime: 4 },
    { id: 'cold-coffee', name: 'Cold Coffee', price: 50, quantity: 15, preparationTime: 3 }
  ],
  soldout: [
    { id: 'masala-dosa', name: 'Masala Dosa', price: 50, quantity: 1, preparationTime: 8 }
  ]
};

function initEnginePage() {
  handleControlChange();
}

function applyPreset(scenario) {
  const itemSelect = document.getElementById('ctrl-items-select');
  const loadSlider = document.getElementById('ctrl-load-slider');
  const aheadSlider = document.getElementById('ctrl-ahead-slider');

  if (scenario === 'low') {
    if (itemSelect) itemSelect.value = 'single';
    if (loadSlider) loadSlider.value = 25;
    if (aheadSlider) aheadSlider.value = 1;
  } else if (scenario === 'moderate') {
    if (itemSelect) itemSelect.value = 'standard';
    if (loadSlider) loadSlider.value = 62;
    if (aheadSlider) aheadSlider.value = 4;
  } else if (scenario === 'high') {
    if (itemSelect) itemSelect.value = 'heavy';
    if (loadSlider) loadSlider.value = 85;
    if (aheadSlider) aheadSlider.value = 7;
  } else if (scenario === 'bulk') {
    if (itemSelect) itemSelect.value = 'bulk';
    if (loadSlider) loadSlider.value = 75;
    if (aheadSlider) aheadSlider.value = 5;
  } else if (scenario === 'soldout') {
    if (itemSelect) itemSelect.value = 'soldout';
    if (loadSlider) loadSlider.value = 40;
    if (aheadSlider) aheadSlider.value = 2;
  }

  handleControlChange();
}

function handleControlChange() {
  if (!window.canteeneryStore) return;

  const itemSelect = document.getElementById('ctrl-items-select');
  const loadSlider = document.getElementById('ctrl-load-slider');
  const aheadSlider = document.getElementById('ctrl-ahead-slider');

  const selectedItemPreset = itemSelect ? itemSelect.value : 'standard';
  const loadVal = parseInt(loadSlider ? loadSlider.value : '62', 10);
  const aheadVal = parseInt(aheadSlider ? aheadSlider.value : '4', 10);

  // Update labels
  const loadLabel = document.getElementById('ctrl-load-label');
  let loadTier = 'LOW';
  if (loadVal >= 90) loadTier = 'CRITICAL';
  else if (loadVal >= 70) loadTier = 'HIGH';
  else if (loadVal >= 40) loadTier = 'MODERATE';

  if (loadLabel) {
    loadLabel.textContent = `${loadVal}% (${loadTier})`;
  }

  const aheadLabel = document.getElementById('ctrl-ahead-label');
  if (aheadLabel) {
    aheadLabel.textContent = `${aheadVal} ${aheadVal === 1 ? 'order' : 'orders'}`;
  }

  // Get items
  const items = ITEM_PRESETS[selectedItemPreset] || ITEM_PRESETS.standard;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  // Run Smart Queue Engine calculation with custom state
  const customState = {
    workload: {
      percentage: loadVal,
      level: loadTier,
      activeQueuedMinutes: Math.round(loadVal * 0.6)
    },
    ordersAhead: aheadVal
  };

  const result = window.canteeneryStore.calculateSmartPickup(items, customState);

  // 1. Update Node 1: Order Details
  const nodeOrderSize = document.getElementById('node-order-size');
  if (nodeOrderSize) {
    nodeOrderSize.textContent = result.isBulkOrder ? `Size: ${totalQty} items (BULK)` : `Size: ${totalQty} items`;
  }

  // 2. Update Node 2: Kitchen Workload
  const nodeWorkloadText = document.getElementById('node-workload-text');
  if (nodeWorkloadText) {
    nodeWorkloadText.textContent = `Load: ${loadVal}%`;
    if (loadTier === 'CRITICAL') nodeWorkloadText.className = 'font-label-sm text-label-sm text-error font-bold';
    else if (loadTier === 'HIGH') nodeWorkloadText.className = 'font-label-sm text-label-sm text-secondary-container font-bold';
    else nodeWorkloadText.className = 'font-label-sm text-label-sm text-surface-tint font-bold';
  }

  // 3. Update Node 3: Orders Ahead
  const nodeQueueAhead = document.getElementById('node-queue-ahead');
  if (nodeQueueAhead) {
    nodeQueueAhead.textContent = `Ahead: ${aheadVal} (+${result.queueDelay}m)`;
  }

  // 4. Update Node 4: Prep Time
  const nodePrepTime = document.getElementById('node-prep-time');
  if (nodePrepTime) {
    nodePrepTime.textContent = `Est: ${result.estimatedPreparationTime} min`;
  }

  // 5. Update Node 5: Inventory
  const nodeInvText = document.getElementById('node-inventory-text');
  const nodeInvCard = document.getElementById('node-inventory-card');
  const nodeInvIcon = document.getElementById('node-inventory-icon');

  const isSoldOut = selectedItemPreset === 'soldout';
  if (isSoldOut) {
    if (nodeInvText) {
      nodeInvText.textContent = 'Sold Out (0 Left)';
      nodeInvText.className = 'font-label-sm text-label-sm text-error font-bold';
    }
    if (nodeInvIcon) {
      nodeInvIcon.className = 'w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-error shrink-0';
    }
  } else {
    if (nodeInvText) {
      nodeInvText.textContent = 'In Stock (Verified)';
      nodeInvText.className = 'font-label-sm text-label-sm text-green-700 font-bold';
    }
    if (nodeInvIcon) {
      nodeInvIcon.className = 'w-10 h-10 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#166534] shrink-0';
    }
  }

  // 6. Update Output Slot Card
  const outputSlot = document.getElementById('output-recommended-slot');
  if (outputSlot) {
    outputSlot.textContent = isSoldOut ? 'BLOCKED — OUT OF STOCK' : result.recommendedPickupSlot;
    outputSlot.className = isSoldOut
      ? 'font-headline-md text-headline-md text-error font-bold'
      : 'font-headline-lg text-headline-lg text-primary font-bold';
  }

  const outputReady = document.getElementById('output-ready-time');
  if (outputReady) {
    outputReady.textContent = isSoldOut
      ? 'Item unavailable. Pre-order cannot be placed until restocked.'
      : `Estimated Completion Time: ~${result.estimatedCompletionTime} · Queue Position: #${result.queuePosition}`;
  }

  // 7. Update Dynamic Reasoning List
  const explainList = document.getElementById('output-explanation-list');
  if (explainList) {
    if (isSoldOut) {
      explainList.innerHTML = `
        <li class="flex items-center gap-2 text-error font-medium">
          <span class="material-symbols-outlined text-[18px]">error</span>
          <span>Order blocked: Masala Dosa is currently sold out (0 remaining inventory).</span>
        </li>
      `;
    } else {
      explainList.innerHTML = result.explanation.map(exp => `
        <li class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
          <span>${exp}</span>
        </li>
      `).join('');
    }
  }
}

function resetEngineSimulator() {
  applyPreset('moderate');
}
