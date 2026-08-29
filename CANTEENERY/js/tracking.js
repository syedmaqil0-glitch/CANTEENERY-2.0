/**
 * Canteenery - Live Order Tracking & Status Engine Logic (Phase 3)
 */

document.addEventListener('DOMContentLoaded', () => {
  initTrackingPage();
});

const STATUS_STAGES = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED'];

const STATUS_CONFIG = {
  PLACED: {
    title: 'Order Placed & Queued',
    desc: 'Your pre-order has been received by the canteen. Waiting for kitchen acceptance.',
    icon: 'receipt_long',
    progress: 20
  },
  ACCEPTED: {
    title: 'Order Accepted by Kitchen',
    desc: 'The kitchen staff confirmed your order and scheduled it for cooking.',
    icon: 'thumb_up',
    progress: 40
  },
  PREPARING: {
    title: 'Currently in the Kitchen',
    desc: 'Our chefs are cooking your meal. It will be ready right on time for your slot!',
    icon: 'soup_kitchen',
    progress: 65
  },
  READY: {
    title: 'Ready for Pickup!',
    desc: 'Your food is packed and waiting for you at the counter. Show this screen for collection.',
    icon: 'check_circle',
    progress: 90
  },
  COLLECTED: {
    title: 'Order Collected - Enjoy Your Meal!',
    desc: 'You have collected your order. Thank you for ordering smart with Canteenery!',
    icon: 'done_all',
    progress: 100
  },
  NOT_COLLECTED: {
    title: 'Pickup Window Missed - In Holding',
    desc: 'Your pickup slot ended. Your food is being held safely at the Holding Counter for 15 minutes.',
    icon: 'schedule',
    progress: 90
  },
  HOLDING: {
    title: 'Order in Warm Holding Counter',
    desc: 'Your food is placed in the holding area. Please collect it immediately to avoid disposal.',
    icon: 'inventory',
    progress: 90
  },
  DISCARDED: {
    title: 'Order Discarded & Closed',
    desc: 'The pickup window ended without collection. The kitchen has closed this order and items have been discarded.',
    icon: 'cancel',
    progress: 100
  }
};

function initTrackingPage() {
  if (!window.canteeneryStore) return;

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');

  let order = null;
  if (orderId) {
    order = window.canteeneryStore.getOrder(orderId);
  } else {
    const activeId = window.canteeneryStore.getActiveOrderId();
    if (activeId) {
      order = window.canteeneryStore.getOrder(activeId);
    }
  }

  // If orderId was specifically passed in URL but does not match any order
  if (orderId && !order) {
    renderTrackingNotFound(orderId);
    return;
  }

  // Fallback demo order only if none placed yet and no specific orderId requested
  if (!order) {
    const orders = window.canteeneryStore.getOrders();
    if (orders.length > 0) {
      order = orders[0];
    } else {
      renderTrackingNotFound(orderId || 'Active Order');
      return;
    }
  }

  renderTracking(order);

  // Re-render on store update (same tab or from server sync)
  window.canteeneryStore.subscribe('order-updated', (updatedOrder) => {
    if (updatedOrder && order && updatedOrder.orderId === order.orderId) {
      order = updatedOrder;
      renderTracking(updatedOrder);
    }
  });

  // Re-render on cross-tab storage changes or background polling sync
  window.canteeneryStore.subscribe('orders-changed', () => {
    if (order) {
      const updated = window.canteeneryStore.getOrder(order.orderId);
      if (updated) {
        order = updated;
        renderTracking(updated);
      }
    }
  });

  // Modal toggle for order details
  const viewDetailsBtn = document.getElementById('view-order-details-btn');
  const detailsModal = document.getElementById('order-details-modal');
  const closeDetailsBtn = document.getElementById('close-details-modal-btn');

  if (viewDetailsBtn && detailsModal) {
    viewDetailsBtn.addEventListener('click', () => {
      detailsModal.classList.remove('hidden');
    });
  }
  if (closeDetailsBtn && detailsModal) {
    closeDetailsBtn.addEventListener('click', () => {
      detailsModal.classList.add('hidden');
    });
  }
}

