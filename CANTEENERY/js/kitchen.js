/**
 * Canteenery - Kitchen Command Center & Order Management Controller
 * 
 * Implements real-time kitchen operations matching Stitch design system:
 * - Live Order Queue management with step-by-step lifecycle actions
 * - Capacity Analytics & Workload calculation gauge
 * - Real-time Inventory stock management & restocking
 * - Bulk order detection, alert cards & smart scheduling
 * - Uncollected & Holding order workflows
 * - Cross-tab reactive updates with Student tracking
 */

document.addEventListener('DOMContentLoaded', () => {
  initKitchenApp();
});

let currentTab = 'dashboard';
let currentQueueFilter = 'ALL';

function initKitchenApp() {
  if (!window.canteeneryStore) {
    console.error('Canteenery Store not found');
    return;
  }

  // Parse initial tab from URL hash if present
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (['dashboard', 'queue', 'inventory', 'bulk', 'uncollected', 'menu-management'].includes(hash)) {
    currentTab = hash;
  }

  initTabNavigation();
  initInventoryModal();
  initDishModal();
  initRemoveDishModal();
  renderAllViews();

  // Reactive store subscriptions
  window.canteeneryStore.subscribe('orders-changed', () => renderAllViews());
  window.canteeneryStore.subscribe('order-updated', () => renderAllViews());
  window.canteeneryStore.subscribe('order-created', () => {
    renderAllViews();
    if (window.showToast) {
      window.showToast('New order received in queue!', 'info');
    }
  });
  window.canteeneryStore.subscribe('menu-change', () => {
    renderKPIs();
    renderInventoryView();
    renderDashboardView();
    renderMenuManagementView();
  });
}

function initTabNavigation() {
  const navLinks = document.querySelectorAll('[data-tab]');
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Switch to Student View button
  const switchBtns = document.querySelectorAll('[data-action="switch-student-view"]');
  switchBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = 'menu.html';
    });
  });

  // Mobile menu drawer
  const mobileToggle = document.getElementById('kitchen-mobile-menu-toggle');
  const sidebar = document.getElementById('kitchen-sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
      sidebar.classList.toggle('flex');
    });
  }
}

function switchTab(tabName) {
  currentTab = tabName;
  window.location.hash = tabName;

  // Update nav link styles
  const navLinks = document.querySelectorAll('[data-tab]');
  navLinks.forEach((link) => {
    const tab = link.getAttribute('data-tab');
    const icon = link.querySelector('.material-symbols-outlined');
    if (tab === tabName) {
      link.className = 'flex items-center gap-md bg-transparent text-secondary-fixed border-l-4 border-secondary-container px-lg py-md scale-95 transition-transform text-label-md font-label-md cursor-pointer';
      if (icon) icon.style.fontVariationSettings = "'FILL' 1";
    } else {
      link.className = 'flex items-center gap-md text-on-primary-container opacity-70 px-lg py-md hover:bg-primary-container hover:opacity-100 transition-all text-label-md font-label-md cursor-pointer';
      if (icon) icon.style.fontVariationSettings = "'FILL' 0";
    }
  });

  // Toggle view containers
  const viewSections = document.querySelectorAll('.kitchen-view-section');
  viewSections.forEach((sec) => {
    if (sec.id === `view-${tabName}`) {
      sec.classList.remove('hidden');
    } else {
      sec.classList.add('hidden');
    }
  });

  // Re-render target view
  renderAllViews();
}

function renderAllViews() {
  renderKPIs();
  if (currentTab === 'dashboard') renderDashboardView();
  else if (currentTab === 'queue') renderQueueView();
  else if (currentTab === 'inventory') renderInventoryView();
  else if (currentTab === 'bulk') renderBulkView();
  else if (currentTab === 'uncollected') renderUncollectedView();
  else if (currentTab === 'menu-management') renderMenuManagementView();
}

// --- Render Bento KPIs Grid ---
function renderKPIs() {
  const store = window.canteeneryStore;
  const orders = store.getOrders();
  const workload = store.calculateKitchenWorkload();

  const activeOrders = orders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status));
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  const activeCountEl = document.getElementById('kpi-active-count');
  if (activeCountEl) activeCountEl.textContent = String(activeOrders.length);

  const prepCountEl = document.getElementById('kpi-prep-count');
  if (prepCountEl) prepCountEl.textContent = String(preparingOrders.length);

  const readyCountEl = document.getElementById('kpi-ready-count');
  if (readyCountEl) readyCountEl.textContent = String(readyOrders.length);

  // Workload KPI
  const loadPercentEl = document.getElementById('kpi-load-percent');
  if (loadPercentEl) {
    loadPercentEl.textContent = `${workload.percentage}%`;
    loadPercentEl.className = `text-display-lg font-display-lg ${workload.levelColor}`;
  }

  const loadLevelEl = document.getElementById('kpi-load-level');
  if (loadLevelEl) loadLevelEl.textContent = workload.level;

  const loadCardEl = document.getElementById('kpi-load-card');
  if (loadCardEl) {
    if (workload.level === 'CRITICAL') {
      loadCardEl.className = 'bg-error-container border border-error/30 rounded-lg p-lg flex flex-col relative overflow-hidden transition-all';
    } else if (workload.level === 'HIGH') {
      loadCardEl.className = 'bg-[#ffeedb] border border-secondary-container/30 rounded-lg p-lg flex flex-col relative overflow-hidden transition-all';
    } else {
      loadCardEl.className = 'bg-surface-container-lowest border border-outline-variant rounded-lg p-lg flex flex-col relative overflow-hidden transition-all';
    }
  }
}

