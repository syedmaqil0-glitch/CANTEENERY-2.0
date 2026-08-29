/**
 * Canteenery - Global Application UI Scripts & Helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCartBadges();
  initHomePageLiveStatus();
  initToastContainer();
});

function initNavigation() {
  // Update Cart icon buttons to navigate to checkout.html
  const cartButtons = document.querySelectorAll('[data-action="view-cart"], button:has([data-icon="shopping_cart"]), button:has(.material-symbols-outlined:contains("shopping_cart"))');
  cartButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // If inside a form or specific action, let it be handled, otherwise navigate to checkout
      if (!btn.closest('article') && !btn.closest('.item-card')) {
        e.preventDefault();
        window.location.href = 'checkout.html';
      }
    });
  });

  // Mobile menu toggle
  const mobileMenuBtns = document.querySelectorAll('[data-action="toggle-mobile-menu"], button:has([data-icon="menu"])');
  const mobileNav = document.getElementById('mobile-menu-drawer');
  if (mobileNav) {
    mobileMenuBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        mobileNav.classList.toggle('hidden');
      });
    });
  }
}

function initCartBadges() {
  const updateBadges = () => {
    if (!window.canteeneryStore) return;
    const totals = window.canteeneryStore.getCartTotals();
    const badges = document.querySelectorAll('[data-cart-badge], .cart-badge-count');
    const dotIndicators = document.querySelectorAll('.cart-dot-indicator');

    badges.forEach(badge => {
      badge.textContent = totals.totalQty;
      if (totals.totalQty > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    });

    dotIndicators.forEach(dot => {
      if (totals.totalQty > 0) {
        dot.classList.remove('hidden');
      } else {
        dot.classList.add('hidden');
      }
    });
  };

  if (window.canteeneryStore) {
    window.canteeneryStore.subscribe('cart-change', updateBadges);
    window.canteeneryStore.subscribe('state-reset', updateBadges);
    updateBadges();
  }
}

function initHomePageLiveStatus() {
  const renderHomeLiveStatus = () => {
    if (!window.canteeneryStore) return;
    const workload = window.canteeneryStore.calculateKitchenWorkload();
    const smart = window.canteeneryStore.calculateSmartPickup();

    const loadEl = document.getElementById('home-kitchen-load');
    const loadLevelEl = document.getElementById('home-kitchen-load-level');
    const queueEl = document.getElementById('home-current-queue');
    const pickupEl = document.getElementById('home-next-pickup');

    if (loadEl) loadEl.textContent = `${workload.percentage}%`;
    if (loadLevelEl) {
      if (workload.level === 'CRITICAL') loadLevelEl.textContent = 'Critical Surge';
      else if (workload.level === 'HIGH') loadLevelEl.textContent = 'Heavy Traffic';
      else if (workload.level === 'MODERATE') loadLevelEl.textContent = 'Moderately Busy';
      else loadLevelEl.textContent = 'Low Wait Time';
    }
    if (queueEl) queueEl.textContent = `${workload.activeOrderCount} ${workload.activeOrderCount === 1 ? 'order' : 'orders'}`;
    if (pickupEl && smart && smart.slots && smart.slots[1]) {
      pickupEl.textContent = smart.slots[1].label.split('-')[0].trim();
    }
  };

  if (window.canteeneryStore) {
    window.canteeneryStore.subscribe('orders-changed', renderHomeLiveStatus);
    window.canteeneryStore.subscribe('order-updated', renderHomeLiveStatus);
    window.canteeneryStore.subscribe('state-reset', renderHomeLiveStatus);
    renderHomeLiveStatus();
  }
}

function initToastContainer() {
  if (document.getElementById('canteenery-toast-container')) return;
  const container = document.createElement('div');
  container.id = 'canteenery-toast-container';
  container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
  document.body.appendChild(container);
}

window.showToast = function(message, type = 'success') {
  const container = document.getElementById('canteenery-toast-container') || document.body;
  const toast = document.createElement('div');
  
  const bgStyles = {
    success: 'bg-[#002147] text-white border-l-4 border-secondary-container shadow-xl',
    error: 'bg-error text-white border-l-4 border-white shadow-xl',
    warning: 'bg-[#fef08a] text-[#854d0e] border-l-4 border-amber-600 shadow-xl',
    info: 'bg-surface-container-high text-primary border-l-4 border-primary shadow-xl'
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  toast.className = `${bgStyles[type] || bgStyles.success} pointer-events-auto px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px]">${icons[type] || 'info'}</span>
    <span class="flex-1">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger entry animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  // Auto remove after 3.5s
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// Monitor server connectivity
if (window.canteeneryStore) {
  let wasOffline = false;
  window.canteeneryStore.subscribe('connection-status', ({ online }) => {
    if (!online && !wasOffline) {
      wasOffline = true;
      if (window.showToast) {
        window.showToast('Reconnecting to Canteenery server...', 'warning');
      }
    } else if (online && wasOffline) {
      wasOffline = false;
      if (window.showToast) {
        window.showToast('Reconnected to Canteenery server!', 'success');
      }
    }
  });
}
