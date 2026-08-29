/**
 * Canteenery - Menu Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initMenuPage();
});

let currentCategory = 'All';
let searchQuery = '';

function initMenuPage() {
  const menuContainer = document.getElementById('menu-items-grid');
  if (!menuContainer) return;

  const searchInput = document.getElementById('menu-search-input');
  const categoryContainer = document.getElementById('category-filter-container');

  // Check URL params for category or search
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('category')) {
    currentCategory = urlParams.get('category');
  }
  if (urlParams.has('search')) {
    searchQuery = urlParams.get('search').toLowerCase();
    if (searchInput) searchInput.value = searchQuery;
  }

  // Setup search listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderMenu();
    });
  }

  // Setup category listeners
  if (categoryContainer) {
    const categoryButtons = categoryContainer.querySelectorAll('button');
    categoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.textContent.trim();
        categoryButtons.forEach(b => {
          b.className = 'whitespace-nowrap px-md py-xs rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-variant hover:text-on-surface text-label-md font-label-md transition-colors';
        });
        btn.className = 'whitespace-nowrap px-md py-xs rounded-full bg-primary-container text-on-primary-container text-label-md font-label-md shadow-sm transition-colors';
        renderMenu();
      });
    });
  }

  // Subscribe to store updates
  if (window.canteeneryStore) {
    window.canteeneryStore.subscribe('menu-change', renderMenu);
    window.canteeneryStore.subscribe('cart-change', renderMenu);
    window.canteeneryStore.subscribe('state-reset', renderMenu);
  }

  renderMenu();
}

function renderMenu() {
  const container = document.getElementById('menu-items-grid');
  if (!container || !window.canteeneryStore) return;

  const items = window.canteeneryStore.getMenu();
  const cart = window.canteeneryStore.getCart();

  const filteredItems = items.filter(item => {
    // Category match
    let matchesCat = true;
    if (currentCategory !== 'All') {
      if (currentCategory === 'Non-Veg') {
        matchesCat = !item.isVeg;
      } else {
        matchesCat = item.category === currentCategory;
      }
    }

    // Search match
    let matchesSearch = true;
    if (searchQuery) {
      matchesSearch = (
        (item.name && item.name.toLowerCase().includes(searchQuery)) ||
        (item.displayName && item.displayName.toLowerCase().includes(searchQuery)) ||
        (item.description && item.description.toLowerCase().includes(searchQuery)) ||
        (item.category && item.category.toLowerCase().includes(searchQuery))
      );
    }

    return matchesCat && matchesSearch;
  });

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-surface-container-lowest rounded-xl border border-outline-variant p-xl">
        <span class="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
        <h3 class="text-headline-sm font-semibold text-primary">No food items found</h3>
        <p class="text-body-md text-on-surface-variant mt-1">Try adjusting your search query or switching categories.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredItems.map(item => {
    const invStatus = window.canteeneryStore.getInventoryStatus(item);
    const cartItem = cart.find(c => c.id === item.id);
    const cartQty = cartItem ? cartItem.quantity : 0;
    const isSoldOut = !invStatus.canAdd;

    // Food Card Template matching Stitch
    if (isSoldOut) {
      const overlayLabel = invStatus.overlayText || 'UNAVAILABLE';
      const badgeText = invStatus.label || 'Unavailable';
      return `
        <article class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden opacity-60 grayscale-[50%] flex flex-col relative group">
          <!-- Sold Out / Unavailable Overlay -->
          <div class="absolute inset-0 bg-surface/40 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <div class="bg-error text-on-error font-headline-sm text-headline-sm px-lg py-xs rounded-lg rotate-[-12deg] shadow-lg border-2 border-white">${overlayLabel}</div>
          </div>
          <div class="relative h-48 w-full overflow-hidden">
            <img class="w-full h-full object-cover" alt="${item.displayName || item.name}" src="${item.image}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'" />
            <div class="absolute top-sm right-sm bg-surface-container-lowest p-xs rounded-sm shadow-sm flex items-center justify-center ${item.isVeg ? '' : 'border border-red-200'}">
              <span class="material-symbols-outlined text-[16px] ${item.isVeg ? 'text-[#166534]' : 'text-red-600'}">fiber_manual_record</span>
              <span class="sr-only">${item.isVeg ? 'Veg' : 'Non-Veg'}</span>
            </div>
          </div>
          <div class="p-md flex flex-col flex-grow relative z-0">
            <div class="flex justify-between items-start mb-sm">
              <h3 class="text-headline-sm font-headline-sm text-on-surface line-through text-outline">${item.displayName || item.name}</h3>
              <span class="text-headline-sm font-headline-sm text-outline line-through">₹${item.price}</span>
            </div>
            <p class="text-body-sm font-body-sm text-on-surface-variant mb-md flex-grow">${item.description || ''}</p>
            <div class="flex flex-col gap-sm mt-auto">
              <div class="flex items-center justify-between text-label-sm font-label-sm">
                <span class="flex items-center gap-xs text-on-surface-variant"><span class="material-symbols-outlined text-[16px]">schedule</span> Prep: ${item.preparationTime || 5} min</span>
                <span class="${invStatus.badgeClass} px-sm py-[2px] rounded-full text-xs font-semibold">${badgeText}</span>
              </div>
              <button class="w-full mt-sm bg-surface-variant text-outline text-label-md font-label-md py-sm rounded-lg cursor-not-allowed flex items-center justify-center gap-xs" disabled>
                ${badgeText}
              </button>
            </div>
          </div>
        </article>
      `;
    }

    // Available or Low Stock Item
    const badgeHtml = invStatus.warningIcon
      ? `<span class="${invStatus.badgeClass} px-sm py-[2px] rounded-full flex items-center gap-1 font-semibold"><span class="material-symbols-outlined text-[14px]">warning</span> ${invStatus.label}</span>`
      : `<span class="${invStatus.badgeClass} px-sm py-[2px] rounded-full font-semibold">${invStatus.label}</span>`;

    const borderHighlight = invStatus.warningIcon ? 'border-2 border-secondary/30' : 'border border-outline-variant';

    // Quantity or Add Button
    let actionButtonHtml = '';
    if (cartQty > 0) {
      actionButtonHtml = `
        <div class="w-full mt-sm flex items-center justify-between bg-surface-container-high rounded-lg p-1 border border-secondary-container/40">
          <button onclick="handleUpdateCart('${item.id}', ${cartQty - 1})" class="w-9 h-9 rounded-md bg-white hover:bg-surface-variant text-primary flex items-center justify-center transition-colors shadow-sm" title="Decrease quantity">
            <span class="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <div class="flex flex-col items-center">
            <span class="text-label-md font-bold text-primary">${cartQty} in cart</span>
          </div>
          <button onclick="handleUpdateCart('${item.id}', ${cartQty + 1})" class="w-9 h-9 rounded-md bg-secondary-container hover:bg-[#e06512] text-white flex items-center justify-center transition-colors shadow-sm" title="Increase quantity">
            <span class="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
      `;
    } else {
      actionButtonHtml = `
        <button onclick="handleAddToCart('${item.id}')" class="w-full mt-sm bg-secondary-container hover:bg-[#e06512] text-on-tertiary text-label-md font-label-md py-sm rounded-lg transition-colors flex items-center justify-center gap-xs shadow-sm">
          <span class="material-symbols-outlined text-[18px]">add</span> Add
        </button>
      `;
    }

    return `
      <article class="bg-surface-container-lowest rounded-xl ${borderHighlight} overflow-hidden group hover:shadow-ambient transition-all duration-300 flex flex-col relative">
        <div class="relative h-48 w-full overflow-hidden">
          <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${item.displayName || item.name}" src="${item.image}" />
          <div class="absolute top-sm right-sm bg-surface-container-lowest p-xs rounded-sm shadow-sm flex items-center justify-center ${item.isVeg ? '' : 'border border-red-200'}">
            <span class="material-symbols-outlined text-[16px] ${item.isVeg ? 'text-[#166534]' : 'text-red-600'}">fiber_manual_record</span>
            <span class="sr-only">${item.isVeg ? 'Veg' : 'Non-Veg'}</span>
          </div>
        </div>
        <div class="p-md flex flex-col flex-grow">
          <div class="flex justify-between items-start mb-sm">
            <h3 class="text-headline-sm font-headline-sm text-on-surface">${item.name}</h3>
            <span class="text-headline-sm font-headline-sm text-secondary-container">₹${item.price}</span>
          </div>
          <p class="text-body-sm font-body-sm text-on-surface-variant mb-md flex-grow">${item.description}</p>
          <div class="flex flex-col gap-sm mt-auto">
            <div class="flex items-center justify-between text-label-sm font-label-sm">
              <span class="flex items-center gap-xs text-on-surface-variant"><span class="material-symbols-outlined text-[16px]">schedule</span> Prep: ${item.preparationTime} min</span>
              ${badgeHtml}
            </div>
            ${actionButtonHtml}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

window.handleAddToCart = function(itemId) {
  if (!window.canteeneryStore) return;
  const result = window.canteeneryStore.addToCart(itemId, 1);
  if (result.success) {
    window.showToast(result.message, 'success');
  } else {
    window.showToast(result.message, 'error');
  }
};

window.handleUpdateCart = function(itemId, qty) {
  if (!window.canteeneryStore) return;
  const result = window.canteeneryStore.updateCartQuantity(itemId, qty);
  if (result.success) {
    if (qty > 0) {
      window.showToast(result.message, 'success');
    } else {
      window.showToast('Item removed from cart', 'info');
    }
  } else {
    window.showToast(result.message, 'warning');
  }
};