function renderTracking(order) {
  const currentStatus = order.status || 'PLACED';
  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.PLACED;
  const currentStageIndex = STATUS_STAGES.indexOf(currentStatus);

  // Order Title & Subtitle
  const orderIdHeader = document.getElementById('tracking-order-id-header');
  if (orderIdHeader) orderIdHeader.textContent = `Order ${order.orderId}`;

  // Current Status Card
  const statusTitle = document.getElementById('current-status-title');
  if (statusTitle) statusTitle.textContent = config.title;

  const statusDesc = document.getElementById('current-status-desc');
  if (statusDesc) statusDesc.textContent = config.desc;

  const statusIcon = document.getElementById('current-status-icon');
  if (statusIcon) statusIcon.textContent = config.icon;

  const progressPercent = document.getElementById('tracking-progress-percent');
  if (progressPercent) progressPercent.textContent = `${config.progress}%`;

  const progressBarFill = document.getElementById('tracking-progress-fill');
  if (progressBarFill) {
    setTimeout(() => {
      progressBarFill.style.width = `${config.progress}%`;
    }, 150);
  }

  // Timeline rendering
  const timelineContainer = document.getElementById('tracking-timeline-container');
  if (timelineContainer) {
    timelineContainer.innerHTML = STATUS_STAGES.map((stage, idx) => {
      let isPast = false;
      let isCurrent = false;

      if (currentStatus === 'DISCARDED') {
        isPast = idx <= 3;
        isCurrent = false;
      } else if (currentStageIndex === -1) {
        // e.g. HOLDING or NOT_COLLECTED (happens after READY)
        isPast = idx <= 3;
        isCurrent = idx === 3;
      } else {
        isPast = idx < currentStageIndex;
        isCurrent = idx === currentStageIndex;
      }

      let iconCircle = '';
      let textClass = '';
      let subtext = '';

      if (currentStatus === 'DISCARDED' && idx === 4) {
        iconCircle = `
          <div class="absolute -left-[35px] top-0 w-6 h-6 rounded-full bg-error flex items-center justify-center z-10 text-white shadow-sm">
            <span class="material-symbols-outlined text-sm">close</span>
          </div>
        `;
        textClass = 'text-error font-semibold';
        subtext = '<p class="text-label-sm font-label-sm text-error font-semibold">Discarded by Kitchen</p>';
      } else if (isPast) {
        iconCircle = `
          <div class="absolute -left-[35px] top-0 w-6 h-6 rounded-full bg-surface-tint flex items-center justify-center z-10 text-on-primary shadow-sm">
            <span class="material-symbols-outlined text-sm">check</span>
          </div>
        `;
        textClass = 'text-primary font-semibold';
        subtext = '<p class="text-label-sm font-label-sm text-on-surface-variant">Completed</p>';
      } else if (isCurrent) {
        iconCircle = `
          <div class="absolute -left-[35px] top-0 w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center z-10 text-on-secondary-container ring-4 ring-secondary-container/20 shadow-sm">
            <div class="w-2 h-2 rounded-full bg-on-secondary-container"></div>
          </div>
        `;
        textClass = 'text-secondary-container font-bold';
        subtext = '<p class="text-label-sm font-label-sm text-secondary-container font-bold">Current Phase</p>';
      } else {
        iconCircle = `
          <div class="absolute -left-[35px] top-0 w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center z-10 border-2 border-surface-container-highest"></div>
        `;
        textClass = 'text-on-surface-variant font-normal';
        subtext = '';
      }

      const stageLabels = {
        PLACED: 'Placed',
        ACCEPTED: 'Accepted',
        PREPARING: 'Preparing',
        READY: 'Ready',
        COLLECTED: 'Collected'
      };

      return `
        <div class="relative">
          ${iconCircle}
          <p class="text-body-md font-body-md ${textClass}">${stageLabels[stage]}</p>
          ${subtext}
        </div>
      `;
    }).join('');
  }

  // Live Queue Position
  const queuePosEl = document.getElementById('tracking-queue-pos');
  if (queuePosEl && window.canteeneryStore) {
    const pos = window.canteeneryStore.calculateQueuePosition(order.orderId);
    if (pos !== null) {
      queuePosEl.textContent = `#${pos}`;
    } else if (currentStatus === 'READY') {
      queuePosEl.textContent = 'Ready';
    } else if (currentStatus === 'COLLECTED') {
      queuePosEl.textContent = 'Done';
    } else {
      queuePosEl.textContent = '-';
    }
  }

  // Live Kitchen Workload
  const kitchenLoadEl = document.getElementById('tracking-kitchen-load');
  if (kitchenLoadEl && window.canteeneryStore) {
    const workload = window.canteeneryStore.calculateKitchenWorkload();
    kitchenLoadEl.textContent = `${workload.percentage}%`;
  }

  // Summary Card Info
  const locationEl = document.getElementById('tracking-pickup-location');
  if (locationEl) locationEl.textContent = order.pickupLocation || 'Main Canteen - Block A';

  const prepTimeEl = document.getElementById('tracking-est-prep-time');
  if (prepTimeEl) prepTimeEl.textContent = `~${order.preparationTime || 10} Mins`;

  const totalItemsEl = document.getElementById('tracking-total-items-count');
  if (totalItemsEl && order.items) {
    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
    totalItemsEl.textContent = String(totalQty);
  }

  const pickupSlotEl = document.getElementById('tracking-pickup-slot-info');
  if (pickupSlotEl) pickupSlotEl.textContent = order.pickupSlot || '12:45 PM – 1:00 PM';

  // Payment Status Badge
  const paymentBadgeEl = document.getElementById('tracking-payment-badge');
  const payment = order.payment || { method: 'CASH', status: 'PENDING', amount: order.total || 0 };
  if (paymentBadgeEl) {
    if (payment.status === 'PAID') {
      paymentBadgeEl.className = 'font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border border-green-200';
      paymentBadgeEl.innerHTML = `<span class="material-symbols-outlined text-[13px]">paid</span> PAID (${payment.subMethod ? payment.subMethod.split(' ')[0] : 'Online'})`;
    } else {
      paymentBadgeEl.className = 'font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border border-amber-200';
      paymentBadgeEl.innerHTML = '<span class="material-symbols-outlined text-[13px]">payments</span> PAY AT CANTEEN';
    }
  }

  // Smart Queue Explanation in tracking
  const explanationEl = document.getElementById('tracking-explanation-list');
  if (explanationEl) {
    const explanations = order.explanation || [
      'Orders ahead in queue calculated dynamically',
      'Kitchen workload factored into preparation window',
      `Estimated preparation time: ${order.preparationTime || 10} min`,
      'All items verified in stock'
    ];
    explanationEl.innerHTML = explanations.map(exp => `
      <li class="flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[14px] text-green-600">check</span>
        <span>${exp}</span>
      </li>
    `).join('');
  }

  // Details Modal Content
  const modalItemsList = document.getElementById('modal-order-items-list');
  if (modalItemsList && order.items) {
    modalItemsList.innerHTML = order.items.map(item => `
      <div class="flex justify-between py-2 border-b border-outline-variant/30 text-sm">
        <span>${item.quantity}x ${item.name}</span>
        <span class="font-semibold">₹${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');
  }

  const modalTotal = document.getElementById('modal-order-total');
  if (modalTotal) modalTotal.textContent = `₹${(order.total || 0).toFixed(2)}`;

  const modalPaymentMethodText = document.getElementById('modal-payment-method-text');
  if (modalPaymentMethodText) {
    if (payment.status === 'PAID') {
      modalPaymentMethodText.textContent = `Paid Online (${payment.subMethod || 'UPI'}) · ${payment.transactionId || 'TXN-CONFIRMED'}`;
      modalPaymentMethodText.className = 'font-semibold text-green-700';
    } else {
      modalPaymentMethodText.textContent = 'Pay at Canteen Counter (Cash / UPI)';
      modalPaymentMethodText.className = 'font-semibold text-amber-700';
    }
  }
}

function renderTrackingNotFound(orderId) {
  const mainEl = document.querySelector('main');
  if (!mainEl) return;

  mainEl.innerHTML = `
    <div class="max-w-2xl mx-auto px-4 py-16 text-center flex flex-col items-center">
      <div class="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center mb-md">
        <span class="material-symbols-outlined text-[36px]">search_off</span>
      </div>
      <h1 class="font-headline-md text-headline-md font-bold text-on-surface mb-xs">Order Not Found</h1>
      <p class="font-body-md text-body-md text-on-surface-variant mb-lg">
        We couldn't find order details for <strong class="text-primary">${orderId || 'this identifier'}</strong>. Please verify the link or return to the menu to place a new order.
      </p>
      <div class="flex gap-md">
        <a href="menu.html" class="bg-primary text-white px-6 py-3 rounded-lg font-label-md hover:bg-primary-container transition-colors flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">restaurant_menu</span> Browse Menu
        </a>
        <a href="kitchen.html" class="bg-surface-variant text-primary px-6 py-3 rounded-lg font-label-md hover:bg-surface-container-high transition-colors flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">kitchen</span> Kitchen Dashboard
        </a>
      </div>
    </div>
  `;
}
