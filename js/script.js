// ================================================
//  ShopKart Main JavaScript with Account System
//  Complete functionality for e-commerce website
// ================================================

// Global Variables
let shoppingCart = [];
let wishlist = [];
let currentProducts = [...productsData];
let currentProductDetail = null;
let currentUser = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    checkUserSession();
    loadCartFromStorage();
    loadWishlistFromStorage();
    updateCartBadge();
    updateWishlistBadge();
    updateNavbar();
    
    // Load featured products on homepage
    if (document.getElementById('featuredProducts')) {
        displayFeaturedProducts();
    }
    
    // Load products on products page
    if (document.getElementById('productsContainer')) {
        loadProductsPage();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize Bootstrap tooltips
    initializeTooltips();
}

// ===== ACCOUNT SYSTEM =====

// Check if user is logged in
function checkUserSession() {
    const sessionUser = localStorage.getItem('shopkart_current_user');
    if (sessionUser) {
        currentUser = JSON.parse(sessionUser);
        updateNavbar();
    }
}

// Handle Registration
function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Validation
    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters!', 'warning');
        return;
    }
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('shopkart_users') || '[]');
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
        showToast('Email already registered! Please login.', 'warning');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        phone: phone,
        password: password, // In production, this should be hashed
        createdAt: new Date().toISOString(),
        cart: [],
        wishlist: [],
        orders: []
    };
    
    users.push(newUser);
    localStorage.setItem('shopkart_users', JSON.stringify(users));
    
    // Auto login after registration
    currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem('shopkart_current_user', JSON.stringify(currentUser));
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
    modal.hide();
    
    // Reset form
    document.getElementById('registerForm').reset();
    
    showToast(`Welcome ${name}! Account created successfully.`, 'success');
    updateNavbar();
    
    // Load user-specific data
    loadUserData();
}

// Handle Login
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    
    // Get all users
    const users = JSON.parse(localStorage.getItem('shopkart_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        showToast('Invalid email or password!', 'danger');
        return;
    }
    
    // Set current user
    currentUser = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem('shopkart_current_user', JSON.stringify(currentUser));
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    modal.hide();
    
    // Reset form
    document.getElementById('loginForm').reset();
    
    showToast(`Welcome back, ${user.name}!`, 'success');
    updateNavbar();
    
    // Load user-specific data
    loadUserData();
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Save current cart and wishlist to user profile
        saveUserData();
        
        // Clear session
        localStorage.removeItem('shopkart_current_user');
        currentUser = null;
        
        // Clear cart and wishlist
        shoppingCart = [];
        wishlist = [];
        
        updateNavbar();
        updateCartBadge();
        updateWishlistBadge();
        
        showToast('Logged out successfully!', 'info');
        
        // Redirect to home
        window.location.href = 'index.html';
    }
}


// Update Navbar based on login status
function updateNavbar() {
    const loggedOutNav = document.getElementById('loggedOutNav');
    const loggedInNav = document.getElementById('loggedInNav');
    
    if (!loggedOutNav || !loggedInNav) return;
    
    if (currentUser) {
        // User is logged in - HIDE login/register, SHOW profile
        loggedOutNav.classList.add('hide');
        loggedOutNav.classList.remove('show');
        loggedInNav.classList.add('show');
        loggedInNav.classList.remove('hide');
        
        // Update user name in dropdown
        const userNameDisplays = document.querySelectorAll('#userNameDisplay, #userNameDropdown');
        userNameDisplays.forEach(el => {
            if (el) el.textContent = currentUser.name.split(' ')[0]; // First name only
        });
    } else {
        // User is logged out - SHOW login/register, HIDE profile
        loggedOutNav.classList.add('show');
        loggedOutNav.classList.remove('hide');
        loggedInNav.classList.add('hide');
        loggedInNav.classList.remove('show');
    }
}