// --- Render View 1: Dashboard Overview ---
function renderDashboardView() {
  const store = window.canteeneryStore;
  const orders = store.getOrders();
  const workload = store.calculateKitchenWorkload();

  // 1. Live Order Queue Snippet (Active orders)
  const activeOrders = orders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status));
  const queueSnippetList = document.getElementById('dashboard-queue-list');
  const aheadBadge = document.getElementById('dashboard-orders-ahead-badge');

  if (aheadBadge) {
    aheadBadge.textContent = `${activeOrders.length} active orders`;
  }

  if (queueSnippetList) {
    if (activeOrders.length === 0) {
      queueSnippetList.innerHTML = `
        <div class="p-xl text-center flex flex-col items-center justify-center text-on-surface-variant gap-sm">
          <span class="material-symbols-outlined text-4xl text-outline-variant">check_circle</span>
          <p class="text-body-md font-medium text-primary">All caught up!</p>
          <p class="text-body-sm">No active orders currently in the preparation queue.</p>
        </div>
      `;
    } else {
      queueSnippetList.innerHTML = activeOrders.map((order, idx) => renderOrderRowHtml(order, idx + 1)).join('');
      attachOrderActionListeners(queueSnippetList);
    }
  }

  // 2. Capacity Analytics Gauge
  const gaugePercentText = document.getElementById('gauge-percent-text');
  const gaugeRing = document.getElementById('gauge-progress-ring');
  const gaugeLevelText = document.getElementById('gauge-level-text');

  if (gaugePercentText) gaugePercentText.innerHTML = `${workload.percentage}<span class="text-headline-md font-semibold">%</span>`;
  if (gaugeLevelText) {
    gaugeLevelText.textContent = workload.level;
    gaugeLevelText.className = `text-label-sm font-label-sm tracking-widest mt-xs ${workload.levelColor} font-bold`;
  }

  if (gaugeRing) {
    // 2 * PI * 45 = 282.74
    const circumference = 282.74;
    const offset = circumference - (workload.percentage / 100) * circumference;
    gaugeRing.style.strokeDasharray = `${circumference}`;
    gaugeRing.style.strokeDashoffset = `${Math.max(0, offset)}`;

    if (workload.level === 'CRITICAL') {
      gaugeRing.className = 'gauge-ring text-error';
    } else if (workload.level === 'HIGH') {
      gaugeRing.className = 'gauge-ring text-secondary-container';
    } else if (workload.level === 'MODERATE') {
      gaugeRing.className = 'gauge-ring text-surface-tint';
    } else {
      gaugeRing.className = 'gauge-ring text-outline-variant';
    }
  }

  // Highlight threshold in legend
  const legendRows = document.querySelectorAll('[data-threshold-level]');
  legendRows.forEach((row) => {
    const level = row.getAttribute('data-threshold-level');
    if (level === workload.level) {
      row.className = 'flex items-center justify-between text-body-sm font-body-sm bg-surface-container rounded px-xs -mx-xs py-xs font-bold';
    } else {
      row.className = 'flex items-center justify-between text-body-sm font-body-sm font-normal';
    }
  });

  // 3. Quick Inventory Snippet
  const quickInvList = document.getElementById('dashboard-quick-inventory');
  if (quickInvList) {
    const menu = store.getMenu().slice(0, 4);
    quickInvList.innerHTML = menu.map((item) => {
      const statusInfo = store.getInventoryStatus(item);
      return `
        <div class="flex items-center justify-between py-2 border-b border-outline-variant/30 text-sm">
          <span class="font-medium text-primary">${item.displayName || item.name}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-0.5 rounded-full ${statusInfo.badgeClass} font-semibold">${item.inventory} left</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Bulk alert badge in dashboard
  const bulkBanner = document.getElementById('dashboard-bulk-alert-banner');
  const bulkOrders = orders.filter((o) => store.isBulkOrder(o) && ['PLACED', 'ACCEPTED'].includes(o.status));
  if (bulkBanner) {
    if (bulkOrders.length > 0) {
      bulkBanner.classList.remove('hidden');
      const textEl = document.getElementById('dashboard-bulk-alert-text');
      if (textEl) {
        textEl.textContent = `${bulkOrders.length} Bulk Order pending (${bulkOrders[0].orderId} - ${bulkOrders[0].items.reduce((s, i) => s + i.quantity, 0)} items)`;
      }
    } else {
      bulkBanner.classList.add('hidden');
    }
  }
}

// --- Render View 2: Full Live Queue ---
function renderQueueView() {
  const store = window.canteeneryStore;
  const orders = store.getOrders();
  const container = document.getElementById('full-queue-list');
  if (!container) return;

  // Filter queue
  let filtered = orders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
  if (currentQueueFilter !== 'ALL') {
    filtered = filtered.filter((o) => o.status === currentQueueFilter);
  }

  // Set active filter button
  const filterBtns = document.querySelectorAll('[data-queue-filter]');
  filterBtns.forEach((btn) => {
    const filter = btn.getAttribute('data-queue-filter');
    if (filter === currentQueueFilter) {
      btn.className = 'px-md py-xs rounded-full bg-primary text-on-primary text-label-sm font-semibold';
    } else {
      btn.className = 'px-md py-xs rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-variant text-label-sm font-medium transition-colors';
    }
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-2xl text-center flex flex-col items-center justify-center text-on-surface-variant gap-sm bg-surface-container-lowest rounded-xl border border-outline-variant">
        <span class="material-symbols-outlined text-5xl text-outline-variant">inbox</span>
        <p class="text-headline-sm font-semibold text-primary">No orders match this filter</p>
        <p class="text-body-sm">All orders in this status category are complete or empty.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((order, idx) => renderOrderCardHtml(order, idx + 1)).join('');
  attachOrderActionListeners(container);
}

// Order Row HTML (for Dashboard list)
function renderOrderRowHtml(order, queuePos) {
  const store = window.canteeneryStore;
  const isBulk = store.isBulkOrder(order);
  const action = store.getNextStatusAction(order.status);
  const liveQueuePos = store.calculateQueuePosition(order.orderId);
  const payment = order.payment || { method: 'CASH', status: 'PENDING' };

  // Status visual accents
  let accentColor = 'bg-outline-variant';
  let statusBadge = `<span class="text-label-sm font-label-sm text-outline flex items-center gap-xs"><span class="material-symbols-outlined text-sm">hourglass_empty</span> PLACED</span>`;

  if (order.status === 'ACCEPTED') {
    accentColor = 'bg-surface-tint';
    statusBadge = `<span class="text-label-sm font-label-sm text-surface-tint flex items-center gap-xs"><span class="material-symbols-outlined text-sm">task_alt</span> ACCEPTED</span>`;
  } else if (order.status === 'PREPARING') {
    accentColor = 'bg-secondary-container';
    statusBadge = `<span class="text-label-sm font-label-sm text-secondary-container flex items-center gap-xs font-semibold"><span class="material-symbols-outlined text-sm animate-spin">sync</span> PREPARING</span>`;
  } else if (order.status === 'READY') {
    accentColor = 'bg-green-600';
    statusBadge = `<span class="text-label-sm font-label-sm text-green-700 flex items-center gap-xs font-semibold"><span class="material-symbols-outlined text-sm">check_circle</span> READY</span>`;
  }

  const paymentPill = payment.status === 'PAID'
    ? '<span class="bg-green-100 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-200">PAID</span>'
    : '<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">PAY AT CANTEEN</span>';

  const itemsHtml = order.items.map((i) => `<span class="text-body-md font-body-md text-primary font-medium">${i.quantity}x ${i.name}</span>`).join('');

  return `
    <div class="relative bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm hover:shadow-md transition-shadow flex overflow-hidden pl-xs group" data-order-id="${order.orderId}">
      <!-- Vertical Status Accent -->
      <div class="absolute left-0 top-0 bottom-0 w-2 ${accentColor}"></div>
      <div class="p-md flex-1 grid grid-cols-1 md:grid-cols-12 gap-md items-center ml-sm">
        <div class="md:col-span-3 flex flex-col">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${liveQueuePos ? `<span class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-bold">#${liveQueuePos}</span>` : ''}
            <span class="text-label-md font-label-md font-bold text-primary">${order.orderId}</span>
            ${paymentPill}
            ${isBulk ? '<span class="text-[10px] uppercase font-bold bg-error-container text-error px-1.5 py-0.5 rounded">BULK</span>' : ''}
          </div>
          <span class="text-body-sm font-body-sm text-on-surface-variant flex items-center gap-xs mt-xs">
            <span class="material-symbols-outlined text-sm">person</span> ${order.studentName || 'Student'}
          </span>
        </div>
        <div class="md:col-span-4 flex flex-col gap-0.5">
          ${itemsHtml}
        </div>
        <div class="md:col-span-3 flex flex-col items-start md:items-center">
          <span class="text-label-sm font-label-sm text-on-surface-variant mb-xs">Pickup Slot</span>
          <span class="text-body-sm font-body-sm bg-surface-variant px-sm py-xs rounded text-primary font-medium">${order.pickupSlot || '12:45 - 1:00'}</span>
        </div>
        <div class="md:col-span-2 flex flex-col items-end gap-sm">
          ${statusBadge}
          ${action ? `
            <button class="${action.btnClass} px-md py-sm rounded-md text-label-sm font-label-sm transition-all w-full md:w-auto flex items-center justify-center gap-1 cursor-pointer" data-action-order="${order.orderId}" data-target-status="${action.nextStatus}">
              <span class="material-symbols-outlined text-xs">${action.icon}</span> ${action.label}
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Order Card HTML (for Full Live Queue)
function renderOrderCardHtml(order, queuePos) {
  const store = window.canteeneryStore;
  const isBulk = store.isBulkOrder(order);
  const action = store.getNextStatusAction(order.status);
  const liveQueuePos = store.calculateQueuePosition(order.orderId);
  const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const payment = order.payment || { method: 'CASH', status: 'PENDING' };

  let accentColor = 'bg-outline-variant';
  let badgeClass = 'bg-surface-variant text-on-surface-variant';
  if (order.status === 'ACCEPTED') {
    accentColor = 'bg-surface-tint';
    badgeClass = 'bg-surface-tint/10 text-surface-tint font-bold';
  } else if (order.status === 'PREPARING') {
    accentColor = 'bg-secondary-container';
    badgeClass = 'bg-secondary-container/10 text-secondary-container font-bold';
  } else if (order.status === 'READY') {
    accentColor = 'bg-green-600';
    badgeClass = 'bg-green-100 text-green-800 font-bold';
  }

  const paymentBadge = payment.status === 'PAID'
    ? '<span class="px-sm py-xs rounded-full text-label-sm bg-green-100 text-green-800 font-bold uppercase tracking-wider flex items-center gap-1"><span class="material-symbols-outlined text-xs">paid</span> PAID</span>'
    : '<span class="px-sm py-xs rounded-full text-label-sm bg-amber-100 text-amber-800 font-bold uppercase tracking-wider flex items-center gap-1"><span class="material-symbols-outlined text-xs">payments</span> PAY AT CANTEEN</span>';

  return `
    <div class="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row overflow-hidden group" data-order-id="${order.orderId}">
      <div class="w-full md:w-3 ${accentColor}"></div>
      <div class="p-lg flex-1 flex flex-col justify-between gap-md">
        <!-- Card Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-sm border-b border-outline-variant/30 pb-sm">
          <div class="flex items-center gap-sm flex-wrap">
            ${liveQueuePos ? `<span class="bg-primary text-white text-xs px-2 py-0.5 rounded font-bold">Queue #${liveQueuePos}</span>` : ''}
            <span class="text-headline-sm font-bold text-primary">${order.orderId}</span>
            <span class="px-sm py-xs rounded-full text-label-sm ${badgeClass} uppercase tracking-wider">${order.status}</span>
            ${paymentBadge}
            ${isBulk ? '<span class="px-sm py-xs rounded-full text-label-sm bg-error-container text-error font-bold uppercase tracking-wider flex items-center gap-1"><span class="material-symbols-outlined text-xs">warning</span> BULK ORDER</span>' : ''}
          </div>
          <div class="flex items-center gap-md text-body-sm text-on-surface-variant">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">schedule</span> Smart Prep: ~${order.preparationTime || 8} min</span>
            <span class="bg-surface-variant text-primary px-sm py-xs rounded font-medium">Slot: ${order.pickupSlot || '12:45 – 1:00 PM'}</span>
          </div>
        </div>

        <!-- Card Content Body -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-md items-start">
          <div class="md:col-span-4 bg-surface p-md rounded-lg border border-outline-variant/40">
            <p class="text-label-sm font-semibold text-on-surface-variant uppercase mb-xs">Customer</p>
            <p class="text-body-md font-bold text-primary flex items-center gap-1">
              <span class="material-symbols-outlined text-base">person</span> ${order.studentName || 'Student'}
            </p>
            <p class="text-body-sm text-on-surface-variant">ID: ${order.studentId || 'ST-2024'}</p>
            <p class="text-body-sm text-on-surface-variant mt-xs">Total Items: <strong class="text-primary">${totalQty}</strong></p>
            <p class="text-body-sm text-on-surface-variant mt-xs">Payment: <strong class="${payment.status === 'PAID' ? 'text-green-700' : 'text-amber-700'}">${payment.status === 'PAID' ? 'PAID ONLINE' : 'PAY AT CANTEEN'}</strong></p>
          </div>

          <div class="md:col-span-8 flex flex-col gap-1.5 bg-surface-container-lowest p-sm">
            <p class="text-label-sm font-semibold text-on-surface-variant uppercase mb-xs">Ordered Food Items</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${order.items.map((i) => `
                <div class="flex justify-between items-center p-2 rounded bg-surface border border-outline-variant/30 text-sm">
                  <span class="font-medium text-primary">${i.quantity}x ${i.name}</span>
                  <span class="text-on-surface-variant text-xs">₹${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Card Actions Footer -->
        <div class="flex flex-wrap items-center justify-between gap-md pt-sm border-t border-outline-variant/30">
          <div class="text-body-sm text-on-surface-variant">
            Total: <strong class="text-headline-sm text-primary font-bold">₹${(order.total || 0).toFixed(2)}</strong>
          </div>
          <div class="flex items-center gap-sm ml-auto">
            ${order.status === 'READY' ? `
              <button class="px-md py-sm bg-surface-variant text-primary border border-outline-variant rounded-lg text-label-sm font-semibold hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1" data-simulate-missed="${order.orderId}" title="Trigger manual demo test for uncollected pickup">
                <span class="material-symbols-outlined text-[15px]">science</span> Simulate Missed Pickup (Demo)
              </button>
            ` : ''}
            ${action ? `
              <button class="${action.btnClass} px-lg py-sm rounded-lg text-label-md font-bold transition-all flex items-center gap-2 cursor-pointer" data-action-order="${order.orderId}" data-target-status="${action.nextStatus}">
                <span class="material-symbols-outlined text-sm">${action.icon}</span> ${action.label}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- Render View 3: Inventory Management ---
function renderInventoryView() {
  const store = window.canteeneryStore;
  const menu = store.getMenu();
  const grid = document.getElementById('inventory-cards-grid');
  if (!grid) return;

  grid.innerHTML = menu.map((item) => {
    const inv = Number(item.inventory) || 0;
    let accentBorder = 'bg-green-500';
    let badgeHtml = '<span class="bg-green-100 text-green-800 text-label-sm font-bold px-sm py-xs rounded-full border border-green-200">AVAILABLE</span>';
    let numColor = 'text-on-surface';

    if (inv <= 0) {
      accentBorder = 'bg-gray-400';
      badgeHtml = '<span class="bg-gray-100 text-gray-600 text-label-sm font-bold px-sm py-xs rounded-full border border-gray-200">SOLD OUT</span>';
      numColor = 'text-gray-400';
    } else if (inv <= 5) {
      accentBorder = 'bg-amber-500';
      badgeHtml = '<span class="bg-amber-100 text-amber-800 text-label-sm font-bold px-sm py-xs rounded-full border border-amber-200">LOW STOCK</span>';
      numColor = 'text-amber-600';
    }

    return `
      <div class="bg-surface-container-lowest rounded-lg border border-outline-variant p-md flex flex-col justify-between shadow-[0px_4px_12px_rgba(0,33,71,0.05)] relative overflow-hidden group">
        <div class="absolute left-0 top-0 bottom-0 w-1.5 ${accentBorder}"></div>
        <div class="flex justify-between items-start mb-lg pl-sm">
          <h3 class="text-headline-sm font-bold text-on-surface ${inv === 0 ? 'line-through opacity-60' : ''}">${item.displayName || item.name}</h3>
          ${badgeHtml}
        </div>
        <div class="pl-sm flex flex-col gap-md">
          <div class="flex items-baseline gap-xs">
            <span class="text-display-lg font-display-lg ${numColor}">${inv}</span>
            <span class="text-body-sm font-body-sm text-on-surface-variant">remaining in kitchen</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="flex-1 bg-transparent border border-outline-variant text-primary py-sm rounded text-label-md font-semibold hover:bg-surface-container transition-colors flex items-center justify-center gap-sm cursor-pointer" data-open-inv-modal="${item.id}">
              <span class="material-symbols-outlined text-[18px]">edit</span> Update Stock
            </button>
            <button class="px-3 py-sm border border-outline-variant text-primary rounded hover:bg-surface-container font-bold text-sm cursor-pointer" data-inv-quick-add="${item.id}" title="Quick +5">
              +5
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach inventory listeners
  const openModalBtns = grid.querySelectorAll('[data-open-inv-modal]');
  openModalBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-open-inv-modal');
      openInventoryModal(itemId);
    });
  });

  const quickAddBtns = grid.querySelectorAll('[data-inv-quick-add]');
  quickAddBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-inv-quick-add');
      store.updateInventory(itemId, 5);
      if (window.showToast) {
        const item = store.getMenuItem(itemId);
        window.showToast(`Restocked +5 ${item.displayName || item.name}`, 'success');
      }
    });
  });
}

// --- Render View 4: Bulk Orders ---
function renderBulkView() {
  const store = window.canteeneryStore;
  const orders = store.getOrders();
  const bulkList = document.getElementById('bulk-orders-list');
  if (!bulkList) return;

  const bulkOrders = orders.filter((o) => store.isBulkOrder(o));

  if (bulkOrders.length === 0) {
    bulkList.innerHTML = `
      <div class="p-2xl text-center flex flex-col items-center justify-center text-on-surface-variant gap-sm bg-surface-container-lowest rounded-xl border border-outline-variant">
        <span class="material-symbols-outlined text-5xl text-outline-variant">assignment</span>
        <p class="text-headline-sm font-semibold text-primary">No bulk orders detected</p>
        <p class="text-body-sm">Orders exceeding 15 total items or large single-item volumes will automatically populate here.</p>
      </div>
    `;
    return;
  }

  const workload = store.calculateKitchenWorkload();

  bulkList.innerHTML = bulkOrders.map((order) => {
    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
    const itemsDescription = order.items.map((i) => `${i.quantity} × ${i.name}`).join(', ');
    const isCompleted = ['COLLECTED', 'READY'].includes(order.status);

    return `
      <div class="relative overflow-hidden rounded-xl bg-surface-container-lowest border border-error/20 shadow-[0px_4px_12px_rgba(0,33,71,0.05)]">
        <!-- Status Accent Bar -->
        <div class="absolute left-0 top-0 bottom-0 w-2.5 bg-error"></div>
        <div class="p-lg pl-xl flex flex-col lg:flex-row gap-lg justify-between items-start lg:items-center relative z-10 bg-gradient-to-r from-error/5 to-transparent">
          <div class="flex-1 space-y-md">
            <div class="flex items-center gap-sm flex-wrap">
              <span class="material-symbols-outlined text-error">warning</span>
              <span class="text-label-sm font-label-sm text-error bg-error-container px-2 py-1 rounded-full uppercase tracking-wider font-bold">Bulk Order Detected</span>
              <span class="text-label-md font-bold text-primary">${order.orderId}</span>
              <span class="text-label-sm bg-surface-variant px-2 py-0.5 rounded text-on-surface-variant font-medium">${order.studentName} (${order.studentId || 'Org'})</span>
            </div>
            <p class="text-headline-sm font-headline-sm text-on-surface font-bold">
              ${itemsDescription}
            </p>
            <div class="flex items-center gap-lg flex-wrap">
              <p class="text-body-md font-body-md text-on-surface-variant">
                <strong class="text-on-surface">Total Items:</strong> ${totalQty}
              </p>
              <p class="text-body-md font-body-md text-error flex items-center gap-xs font-semibold">
                <span class="material-symbols-outlined text-[18px]">priority_high</span>
                This order significantly impacts kitchen preparation load.
              </p>
            </div>
          </div>

          <!-- Metrics Bento Cell -->
          <div class="bg-surface-container-low rounded-lg p-md border border-outline-variant/30 flex flex-col gap-sm min-w-[260px] w-full lg:w-auto">
            <h4 class="text-label-md font-label-md text-primary font-bold flex items-center gap-xs">
              <span class="material-symbols-outlined text-[18px]">schedule</span> Smart Scheduling
            </h4>
            <div class="grid grid-cols-2 gap-md">
              <div>
                <p class="text-label-sm font-label-sm text-on-surface-variant">Prep Time</p>
                <p class="text-headline-sm font-headline-sm text-on-surface font-bold">~${order.preparationTime || 35} min</p>
              </div>
              <div>
                <p class="text-label-sm font-label-sm text-on-surface-variant">Kitchen Load</p>
                <div class="flex items-center gap-sm">
                  <p class="text-headline-sm font-headline-sm ${workload.levelColor} font-bold">${workload.percentage}%</p>
                </div>
              </div>
            </div>
            <div class="pt-sm border-t border-outline-variant/30">
              <p class="text-label-sm font-label-sm text-on-surface-variant">Recommended Pickup</p>
              <p class="text-body-md font-body-md text-primary font-bold">${order.pickupSlot || '1:30 – 1:50 PM'}</p>
            </div>
          </div>
        </div>

        <!-- Actions Bar -->
        <div class="bg-surface-container-low border-t border-outline-variant/30 p-md pl-xl flex flex-wrap gap-md justify-end items-center">
          <span class="text-body-sm text-on-surface-variant mr-auto font-medium">Status: <strong class="text-primary font-bold">${order.status}</strong></span>
          <button class="px-lg py-sm bg-surface-container-lowest text-primary border border-outline-variant rounded-lg text-label-md font-medium hover:bg-surface-variant transition-colors shadow-[0px_4px_12px_rgba(0,33,71,0.05)] cursor-pointer" data-contact-student="${order.orderId}">
            Contact Student
          </button>
          <button class="px-lg py-sm bg-surface-container-lowest text-primary border border-outline-variant rounded-lg text-label-md font-medium hover:bg-surface-variant transition-colors shadow-[0px_4px_12px_rgba(0,33,71,0.05)] cursor-pointer" data-split-order="${order.orderId}">
            Split Order
          </button>
          ${!isCompleted ? `
            <button class="px-lg py-sm bg-secondary-container text-white rounded-lg text-label-md font-bold hover:bg-secondary transition-colors shadow-[0px_4px_12px_rgba(253,118,26,0.2)] cursor-pointer" data-action-order="${order.orderId}" data-target-status="${order.status === 'PLACED' ? 'ACCEPTED' : (order.status === 'ACCEPTED' ? 'PREPARING' : 'READY')}">
              ${order.status === 'PLACED' ? 'Accept & Schedule' : (order.status === 'ACCEPTED' ? 'Start Preparing' : 'Mark Ready')}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Bulk action handlers
  const contactBtns = bulkList.querySelectorAll('[data-contact-student]');
  contactBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-contact-student');
      if (window.showToast) {
        window.showToast(`SMS & App notification sent to student for order ${orderId}`, 'info');
      }
    });
  });

  const splitBtns = bulkList.querySelectorAll('[data-split-order]');
  splitBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-split-order');
      if (window.showToast) {
        window.showToast(`Order ${orderId} split into 2 kitchen sub-batches for parallel prep!`, 'success');
      }
    });
  });

  attachOrderActionListeners(bulkList);
}

// --- Render View 5: Uncollected & Holding Orders ---
function renderUncollectedView() {
  const store = window.canteeneryStore;
  const orders = store.getOrders();
  const uncollectedList = document.getElementById('uncollected-orders-list');
  if (!uncollectedList) return;

  // Uncollected orders are those with status NOT_COLLECTED, HOLDING, or READY that have missed their window
  const list = orders.filter((o) => ['NOT_COLLECTED', 'HOLDING'].includes(o.status));

  if (list.length === 0) {
    uncollectedList.innerHTML = `
      <div class="p-2xl text-center flex flex-col items-center justify-center text-on-surface-variant gap-sm bg-surface-container-lowest rounded-xl border border-outline-variant">
        <span class="material-symbols-outlined text-5xl text-outline-variant">inventory</span>
        <p class="text-headline-sm font-semibold text-primary">No uncollected orders</p>
        <p class="text-body-sm">All prepared orders were collected promptly by students.</p>
      </div>
    `;
    return;
  }

  uncollectedList.innerHTML = list.map((order) => {
    const isHolding = order.status === 'HOLDING';
    const statusBadge = isHolding
      ? '<span class="bg-secondary text-on-secondary text-label-sm font-bold px-2.5 py-1 rounded-full">HOLDING</span>'
      : '<span class="bg-error-container text-on-error-container text-label-sm font-bold px-2.5 py-1 rounded-full border border-error">NOT COLLECTED</span>';

    const accentColor = isHolding ? 'bg-secondary-container' : 'bg-error';

    return `
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col md:flex-row relative group">
        <!-- Status Accent Bar -->
        <div class="w-2 md:w-4 ${accentColor} flex-shrink-0"></div>
        <div class="flex-1 p-lg flex flex-col justify-between gap-md">
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-md mb-sm">
            <div>
              <div class="flex items-center gap-sm mb-xs">
                <h2 class="text-headline-md font-headline-md font-bold text-on-surface">${order.orderId}</h2>
                ${statusBadge}
              </div>
              <div class="flex flex-wrap items-center gap-md text-body-sm font-body-sm text-on-surface-variant mt-1">
                <div class="flex items-center gap-xs">
                  <span class="material-symbols-outlined text-[16px]">schedule</span>
                  <span>Ready since: <strong>${order.readySince || '12:15 PM'}</strong></span>
                </div>
                <div class="flex items-center gap-xs">
                  <span class="material-symbols-outlined text-[16px]">alarm</span>
                  <span>Pickup Slot: <strong>${order.pickupSlot || '12:15 – 12:30'}</strong></span>
                </div>
              </div>
              <div class="mt-2 text-sm text-primary font-medium">
                ${order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
              </div>
            </div>

            <!-- Customer Info Snippet -->
            <div class="bg-surface rounded-lg p-md border border-outline-variant min-w-[220px]">
              <p class="text-label-sm font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider font-semibold">Student Details</p>
              <p class="text-body-md font-body-md font-bold text-on-surface">${order.studentName || 'Student'}</p>
              <p class="text-body-sm font-body-sm text-on-surface-variant">ID: ${order.studentId || '20239012'}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center gap-md pt-md border-t border-outline-variant">
            <button class="bg-primary text-on-primary px-lg py-sm rounded-lg text-label-md font-semibold flex items-center gap-sm hover:opacity-90 transition-opacity cursor-pointer" data-notify-student="${order.orderId}">
              <span class="material-symbols-outlined text-[18px]">notifications_active</span> Notify Student
            </button>
            ${!isHolding ? `
              <button class="bg-surface-container-lowest border border-outline px-lg py-sm rounded-lg text-primary text-label-md font-semibold flex items-center gap-sm hover:bg-surface-container-low transition-colors cursor-pointer" data-action-order="${order.orderId}" data-target-status="HOLDING">
                <span class="material-symbols-outlined text-[18px]">move_to_inbox</span> Move to Holding
              </button>
            ` : `
              <button class="bg-green-600 text-white px-lg py-sm rounded-lg text-label-md font-semibold flex items-center gap-sm hover:bg-green-700 transition-colors cursor-pointer" data-action-order="${order.orderId}" data-target-status="COLLECTED">
                <span class="material-symbols-outlined text-[18px]">done_all</span> Mark Collected
              </button>
            `}
            <button class="bg-surface-container-lowest border border-error text-error px-lg py-sm rounded-lg text-label-md font-semibold flex items-center gap-sm hover:bg-error-container transition-colors ml-auto cursor-pointer" data-discard-order="${order.orderId}">
              <span class="material-symbols-outlined text-[18px]">cancel</span> ${isHolding ? 'Discard Order' : 'Mark Uncollected'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Action listeners for uncollected view
  const notifyBtns = uncollectedList.querySelectorAll('[data-notify-student]');
  notifyBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-notify-student');
      if (window.showToast) {
        window.showToast(`Urgent pickup reminder broadcast to student for ${orderId}`, 'warning');
      }
    });
  });

  const discardBtns = uncollectedList.querySelectorAll('[data-discard-order]');
  discardBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-discard-order');
      store.updateOrderStatus(orderId, 'DISCARDED');
      if (window.showToast) {
        window.showToast(`Order ${orderId} moved to archival records.`, 'info');
      }
    });
  });

  attachOrderActionListeners(uncollectedList);
}

// --- Attach Action Event Listeners for Order Transition Buttons ---
function attachOrderActionListeners(container) {
  const store = window.canteeneryStore;

  const actionButtons = container.querySelectorAll('[data-action-order]');
  actionButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const orderId = btn.getAttribute('data-action-order');
      const targetStatus = btn.getAttribute('data-target-status');

      if (orderId && targetStatus) {
        const success = store.updateOrderStatus(orderId, targetStatus);
        if (success) {
          if (window.showToast) {
            window.showToast(`Order ${orderId} updated to ${targetStatus}!`, 'success');
          }
        }
      }
    });
  });

  const simulateBtns = container.querySelectorAll('[data-simulate-missed]');
  simulateBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const orderId = btn.getAttribute('data-simulate-missed');
      store.simulateMissedPickup(orderId);
      if (window.showToast) {
        window.showToast(`Demo: Missed pickup window triggered for ${orderId}`, 'warning');
      }
    });
  });
}

