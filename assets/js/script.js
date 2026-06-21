document.addEventListener('DOMContentLoaded', () => {
    /* =========================================================================
     * 1. UI INTERAKTIF & ANIMASI 
     * ========================================================================= */
    const navbar = document.getElementById('navbar');
    const navBrand = document.getElementById('nav-brand');
    const navLinks = document.querySelectorAll('.nav-link');
    const navIcons = document.querySelectorAll('.nav-icon');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    // Konfigurasi WhatsApp Admin (Gunakan format internasional tanpa '+')
    const ADMIN_WA_NUMBER = "6281234567890";

    // --- Scroll Handling untuk Navbar ---
    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('bg-white', 'shadow-md', 'py-3', 'border-gray-100');
            navbar.classList.remove('bg-transparent', 'py-4', 'border-transparent');

            navBrand.classList.remove('text-white');
            navBrand.classList.add('text-batik-primary');

            navLinks.forEach(link => {
                link.classList.remove('text-white/90');
                link.classList.add('text-gray-700');
            });

            navIcons.forEach(icon => {
                icon.classList.remove('text-white');
                icon.classList.add('text-batik-primary');
            });
        } else {
            navbar.classList.remove('bg-white', 'shadow-md', 'py-3', 'border-gray-100');
            navbar.classList.add('bg-transparent', 'py-4', 'border-transparent');

            navBrand.classList.remove('text-batik-primary');
            navBrand.classList.add('text-white');

            navLinks.forEach(link => {
                link.classList.remove('text-gray-700');
                link.classList.add('text-white/90');
            });

            navIcons.forEach(icon => {
                icon.classList.remove('text-batik-primary');
                icon.classList.add('text-white');
            });
        }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // --- Mobile Menu ---
    let isMenuOpen = false;
    const toggleMenu = () => {
        isMenuOpen = !isMenuOpen;
        if (isMenuOpen) {
            mobileMenu.classList.remove('hidden');
            void mobileMenu.offsetWidth; // force reflow
            mobileMenu.classList.remove('scale-y-0', 'opacity-0');
            navbar.classList.add('bg-white');
        } else {
            mobileMenu.classList.add('scale-y-0', 'opacity-0');
            setTimeout(() => {
                mobileMenu.classList.add('hidden');
                handleScroll();
            }, 300);
        }
    };
    mobileBtn.addEventListener('click', toggleMenu);
    mobileLinks.forEach(link => link.addEventListener('click', toggleMenu));

    // --- Scroll Reveal Animasi ---
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px 0px -50px 0px', threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


    /* =========================================================================
     * 2. LOGIKA KERANJANG BELANJA (SHOPPING CART)
     * ========================================================================= */

    // State Keranjang
    let cartItems = [];

    // DOM Elements Keranjang
    const cartToggleBtns = [document.getElementById('cart-toggle-btn'), document.getElementById('mobile-cart-btn')];
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartBackdrop = document.getElementById('cart-backdrop');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const emptyCartMsg = document.getElementById('empty-cart-msg');
    const cartTotalEl = document.getElementById('cart-total');
    const cartBadges = [document.getElementById('cart-badge'), document.getElementById('mobile-cart-badge')];
    const checkoutBtn = document.getElementById('checkout-wa-btn');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    const toastNotification = document.getElementById('toast-notification');

    // --- Format Rupiah ---
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    // --- Toggle Drawer Keranjang ---
    const toggleCartDrawer = () => {
        const isOpen = cartDrawer.classList.contains('cart-drawer-open');
        if (isOpen) {
            cartDrawer.classList.remove('cart-drawer-open');
            cartBackdrop.classList.remove('backdrop-open');
        } else {
            cartDrawer.classList.add('cart-drawer-open');
            cartBackdrop.classList.add('backdrop-open');
        }
    };

    cartToggleBtns.forEach(btn => btn.addEventListener('click', toggleCartDrawer));
    closeCartBtn.addEventListener('click', toggleCartDrawer);
    cartBackdrop.addEventListener('click', toggleCartDrawer);

    // --- Menampilkan Toast Notifikasi ---
    const showToast = () => {
        toastNotification.classList.remove('toast-animate');
        void toastNotification.offsetWidth;
        toastNotification.classList.add('toast-animate');
    };

    // --- Update UI Keranjang ---
    const updateCartUI = () => {
        // Update Badge
        const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);
        cartBadges.forEach(badge => {
            badge.textContent = totalItems;
            if (totalItems > 0) {
                badge.classList.remove('scale-0');
                badge.classList.add('scale-100');
            } else {
                badge.classList.remove('scale-100');
                badge.classList.add('scale-0');
            }
        });

        // Update Total Price
        const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        cartTotalEl.textContent = formatRupiah(totalPrice);

        // Handling Cart Kosong
        if (cartItems.length === 0) {
            emptyCartMsg.style.display = 'flex';
            Array.from(cartItemsContainer.children).forEach(child => {
                if (child !== emptyCartMsg) child.remove();
            });
            checkoutBtn.disabled = true; // Nonaktifkan tombol checkout
            return;
        }

        // Handling Cart Terisi
        emptyCartMsg.style.display = 'none';
        checkoutBtn.disabled = false; // Aktifkan tombol checkout

        // Reset dan Render Ulang Items
        Array.from(cartItemsContainer.children).forEach(child => {
            if (child !== emptyCartMsg) child.remove();
        });

        // Render Elemen DOM (Aman dari XSS karena menggunakan createElement)
        cartItems.forEach((item) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex gap-4 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm';

            itemDiv.innerHTML = `
                        <div class="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-bold text-gray-900 truncate" title="${item.name}">${item.name}</h4>
                            <p class="text-xs text-batik-accent font-semibold mb-2">${formatRupiah(item.price)}</p>
                            <div class="flex items-center gap-3">
                                <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                    <button class="cart-action-btn px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 transition" data-action="minus" data-id="${item.id}"><i class="fa-solid fa-minus text-[10px] pointer-events-none"></i></button>
                                    <span class="px-3 text-xs font-medium text-gray-800">${item.qty}</span>
                                    <button class="cart-action-btn px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 transition" data-action="plus" data-id="${item.id}"><i class="fa-solid fa-plus text-[10px] pointer-events-none"></i></button>
                                </div>
                                <button class="cart-action-btn text-gray-400 hover:text-red-500 text-xs transition-colors" data-action="remove" data-id="${item.id}">
                                    <i class="fa-solid fa-trash pointer-events-none"></i>
                                </button>
                            </div>
                        </div>
                    `;
            cartItemsContainer.appendChild(itemDiv);
        });
    };

    // --- EVENT DELEGATION: Pengganti onclick inline demi keamanan & performa ---
    cartItemsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.cart-action-btn');
        if (!btn) return;

        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const item = cartItems.find(i => i.id === id);

        if (!item) return;

        if (action === 'plus') {
            item.qty += 1;
            updateCartUI();
        } else if (action === 'minus') {
            item.qty -= 1;
            if (item.qty <= 0) {
                cartItems = cartItems.filter(i => i.id !== id);
            }
            updateCartUI();
        } else if (action === 'remove') {
            cartItems = cartItems.filter(i => i.id !== id);
            updateCartUI();
        }
    });

    // --- Menambahkan Item ke Keranjang ---
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.currentTarget;
            const id = button.getAttribute('data-id');
            const name = button.getAttribute('data-name');
            const price = parseInt(button.getAttribute('data-price'), 10);
            const img = button.getAttribute('data-img');

            const existingItem = cartItems.find(item => item.id === id);
            if (existingItem) {
                existingItem.qty += 1;
            } else {
                cartItems.push({ id, name, price, img, qty: 1 });
            }

            updateCartUI();
            showToast();

            // Otomatis buka laci jika user menekan tombol beli (opsional untuk e-commerce modern)
            if (!cartDrawer.classList.contains('cart-drawer-open')) {
                toggleCartDrawer();
            }
        });
    });

    // --- Proses Checkout Chat Penjual via WhatsApp ---
    checkoutBtn.addEventListener('click', () => {
        if (cartItems.length === 0) return;

        const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

        let waText = `Halo *Batik Nusantara*, saya ingin memesan:\n\n`;

        cartItems.forEach((item, index) => {
            waText += `${index + 1}. *${item.name}*\n`;
            waText += `    Jumlah: ${item.qty} pcs\n`;
            waText += `    Harga: ${formatRupiah(item.price * item.qty)}\n\n`;
        });

        waText += `*Total Belanja: ${formatRupiah(totalPrice)}*\n`;
        waText += `(Belum termasuk ongkir)\n\n`;
        waText += `Tolong bantu cek ketersediaan stoknya ya kak. Terima kasih!`;

        const encodedText = encodeURIComponent(waText);
        const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodedText}`;

        window.open(waUrl, '_blank', 'noopener,noreferrer');
    });


    /* =========================================================================
     * 3. FORM NEWSLETTER 
     * ========================================================================= */
    const newsletterForm = document.getElementById('newsletter-form');
    const formMessage = document.getElementById('form-message');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email-input').value;

            if (email && email.includes('@')) {
                newsletterForm.reset();
                formMessage.classList.remove('hidden');
                setTimeout(() => {
                    formMessage.classList.add('hidden');
                }, 5000);
            }
        });
    }
});