// Load user-specific data
function loadUserData() {
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('shopkart_users') || '[]');
    const user = users.find(u => u.id === currentUser.id);
    
    if (user) {
        shoppingCart = user.cart || [];
        wishlist = user.wishlist || [];
        
        updateCartBadge();
        updateWishlistBadge();
        
        // Refresh current page if needed
        if (document.getElementById('cartItemsContainer')) {
            displayCartPage();
        }
        if (document.getElementById('wishlistItemsContainer')) {
            displayWishlistPage();
        }
        if (document.getElementById('featuredProducts')) {
            displayFeaturedProducts();
        }
        if (document.getElementById('productsContainer')) {
            displayProducts(currentProducts);
        }
    }
}

// Save user-specific data
function saveUserData() {
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('shopkart_users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].cart = shoppingCart;
        users[userIndex].wishlist = wishlist;
        localStorage.setItem('shopkart_users', JSON.stringify(users));
    }
}

// View Profile
function viewProfile() {
    if (!currentUser) {
        showToast('Please login to view profile', 'warning');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('shopkart_users') || '[]');
    const user = users.find(u => u.id === currentUser.id);
    
    if (user) {
        alert(`Profile Information:\n\nName: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone}\nMember Since: ${new Date(user.createdAt).toLocaleDateString()}`);
    }
}

// View Orders
function viewOrders() {
    if (!currentUser) {
        showToast('Please login to view orders', 'warning');
        return;
    }
    
    alert('Order history feature coming soon!\n\nYour past orders will be displayed here.');
}

// ===== FEATURED PRODUCTS (Homepage) =====
function displayFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    // Get random 8 products
    const shuffled = [...productsData].sort(() => 0.5 - Math.random());
    const featured = shuffled.slice(0, 8);
    
    container.innerHTML = '';
    featured.forEach(product => {
        container.innerHTML += createProductCard(product);
    });
}

// ===== PRODUCTS PAGE =====
function loadProductsPage() {
    // Check for category in URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category && category !== 'all') {
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) categorySelect.value = category;
        
        // Set radio button
        const radioBtn = document.getElementById('cat' + category.charAt(0).toUpperCase() + category.slice(1));
        if (radioBtn) radioBtn.checked = true;
    }
    
    applyAllFilters();
}

