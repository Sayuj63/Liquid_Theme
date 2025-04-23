// --- Shopify AJAX Cart Drawer ---

function fetchCartAndRenderDrawer() {
  fetch('/cart.js')
    .then(res => res.json())
    .then(cart => {
      renderCartDrawer(cart);
    });
}

function renderCartDrawer(cart) {
  // Update header cart count
  document.querySelectorAll('.header-cart-count').forEach(el => {
    el.textContent = cart.item_count;
  });

  // Update drawer title
  const drawerTitle = document.querySelector('.cart-drawer__title');
  if (drawerTitle) {
    drawerTitle.innerHTML = `<strong>${cart.item_count} ITEM${cart.item_count === 1 ? '' : 'S'} IN YOUR BAG.</strong>`;
  }

  // Render cart items
  let itemsHtml = '';
  if (cart.items.length > 0) {
    cart.items.forEach(item => {
      const imgSrc = item.image
        ? (item.image.indexOf('cdn.shopify.com') !== -1
            ? item.image.replace(/(_[0-9]+x[0-9]+)?\./, '_400x.')
            : item.image)
        : 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-image.png?format=jpg';

      itemsHtml += `
        <div class="cart-drawer__item">
          <img src="${imgSrc}" alt="${item.product_title}" class="cart-drawer__image" width="120" height="150">
          <div class="cart-drawer__details">
            <div class="cart-drawer__name">${item.product_title}</div>
            <div class="cart-drawer__meta">${item.variant_title}</div>
            <div class="cart-drawer__price">${Shopify.formatMoney(item.final_line_price)}</div>
            <div class="cart-drawer__qty-controls">
              <button class="cart-drawer__qty-btn" data-action="decrease" data-key="${item.key}">-</button>
              <span class="cart-drawer__qty">${item.quantity}</span>
              <button class="cart-drawer__qty-btn" data-action="increase" data-key="${item.key}">+</button>
            </div>
          </div>
          <button class="cart-drawer__remove" aria-label="Remove Item" data-action="remove" data-key="${item.key}">&times;</button>
        </div>
      `;
    });
  } else {
    itemsHtml = '<div style="color:#fff; text-align:center; padding: 40px 0;">Your cart is empty.</div>';
  }

  document.querySelector('.cart-drawer__items').innerHTML = itemsHtml;

  // Update subtotal
  const subtotalEl = document.querySelector('.cart-drawer__subtotal');
  if (subtotalEl) {
    subtotalEl.textContent = Shopify.formatMoney(cart.total_price);
  }
}

// Format price as INR
window.Shopify = window.Shopify || {};
Shopify.formatMoney = function(cents) {
  return (cents / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
};

// Update item quantity or remove
function updateCartItem(key, quantity) {
  fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: key, quantity: quantity })
  })
    .then(res => res.json())
    .then(() => {
      fetchCartAndRenderDrawer();
    });
}

// Handle quantity and remove clicks
document.addEventListener('click', function(e) {
  const btn = e.target;
  if (btn.classList.contains('cart-drawer__qty-btn')) {
    const key = btn.getAttribute('data-key');
    const action = btn.getAttribute('data-action');
    const item = document.querySelector(`[data-key='${key}']`).closest('.cart-drawer__item');
    const qty = parseInt(item.querySelector('.cart-drawer__qty').textContent, 10);
    const newQty = action === 'increase' ? qty + 1 : Math.max(1, qty - 1);
    updateCartItem(key, newQty);
  }
  if (btn.classList.contains('cart-drawer__remove')) {
    const key = btn.getAttribute('data-key');
    updateCartItem(key, 0);
  }
  if (btn.classList.contains('cart-drawer__checkout')) {
    window.location.href = '/checkout';
  }
});

// Intercept "Add to Cart"
function interceptAddToCart() {
  document.querySelectorAll('form[action^="/cart/add"]').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(form);
      fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      })
        .then(res => {
          if (!res.ok) throw new Error('Add to cart failed');
          return res.json();
        })
        .then(() => {
          fetchCartAndRenderDrawer();
          openCartDrawer();
        })
        .catch(err => {
          alert('Error adding to cart: ' + err.message);
        });
    });
  });

  document.querySelectorAll('button[name="add"]:not([type="submit"])').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const form = btn.closest('form');
      if (form) {
        const formData = new FormData(form);
        fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        })
          .then(res => {
            if (!res.ok) throw new Error('Add to cart failed');
            return res.json();
          })
          .then(() => {
            fetchCartAndRenderDrawer();
            openCartDrawer();
          })
          .catch(err => {
            alert('Error adding to cart: ' + err.message);
          });
      }
    });
  });
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
  fetchCartAndRenderDrawer();
  interceptAddToCart();
});