// --- Modal for Updating Inventory ---
function initInventoryModal() {
  const modal = document.getElementById('inventory-update-modal');
  const closeBtn = document.getElementById('close-inv-modal-btn');
  const saveBtn = document.getElementById('save-inv-modal-btn');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  if (saveBtn && modal) {
    saveBtn.addEventListener('click', () => {
      const itemId = document.getElementById('inv-modal-item-id').value;
      const qty = document.getElementById('inv-modal-quantity-input').value;
      if (itemId) {
        window.canteeneryStore.setInventory(itemId, qty);
        modal.classList.add('hidden');
        if (window.showToast) {
          const item = window.canteeneryStore.getMenuItem(itemId);
          window.showToast(`Inventory updated for ${item ? (item.displayName || item.name) : itemId}`, 'success');
        }
      }
    });
  }
}

function openInventoryModal(itemId) {
  const store = window.canteeneryStore;
  const item = store.getMenuItem(itemId);
  if (!item) return;

  const modal = document.getElementById('inventory-update-modal');
  const titleEl = document.getElementById('inv-modal-item-name');
  const idInput = document.getElementById('inv-modal-item-id');
  const qtyInput = document.getElementById('inv-modal-quantity-input');

  if (titleEl) titleEl.textContent = item.displayName || item.name;
  if (idInput) idInput.value = item.id;
  if (qtyInput) qtyInput.value = item.inventory;

  if (modal) modal.classList.remove('hidden');
}