// ===== CREATE PRODUCT CARD =====
function createProductCard(product) {
    const isInWishlist = wishlist.some(item => item.id === product.id);
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    
    return `
        <div class="col">
            <div class="card product-card h-100 position-relative">
                ${discount > 0 ? `<span class="badge bg-danger position-absolute" style="top: 10px; right: 10px; z-index: 2;">-${discount}% OFF</span>` : ''}
                <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id})">
                    <i class="bi bi-heart${isInWishlist ? '-fill' : ''}"></i>
                </button>
                <img src="${product.image}" class="card-img-top" alt="${product.name}" onclick="goToProductDetail(${product.id})" style="cursor: pointer;">
                <div class="card-body d-flex flex-column">
                    <h5 class="product-title" onclick="goToProductDetail(${product.id})" style="cursor: pointer;">${product.name}</h5>
                    <p class="text-muted small mb-2">
                        <i class="bi bi-star-fill text-warning"></i> ${product.rating} (${product.reviews})
                    </p>
                    <p class="card-text text-muted small flex-grow-1">${product.description.substring(0, 60)}...</p>
                    <div class="mt-auto">
                        <div class="d-flex align-items-baseline gap-2 mb-2">
                            <h5 class="text-success mb-0">₹${product.price.toLocaleString('en-IN')}</h5>
                            ${product.originalPrice > product.price ? `<small class="text-muted text-decoration-line-through">₹${product.originalPrice.toLocaleString('en-IN')}</small>` : ''}
                        </div>
                        <button class="btn btn-primary btn-sm w-100" onclick="addToCart(${product.id})">
                            <i class="bi bi-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== DISPLAY PRODUCTS =====
function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    const noResults = document.getElementById('noResults');
    const productCount = document.getElementById('productCount');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (products.length === 0) {
        if (noResults) noResults.classList.remove('d-none');
        if (productCount) productCount.textContent = '0';
        return;
    }
    
    if (noResults) noResults.classList.add('d-none');
    if (productCount) productCount.textContent = products.length;
    
    products.forEach(product => {
        container.innerHTML += createProductCard(product);
    });
}

// ===== FILTERS =====
function applyAllFilters() {
    let filtered = [...productsData];
    
    // Category filter
    const categoryRadios = document.querySelectorAll('input[name="category"]');
    let selectedCategory = 'all';
    categoryRadios.forEach(radio => {
        if (radio.checked) selectedCategory = radio.value;
    });
    
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Price filter
    const priceCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="price"]');
    const selectedPriceRanges = [];
    priceCheckboxes.forEach(cb => {
        if (cb.checked) selectedPriceRanges.push(cb.value);
    });
    
    if (selectedPriceRanges.length > 0) {
        filtered = filtered.filter(p => {
            return selectedPriceRanges.some(range => {
                const [min, max] = range.split('-').map(Number);
                return p.price >= min && p.price <= max;
            });
        });
    }
    
    // Rating filter
    const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="rating"]');
    const selectedRatings = [];
    ratingCheckboxes.forEach(cb => {
        if (cb.checked) selectedRatings.push(Number(cb.value));
    });
    
    if (selectedRatings.length > 0) {
        const minRating = Math.min(...selectedRatings);
        filtered = filtered.filter(p => p.rating >= minRating);
    }
    
    currentProducts = filtered;
    displayProducts(currentProducts);
}

function clearAllFilters() {
    // Reset category
    const catAll = document.getElementById('catAll');
    if (catAll) catAll.checked = true;
    
    // Reset price checkboxes
    document.querySelectorAll('input[type="checkbox"][id^="price"]').forEach(cb => cb.checked = false);
    
    // Reset rating checkboxes
    document.querySelectorAll('input[type="checkbox"][id^="rating"]').forEach(cb => cb.checked = false);
    
    // Reset sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'default';
    
    // Reset search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    currentProducts = [...productsData];
    displayProducts(currentProducts);
}

// ===== SORTING =====
function sortProducts() {
    const sortValue = document.getElementById('sortSelect').value;
    
    switch(sortValue) {
        case 'price-low':
            currentProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            currentProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            currentProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'rating':
            currentProducts.sort((a, b) => b.rating - a.rating);
            break;
        default:
            currentProducts = [...productsData];
    }
    
    displayProducts(currentProducts);
}

// ===== SEARCH =====
function searchProducts(event) {
    event.preventDefault();
    const searchTerm = document.getElementById('navSearchInput').value.toLowerCase();
    
    if (searchTerm.trim() === '') {
        return;
    }
    
    // Redirect to products page with search
    window.location.href = `products.html?search=${encodeURIComponent(searchTerm)}`;
}

// ===== CART FUNCTIONS =====
function addToCart(productId) {
    if (!currentUser) {
        showToast('Please login to add items to cart!', 'warning');
        // Open login modal
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
        return;
    }
    
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = shoppingCart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        shoppingCart.push({
            ...product,
            quantity: 1
        });
    }
    
    saveCartToStorage();
    updateCartBadge();
    showToast('Added to cart successfully!', 'success');
    
    // Add pulse animation
    const cartBadges = document.querySelectorAll('#cartBadge');
    cartBadges.forEach(badge => {
        badge.classList.add('pulse');
        setTimeout(() => badge.classList.remove('pulse'), 1000);
    });
}

function removeFromCart(productId) {
    shoppingCart = shoppingCart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartBadge();
    
    // Refresh cart page if on cart page
    if (document.getElementById('cartItemsContainer')) {
        displayCartPage();
    }
    
    showToast('Item removed from cart', 'warning');
}

function updateCartQuantity(productId, change) {
    const item = shoppingCart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    saveCartToStorage();
    updateCartBadge();
    
    // Refresh cart page
    if (document.getElementById('cartItemsContainer')) {
        displayCartPage();
    }
}

function updateCartBadge() {
    const badges = document.querySelectorAll('#cartBadge');
    const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
    badges.forEach(badge => {
        badge.textContent = totalItems;
    });
}

// ===== WISHLIST FUNCTIONS =====
function toggleWishlist(productId) {
    if (!currentUser) {
        showToast('Please login to add items to wishlist!', 'warning');
        // Open login modal
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
        return;
    }
    
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    const index = wishlist.findIndex(item => item.id === productId);
    
    if (index > -1) {
        wishlist.splice(index, 1);
        showToast('Removed from wishlist', 'info');
    } else {
        wishlist.push(product);
        showToast('Added to wishlist!', 'success');
    }
    
    saveWishlistToStorage();
    updateWishlistBadge();
    
    // Update UI
    if (document.getElementById('productsContainer') || document.getElementById('featuredProducts')) {
        // Reload current page products
        if (document.getElementById('featuredProducts')) {
            displayFeaturedProducts();
        }
        if (document.getElementById('productsContainer')) {
            displayProducts(currentProducts);
        }
    }
    
    // Refresh wishlist page if on wishlist page
    if (document.getElementById('wishlistItemsContainer')) {
        displayWishlistPage();
    }
}

function updateWishlistBadge() {
    const badges = document.querySelectorAll('#wishlistBadge');
    badges.forEach(badge => {
        badge.textContent = wishlist.length;
    });
}

function addAllToCart() {
    if (wishlist.length === 0) {
        showToast('Wishlist is empty!', 'warning');
        return;
    }
    
    wishlist.forEach(product => {
        addToCart(product.id);
    });
    
    showToast(`${wishlist.length} items added to cart!`, 'success');
}

function clearWishlist() {
    if (wishlist.length === 0) {
        showToast('Wishlist is already empty!', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear your entire wishlist?')) {
        wishlist = [];
        saveWishlistToStorage();
        updateWishlistBadge();
        displayWishlistPage();
        showToast('Wishlist cleared', 'info');
    }
}

function shareWishlist() {
    const message = `Check out my wishlist on ShopKart! I have ${wishlist.length} items saved.`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My ShopKart Wishlist',
            text: message,
            url: window.location.href
        });
    } else {
        // Copy to clipboard
        navigator.clipboard.writeText(message + '\n' + window.location.href);
        showToast('Wishlist link copied to clipboard!', 'success');
    }
}

// ===== CART PAGE =====
function displayCartPage() {
    const container = document.getElementById('cartItemsContainer');
    const emptyCart = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');
    const continueBtn = document.getElementById('continueShoppingBtn');
    const suggestedSection = document.getElementById('suggestedProducts');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (shoppingCart.length === 0) {
        emptyCart.classList.remove('d-none');
        if (cartSummary) cartSummary.classList.add('d-none');
        if (continueBtn) continueBtn.classList.add('d-none');
        if (suggestedSection) suggestedSection.classList.add('d-none');
        return;
    }
    
    emptyCart.classList.add('d-none');
    if (cartSummary) cartSummary.classList.remove('d-none');
    if (continueBtn) continueBtn.classList.remove('d-none');
    if (suggestedSection) suggestedSection.classList.remove('d-none');
    
    shoppingCart.forEach(item => {
        container.innerHTML += `
            <div class="cart-item d-flex align-items-center gap-3">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="flex-grow-1">
                    <h5 class="mb-1">${item.name}</h5>
                    <p class="text-muted small mb-2">${item.brand}</p>
                    <p class="text-success fw-bold mb-0">₹${item.price.toLocaleString('en-IN')}</p>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <div class="quantity-controls d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQuantity(${item.id}, -1)">
                            <i class="bi bi-dash"></i>
                        </button>
                        <span class="mx-3 fw-bold">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQuantity(${item.id}, 1)">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    // Update cart summary
    updateCartSummary();
    
    // Load suggested products
    loadSuggestedProducts();
}

