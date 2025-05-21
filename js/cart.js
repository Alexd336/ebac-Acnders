document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const cartTray = document.getElementById('cartTray');
    const cartOverlay = document.getElementById('cartOverlay');
    const openCartBtn = document.querySelector('a.cart-icon:has(img[alt="Carrito"])');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartBadge = document.createElement('span');
    const cartItemCount = document.getElementById('cartItemCount');
    const cartTotal = document.getElementById('cartTotal');
    const addToCartButtons = document.querySelectorAll('.course-card__btn');
    
    // Crear badge dinámicamente
    cartBadge.className = 'cart-badge';
    cartBadge.id = 'cartBadge';
    if(openCartBtn) {
        openCartBtn.appendChild(cartBadge);
    }
    
    // Carrito en memoria
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Inicializar carrito
    updateCart();
    
    // Abrir carrito
    if(openCartBtn) {
        openCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openCart();
        });
    }
    
    // Cerrar carrito
    closeCartBtn.addEventListener('click', closeCart);
    
    // Cerrar al hacer click fuera
    cartOverlay.addEventListener('click', function(e) {
        if (e.target === cartOverlay) {
            closeCart();
        }
    });
    
    // Añadir eventos a los botones "Añadir"
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.course-card');
            const priceText = card.querySelector('.course-card__price').textContent;
            const priceNumber = parseFloat(priceText.replace(/[^0-9.-]+/g,""));
            
            addToCart({
                id: card.dataset.id,
                name: card.querySelector('.course-card__title').textContent.trim(),
                price: priceNumber,
                image: card.querySelector('.course-card__image').src
            });
        });
    });
    
    // Función para abrir el carrito
    function openCart() {
        cartTray.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Función para cerrar el carrito
    function closeCart() {
        cartTray.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    // Función para añadir producto al carrito
    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        updateCart();
        animateAddToCart();
        openCart();
    }
    
    // Función para actualizar el carrito
    function updateCart() {
        // Guardar en localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Calcular total de items
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Actualizar badge
        cartBadge.textContent = totalItems;
        cartItemCount.textContent = totalItems;
        
        // Mostrar/ocultar badge
        cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        
        // Renderizar items del carrito
        renderCartItems();
        
        // Actualizar total
        updateTotal();
    }
    
    // Función para renderizar los items del carrito
    function renderCartItems() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-message">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Tu carrito está vacío</p>
                </div>
            `;
            return;
        }

        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.name} <span class="quantity-badge">${item.quantity}x</span></h4>
                    <div class="price-info">
                        <span>$${item.price.toFixed(2)} c/u</span>
                        <strong>Total: $${(item.price * item.quantity).toFixed(2)}</strong>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-btn decrease" aria-label="Reducir cantidad">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn increase" aria-label="Aumentar cantidad">+</button>
                    </div>
                </div>
                <button class="remove-item" aria-label="Eliminar ${item.name}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        // Configurar eventos para los controles
        document.querySelectorAll('.decrease').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.closest('.cart-item').dataset.id;
                updateItemQuantity(itemId, -1);
            });
        });
        
        document.querySelectorAll('.increase').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.closest('.cart-item').dataset.id;
                updateItemQuantity(itemId, 1);
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.closest('.cart-item').dataset.id;
                removeItem(itemId);
            });
        });
    }
    
    // Función para actualizar cantidad de un item
    function updateItemQuantity(itemId, change) {
        const item = cart.find(item => item.id === itemId);
        
        if (item) {
            item.quantity += change;
            
            if (item.quantity < 1) {
                cart = cart.filter(item => item.id !== itemId);
            }
            
            updateCart();
        }
    }

    // Función para cargar el carrito con validación
function loadCart() {
    try {
        const savedCart = localStorage.getItem('cart');
        if (!savedCart) return [];
        
        const parsedCart = JSON.parse(savedCart);
        
        // Validar que sea un array y que cada item tenga la estructura correcta
        if (!Array.isArray(parsedCart)) return [];
        
        return parsedCart.filter(item => {
            return item && 
                   typeof item.id === 'string' && 
                   typeof item.name === 'string' && 
                   typeof item.price === 'number' && 
                   typeof item.quantity === 'number' && 
                   typeof item.image === 'string';
        });
    } catch (e) {
        console.error('Error al cargar el carrito:', e);
        return [];
    }
}


    
    // Función para eliminar item
    function removeItem(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        updateCart();

         // Si el carrito queda vacío, forzar una recarga del estado
    if (cart.length === 0) {
        setTimeout(() => {
            cart = loadCart();
            updateCart();
        }, 100);
    }
  }
    
    // Función para actualizar total
    function updateTotal() {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }
    
    // Animación al añadir al carrito
    function animateAddToCart() {
        // Animación del badge
        cartBadge.classList.add('bounce');
        setTimeout(() => {
            cartBadge.classList.remove('bounce');
        }, 300);
    }
});

// Función para guardar el carrito con validación
function saveCart() {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {
        console.error('Error al guardar el carrito:', e);
    }
}

// Modificar la inicialización del carrito
let cart = loadCart();

// Función para limpiar completamente el carrito (nueva)
function clearCart() {
    cart = [];
    updateCart();
    localStorage.removeItem('cart');
}

document.querySelector('.clear-cart-btn')?.addEventListener('click', clearCart);