// =========================================================================
// VIEW 6: MENU MANAGEMENT & ADMIN DISH ACTIONS
// =========================================================================

let pendingRemoveItemId = null;

function renderMenuManagementView() {
  const store = window.canteeneryStore;
  const menu = store.getMenu();
  const grid = document.getElementById('admin-menu-items-grid');
  if (!grid) return;

  if (menu.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center bg-surface-container-lowest rounded-xl border border-outline-variant p-xl">
        <span class="material-symbols-outlined text-4xl text-outline mb-2">restaurant_menu</span>
        <h3 class="text-headline-sm font-semibold text-primary">No dishes on the menu</h3>
        <p class="text-body-md text-on-surface-variant mt-1">Click "+ Add New Dish" above to create your first canteen menu item.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = menu.map((item) => {
    const inv = Number(item.inventory) || 0;
    const isAvail = item.isAvailable !== false && item.available !== false;

    let badgeHtml = '';
    if (!isAvail) {
      badgeHtml = '<span class="bg-gray-200 text-gray-700 border border-gray-300 text-label-sm font-bold px-2 py-0.5 rounded-full">UNAVAILABLE</span>';
    } else if (inv <= 0) {
      badgeHtml = '<span class="bg-red-100 text-red-700 border border-red-200 text-label-sm font-bold px-2 py-0.5 rounded-full">SOLD OUT</span>';
    } else if (inv <= 5) {
      badgeHtml = `<span class="bg-amber-100 text-amber-800 border border-amber-200 text-label-sm font-bold px-2 py-0.5 rounded-full">LOW STOCK (${inv})</span>`;
    } else {
      badgeHtml = `<span class="bg-green-100 text-green-800 border border-green-200 text-label-sm font-bold px-2 py-0.5 rounded-full">AVAILABLE (${inv})</span>`;
    }

    const fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
    const displayImg = item.image && item.image.trim().length > 0 ? item.image : fallbackImg;

    return `
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
        <div>
          <!-- Card Image & Dietary Header -->
          <div class="relative h-44 w-full overflow-hidden bg-surface-container">
            <img src="${displayImg}" alt="${item.displayName || item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='${fallbackImg}'" />
            <div class="absolute top-2 right-2 bg-surface-container-lowest p-1 rounded shadow-sm flex items-center justify-center">
              <span class="material-symbols-outlined text-[16px] ${item.isVeg ? 'text-[#166534]' : 'text-red-600'}">fiber_manual_record</span>
              <span class="sr-only">${item.isVeg ? 'Veg' : 'Non-Veg'}</span>
            </div>
            <div class="absolute top-2 left-2">
              <span class="bg-primary/85 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                ${item.category || 'Snacks'}
              </span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-md space-y-sm">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="text-headline-sm font-bold text-on-surface line-clamp-1 ${!isAvail ? 'line-through text-outline' : ''}">${item.displayName || item.name}</h4>
                <p class="text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">${item.description || 'Freshly prepared daily in the canteen.'}</p>
              </div>
              <span class="text-headline-sm font-bold text-secondary-container shrink-0 ml-2">₹${item.price}</span>
            </div>

            <div class="flex items-center justify-between text-xs pt-2 border-t border-outline-variant/30">
              <span class="flex items-center gap-1 text-on-surface-variant font-medium">
                <span class="material-symbols-outlined text-[16px]">schedule</span> Prep: <strong>${item.preparationTime || 5} min</strong>
              </span>
              <div>${badgeHtml}</div>
            </div>
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div class="p-md pt-0 flex items-center justify-between gap-2 border-t border-outline-variant/20 pt-sm mt-sm">
          <button class="px-2.5 py-1 text-xs rounded border border-outline-variant font-semibold ${isAvail ? 'text-amber-800 bg-amber-50 hover:bg-amber-100' : 'text-green-800 bg-green-50 hover:bg-green-100'} transition-colors cursor-pointer" data-toggle-avail="${item.id}">
            ${isAvail ? 'Mark Unavailable' : 'Mark Available'}
          </button>
          <div class="flex items-center gap-2">
            <button class="px-3 py-1 bg-surface-container hover:bg-surface-variant text-primary rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer" data-edit-dish="${item.id}">
              <span class="material-symbols-outlined text-[15px]">edit</span> Edit
            </button>
            <button class="px-3 py-1 bg-red-50 hover:bg-red-100 text-error rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-error/20" data-remove-dish="${item.id}">
              <span class="material-symbols-outlined text-[15px]">delete</span> Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach Menu Management Event Listeners
  const editBtns = grid.querySelectorAll('[data-edit-dish]');
  editBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-edit-dish');
      openDishModal(itemId);
    });
  });

  const removeBtns = grid.querySelectorAll('[data-remove-dish]');
  removeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-remove-dish');
      openRemoveDishModal(itemId);
    });
  });

  const toggleBtns = grid.querySelectorAll('[data-toggle-avail]');
  toggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-toggle-avail');
      const res = store.toggleMenuItemAvailability(itemId);
      if (res && window.showToast) {
        window.showToast(res.message, 'info');
      }
    });
  });
}

function initDishModal() {
  const addBtns = document.querySelectorAll('[data-action="open-add-dish"], #add-new-dish-btn');
  const modal = document.getElementById('dish-modal');
  const closeBtn = document.getElementById('close-dish-modal-btn');
  const cancelBtn = document.getElementById('cancel-dish-modal-btn');
  const form = document.getElementById('dish-modal-form');
  const imageInput = document.getElementById('dish-modal-image');
  const imgPreview = document.getElementById('dish-modal-img-preview');

  addBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openDishModal();
    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (cancelBtn && modal) {
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (imageInput && imgPreview) {
    imageInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      imgPreview.src = url.length > 0 ? url : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
    });
  }

  if (form && modal) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const store = window.canteeneryStore;
      const itemId = document.getElementById('dish-modal-id').value;
      const name = document.getElementById('dish-modal-name').value.trim();
      const desc = document.getElementById('dish-modal-desc').value.trim();
      const category = document.getElementById('dish-modal-category').value;
      const isVeg = document.getElementById('dish-modal-veg').value === 'true';
      const price = parseFloat(document.getElementById('dish-modal-price').value) || 0;
      const prepTime = parseInt(document.getElementById('dish-modal-prep').value, 10) || 5;
      const stock = parseInt(document.getElementById('dish-modal-stock').value, 10) || 0;
      const isAvail = document.getElementById('dish-modal-available').value === 'true';
      const image = document.getElementById('dish-modal-image').value.trim();

      if (!name) {
        if (window.showToast) window.showToast('Please enter a dish name.', 'error');
        return;
      }

      if (itemId) {
        // Edit existing dish
        const res = store.updateMenuItem(itemId, {
          name,
          description: desc,
          category,
          isVeg,
          price,
          preparationTime: prepTime,
          inventory: stock,
          isAvailable: isAvail,
          image
        });
        if (res.success) {
          modal.classList.add('hidden');
          if (window.showToast) window.showToast(`Updated "${name}" successfully!`, 'success');
        }
      } else {
        // Add new dish
        const res = store.addMenuItem({
          name,
          description: desc,
          category,
          isVeg,
          price,
          preparationTime: prepTime,
          inventory: stock,
          isAvailable: isAvail,
          image
        });
        if (res.success) {
          modal.classList.add('hidden');
          if (window.showToast) window.showToast(`Added "${name}" to canteen menu!`, 'success');
        }
      }
    });
  }
}

function openDishModal(itemId = null) {
  const store = window.canteeneryStore;
  const modal = document.getElementById('dish-modal');
  const titleEl = document.getElementById('dish-modal-title');
  const saveBtnText = document.getElementById('save-dish-btn-text');
  const idInput = document.getElementById('dish-modal-id');
  const nameInput = document.getElementById('dish-modal-name');
  const descInput = document.getElementById('dish-modal-desc');
  const catInput = document.getElementById('dish-modal-category');
  const vegInput = document.getElementById('dish-modal-veg');
  const priceInput = document.getElementById('dish-modal-price');
  const prepInput = document.getElementById('dish-modal-prep');
  const stockInput = document.getElementById('dish-modal-stock');
  const availInput = document.getElementById('dish-modal-available');
  const imageInput = document.getElementById('dish-modal-image');
  const imgPreview = document.getElementById('dish-modal-img-preview');

  if (!modal) return;

  if (itemId) {
    const item = store.getMenuItem(itemId);
    if (!item) return;
    titleEl.textContent = 'Edit Dish';
    saveBtnText.textContent = 'Save Changes';
    idInput.value = item.id;
    nameInput.value = item.displayName || item.name;
    descInput.value = item.description || '';
    catInput.value = item.category || 'Snacks';
    vegInput.value = item.isVeg !== undefined ? String(item.isVeg) : (item.category === 'Non-Veg' ? 'false' : 'true');
    priceInput.value = item.price;
    prepInput.value = item.preparationTime || 5;
    stockInput.value = item.inventory;
    availInput.value = item.isAvailable === false ? 'false' : 'true';
    imageInput.value = item.image || '';
    imgPreview.src = item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
  } else {
    titleEl.textContent = 'Add New Dish';
    saveBtnText.textContent = 'Add Dish';
    idInput.value = '';
    nameInput.value = '';
    descInput.value = '';
    catInput.value = 'Snacks';
    vegInput.value = 'true';
    priceInput.value = '60';
    prepInput.value = '8';
    stockInput.value = '15';
    availInput.value = 'true';
    imageInput.value = '';
    imgPreview.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
  }

  modal.classList.remove('hidden');
}

function initRemoveDishModal() {
  const modal = document.getElementById('remove-dish-modal');
  const cancelBtn = document.getElementById('cancel-remove-dish-btn');
  const confirmBtn = document.getElementById('confirm-remove-dish-btn');

  if (cancelBtn && modal) {
    cancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      pendingRemoveItemId = null;
    });
  }

  if (confirmBtn && modal) {
    confirmBtn.addEventListener('click', () => {
      if (pendingRemoveItemId) {
        const store = window.canteeneryStore;
        const res = store.removeMenuItem(pendingRemoveItemId);
        modal.classList.add('hidden');
        if (res.success && window.showToast) {
          window.showToast(res.message, 'success');
        }
        pendingRemoveItemId = null;
      }
    });
  }
}

function openRemoveDishModal(itemId) {
  const store = window.canteeneryStore;
  const item = store.getMenuItem(itemId);
  if (!item) return;

  pendingRemoveItemId = itemId;
  const modal = document.getElementById('remove-dish-modal');
  const nameEl = document.getElementById('remove-dish-name');

  if (nameEl) nameEl.textContent = `"${item.displayName || item.name}"`;
  if (modal) modal.classList.remove('hidden');
}