function updateCartSummary() {
    const subtotal = shoppingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
    const shipping = subtotal >= 500 ? 0 : 50;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;
    
    const subtotalEl = document.getElementById('subtotalAmount');
    const shippingEl = document.getElementById('shippingAmount');
    const taxEl = document.getElementById('taxAmount');
    const totalEl = document.getElementById('totalAmount');
    const totalItemsEl = document.getElementById('totalItems');
    
    if (subtotalEl) subtotalEl.textContent = subtotal.toLocaleString('en-IN');
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : '₹' + shipping;
    if (taxEl) taxEl.textContent = tax.toLocaleString('en-IN');
    if (totalEl) totalEl.textContent = total.toLocaleString('en-IN');
    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    
    // Free shipping badge
    const freeShippingBadge = document.getElementById('freeShippingBadge');
    const shippingWarning = document.getElementById('shippingWarning');
    const amountNeeded = document.getElementById('amountNeeded');
    
    if (subtotal >= 500) {
        if (freeShippingBadge) freeShippingBadge.style.display = 'block';
        if (shippingWarning) shippingWarning.style.display = 'none';
    } else {
        if (freeShippingBadge) freeShippingBadge.style.display = 'none';
        if (shippingWarning) shippingWarning.style.display = 'block';
        if (amountNeeded) amountNeeded.textContent = (500 - subtotal).toLocaleString('en-IN');
    }
}

function loadSuggestedProducts() {
    const container = document.getElementById('suggestedProductsContainer');
    if (!container) return;
    
    const shuffled = [...productsData].sort(() => 0.5 - Math.random());
    const suggested = shuffled.slice(0, 4);
    
    container.innerHTML = '';
    suggested.forEach(product => {
        container.innerHTML += createProductCard(product);
    });
}

function proceedToCheckout() {
    if (shoppingCart.length === 0) {
        showToast('Your cart is empty!', 'warning');
        return;
    }
    
    if (!currentUser) {
        showToast('Please login to proceed to checkout!', 'warning');
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
        return;
    }
    
    const total = shoppingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
    
    alert(`Proceeding to checkout...\n\nTotal Items: ${totalItems}\nTotal Amount: ₹${total.toLocaleString('en-IN')}\n\nThis is a demo. In production, this would redirect to payment gateway.`);
}

function applyPromoCode() {
    const promoInput = document.getElementById('promoCode');
    if (!promoInput) return;
    
    const code = promoInput.value.trim().toUpperCase();
    
    if (code === 'SAVE10') {
        showToast('Promo code applied! 10% discount', 'success');
    } else if (code === '') {
        showToast('Please enter a promo code', 'warning');
    } else {
        showToast('Invalid promo code', 'danger');
    }
}

// ===== WISHLIST PAGE =====
function displayWishlistPage() {
    const container = document.getElementById('wishlistItemsContainer');
    const emptyWishlist = document.getElementById('emptyWishlist');
    const wishlistActions = document.getElementById('wishlistActions');
    const wishlistTips = document.getElementById('wishlistTips');
    const wishlistCount = document.getElementById('wishlistCount');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (wishlistCount) wishlistCount.textContent = wishlist.length;
    
    if (wishlist.length === 0) {
        emptyWishlist.classList.remove('d-none');
        if (wishlistActions) wishlistActions.classList.add('d-none');
        if (wishlistTips) wishlistTips.classList.add('d-none');
        return;
    }
    
    emptyWishlist.classList.add('d-none');
    if (wishlistActions) wishlistActions.classList.remove('d-none');
    if (wishlistTips) wishlistTips.classList.remove('d-none');
    
    wishlist.forEach(product => {
        container.innerHTML += createProductCard(product);
    });
    
    // Load recently viewed
    loadRecentlyViewed();
}

function loadRecentlyViewed() {
    const container = document.getElementById('recentlyViewed');
    if (!container) return;
    
    const shuffled = [...productsData].sort(() => 0.5 - Math.random());
    const recent = shuffled.slice(0, 4);
    
    container.innerHTML = '';
    recent.forEach(product => {
        container.innerHTML += createProductCard(product);
    });
}

// ===== PRODUCT DETAIL PAGE =====
function goToProductDetail(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

function displayProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    const product = productsData.find(p => p.id === productId);
    if (!product) {
        window.location.href = 'products.html';
        return;
    }
    
    currentProductDetail = product;
    
    // Update page content
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productDescription').textContent = product.description;
    document.getElementById('productRating').textContent = product.rating;
    document.getElementById('reviewCount').textContent = product.reviews;
    document.getElementById('currentPrice').textContent = product.price.toLocaleString('en-IN');
    document.getElementById('originalPrice').textContent = product.originalPrice.toLocaleString('en-IN');
    document.getElementById('mainProductImage').src = product.image;
    
    // Update breadcrumb
    document.getElementById('breadcrumbCategory').textContent = getCategoryDisplayName(product.category);
    document.getElementById('breadcrumbCategory').href = `products.html?category=${product.category}`;
    document.getElementById('breadcrumbProduct').textContent = product.name;
    
    // Stock status
    document.getElementById('stockStatus').textContent = product.inStock ? 'In Stock' : 'Out of Stock';
    document.getElementById('stockStatus').className = product.inStock ? 'badge bg-success ms-3' : 'badge bg-danger ms-3';
    
    // Discount badge
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    if (discount > 0) {
        document.getElementById('discountBadge').style.display = 'block';
        document.getElementById('discountPercent').textContent = discount;
    }
    
    // Wishlist button
    const isInWishlist = wishlist.some(item => item.id === productId);
    const wishlistIcon = document.getElementById('wishlistIconDetail');
    if (wishlistIcon) {
        wishlistIcon.className = isInWishlist ? 'bi bi-heart-fill' : 'bi bi-heart';
    }
    const wishlistBtnLarge = document.querySelector('.wishlist-btn-large');
    if (wishlistBtnLarge) {
        wishlistBtnLarge.className = isInWishlist ? 'wishlist-btn-large active' : 'wishlist-btn-large';
    }
    
    // Show size/color selectors for fashion
    if (product.category === 'fashion' || product.category === 'footwear') {
        document.getElementById('sizeSelector').style.display = 'block';
    }
    if (product.category === 'fashion') {
        document.getElementById('colorSelector').style.display = 'block';
    }
    
    // Update specifications
    document.getElementById('specBrand').textContent = product.brand;
    document.getElementById('specModel').textContent = product.model;
    document.getElementById('specCategory').textContent = getCategoryDisplayName(product.category);
    document.getElementById('specMaterial').textContent = product.material;
    document.getElementById('specWarranty').textContent = product.warranty;
    
    // Load related products
    loadRelatedProducts(product.category, productId);
}

function loadRelatedProducts(category, currentId) {
    const container = document.getElementById('relatedProducts');
    if (!container) return;
    
    const related = productsData.filter(p => p.category === category && p.id !== currentId).slice(0, 4);
    
    container.innerHTML = '';
    related.forEach(product => {
        container.innerHTML += createProductCard(product);
    });
}

function getCategoryDisplayName(category) {
    const names = {
        'electronics': 'Electronics',
        'fashion': 'Fashion',
        'footwear': 'Footwear',
        'home': 'Home & Furniture',
        'beauty': 'Beauty & Care',
        'sports': 'Sports & Fitness',
        'books': 'Books & Stationery'
    };
    return names[category] || category;
}

function changeMainImage(imageSrc) {
    document.getElementById('mainProductImage').src = imageSrc;
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail-img').forEach(img => {
        img.classList.remove('active');
    });
    event.target.classList.add('active');
}

function increaseQuantity() {
    const input = document.getElementById('productQuantity');
    let value = parseInt(input.value);
    if (value < 10) {
        input.value = value + 1;
    }
}

function decreaseQuantity() {
    const input = document.getElementById('productQuantity');
    let value = parseInt(input.value);
    if (value > 1) {
        input.value = value - 1;
    }
}

function addToCartFromDetail() {
    if (!currentProductDetail) return;
    
    if (!currentUser) {
        showToast('Please login to add items to cart!', 'warning');
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
        return;
    }
    
    const quantity = parseInt(document.getElementById('productQuantity').value);
    
    const existingItem = shoppingCart.find(item => item.id === currentProductDetail.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        shoppingCart.push({
            ...currentProductDetail,
            quantity: quantity
        });
    }
    
    saveCartToStorage();
    updateCartBadge();
    showToast(`${quantity} item(s) added to cart!`, 'success');
}

function toggleWishlistFromDetail() {
    if (!currentProductDetail) return;
    toggleWishlist(currentProductDetail.id);
    
    // Update button
    const isInWishlist = wishlist.some(item => item.id === currentProductDetail.id);
    const wishlistIcon = document.getElementById('wishlistIconDetail');
    if (wishlistIcon) {
        wishlistIcon.className = isInWishlist ? 'bi bi-heart-fill' : 'bi bi-heart';
    }
    const wishlistBtnLarge = document.querySelector('.wishlist-btn-large');
    if (wishlistBtnLarge) {
        wishlistBtnLarge.className = isInWishlist ? 'wishlist-btn-large active' : 'wishlist-btn-large';
    }
}

function buyNow() {
    if (!currentProductDetail) return;
    
    if (!currentUser) {
        showToast('Please login to proceed!', 'warning');
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
        return;
    }
    
    addToCartFromDetail();
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 500);
}

// ===== COLOR SELECTOR =====
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('color-btn')) {
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        const color = e.target.getAttribute('data-color');
        const selectedColorEl = document.getElementById('selectedColor');
        if (selectedColorEl) selectedColorEl.textContent = color;
    }
});

// ===== STORAGE FUNCTIONS =====
function saveCartToStorage() {
    if (currentUser) {
        saveUserData();
    } else {
        localStorage.setItem('shopkart_cart', JSON.stringify(shoppingCart));
    }
}

function loadCartFromStorage() {
    if (currentUser) {
        loadUserData();
    } else {
        const saved = localStorage.getItem('shopkart_cart');
        if (saved) {
            shoppingCart = JSON.parse(saved);
        }
    }
}

function saveWishlistToStorage() {
    if (currentUser) {
        saveUserData();
    } else {
        localStorage.setItem('shopkart_wishlist', JSON.stringify(wishlist));
    }
}

function loadWishlistFromStorage() {
    if (currentUser) {
        loadUserData();
    } else {
        const saved = localStorage.getItem('shopkart_wishlist');
        if (saved) {
            wishlist = JSON.parse(saved);
        }
    }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastHeader = toastEl.querySelector('.toast-header');
    
    if (!toastEl || !toastMessage) return;
    
    // Update color based on type
    const colors = {
        'success': 'bg-success',
        'warning': 'bg-warning',
        'danger': 'bg-danger',
        'info': 'bg-info'
    };
    
    toastHeader.className = `toast-header ${colors[type] || 'bg-success'} text-white`;
    toastMessage.textContent = message;
    
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Filter radio buttons
    const categoryRadios = document.querySelectorAll('input[name="category"]');
    categoryRadios.forEach(radio => {
        radio.addEventListener('change', applyAllFilters);
    });
    
    // Price and rating checkboxes
    const filterCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="price"], input[type="checkbox"][id^="rating"]');
    filterCheckboxes.forEach(cb => {
        cb.addEventListener('change', applyAllFilters);
    });
}

// ===== INITIALIZE TOOLTIPS =====
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// ===== SCROLL TO TOP =====
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50 && navbar) {
        navbar.classList.add('shadow-lg');
    } else if (navbar) {
        navbar.classList.remove('shadow-lg');
    }
});

// ===== FORM VALIDATION =====
(function() {
    'use strict';
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
})();

// ===== CONSOLE MESSAGE =====
console.log('%cShopKart E-commerce Website', 'color: #0d6efd; font-size: 20px; font-weight: bold;');
console.log('%cWith Account System - Developed for Educational Purpose', 'color: #6c757d; font-size: 12px;');
