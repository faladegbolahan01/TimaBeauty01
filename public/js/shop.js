
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const CART_STORAGE_KEY = "timabeauty_shop_cart_v1";

  // Products and prices come from the server catalogue.
  let products = [];

  const CATEGORY_IMAGES = {
    haircare: "https://i.pinimg.com/1200x/25/5f/8e/255f8ead59005095449cfada411c9b9c.jpg",
    skincare: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=700&q=80",
    makeup: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=700&q=80",
    tools: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=700&q=80",
    accessories: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80"
  };

  const categoryNames = {
    haircare: "Hair Care",
    skincare: "Skincare",
    makeup: "Makeup",
    tools: "Hair Tools",
    accessories: "Accessories"
  };

  const formatPrice = amount =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(amount);

  const productGrid = document.getElementById("shop-product-grid");
  const searchInput = document.getElementById("shop-search");
  const searchButton = document.getElementById("shop-search-button");
  const searchToggle = document.getElementById("shop-search-toggle");
  const sortSelect = document.getElementById("shop-sort");
  const priceRange = document.getElementById("shop-price-range");
  const priceMaximum = document.getElementById("shop-price-maximum");
  const resultsCount = document.getElementById("shop-results-count");
  const emptyState = document.getElementById("shop-empty-state");
  const resetFiltersButton = document.getElementById("shop-reset-filters");
  const categoryButtons = document.querySelectorAll(".shop-category");

  const cartToggle = document.getElementById("shop-cart-toggle");
  const cartCount = document.getElementById("shop-cart-count");
  const cartOverlay = document.getElementById("shop-cart-overlay");
  const cartClose = document.getElementById("shop-cart-close");
  const cartItems = document.getElementById("shop-cart-items");
  const cartSubtotal = document.getElementById("shop-cart-subtotal");
  const checkoutButton = document.getElementById("shop-checkout-button");

  // Load saved cart items.
  function loadCart() {
    try {
      const savedCart = JSON.parse(
        localStorage.getItem(CART_STORAGE_KEY) || "[]"
      );

      if (!Array.isArray(savedCart)) return [];

      return savedCart
        .filter(item =>
          item &&
          (products.length === 0 ||
            products.some(product => product.id === item.id)) &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          item.quantity <= 99
        )
        .map(item => ({
          id: item.id,
          quantity: item.quantity
        }));
    } catch {
      return [];
    }
  }

  let cart = loadCart();

  function saveCart() {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch {
      // The cart can still work for this page session.
    }
  }

  // Fetch the complete product catalogue from the backend.
  async function loadShopProducts() {
    if (productGrid) {
      productGrid.setAttribute("aria-busy", "true");
    }

    try {
      const response = await fetch("/api/shop/products", {
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(
          `Product API returned HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data.products)) {
        throw new Error(
          "The product API did not return a products array."
        );
      }

      products = data.products.map(product => ({
        ...product,
        image:
          product.image ||
          CATEGORY_IMAGES[product.category] ||
          CATEGORY_IMAGES.accessories
      }));

      // Remove saved cart entries that no longer exist.
      cart = cart.filter(item =>
        products.some(product => product.id === item.id)
      );

      saveCart();
      renderProducts();
      renderCart();

      console.log(
        `Loaded ${products.length} products from the server.`
      );
    } catch (error) {
      console.error(
        "Could not load TimaBeauty shop products:",
        error
      );

      if (productGrid) {
        productGrid.replaceChildren();

        const message = document.createElement("p");
        message.className = "shop-load-error";
        message.textContent =
          "Products could not be loaded. Please refresh the page and try again.";

        productGrid.appendChild(message);
      }
    } finally {
      productGrid?.removeAttribute("aria-busy");
    }
  }

  // Mobile navigation.
  const menuToggle = document.querySelector(".shop-menu-toggle");
  const navigation = document.querySelector(".shop-navigation");

  if (menuToggle && navigation) {
    const closeMenu = () => {
      navigation.classList.remove("is-open");
      menuToggle.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute(
        "aria-label",
        "Open navigation menu"
      );
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = navigation.classList.contains("is-open");

      if (isOpen) {
        closeMenu();
      } else {
        navigation.classList.add("is-open");
        menuToggle.classList.add("is-open");
        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute(
          "aria-label",
          "Close navigation menu"
        );
      }
    });

    navigation.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", event => {
      if (
        navigation.classList.contains("is-open") &&
        !navigation.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  let activeCategory = "all";
  let searchTerm = "";
  let maxPrice = Number(priceRange?.value || 50000);

  function getFilteredProducts() {
    let filtered = products.filter(product => {
      const matchesCategory =
        activeCategory === "all" ||
        product.category === activeCategory;

      const matchesSearch = (
        product.name + " " +
        (categoryNames[product.category] || "")
      )
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return (
        matchesCategory &&
        matchesSearch &&
        Number(product.price) <= maxPrice
      );
    });

    const sortBy = sortSelect?.value || "featured";

    if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      filtered.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    return filtered;
  }

  function createFallback() {
    const fallback = document.createElement("div");
    fallback.className = "shop-image-fallback";
    fallback.textContent = "TimaBeauty";

    fallback.style.cssText =
      "display:flex;align-items:center;justify-content:center;" +
      "width:100%;height:100%;min-height:180px;color:#c83e79;" +
      "font-family:Georgia,serif;font-size:22px;background:#fbeaf1;";

    return fallback;
  }

  function createProductImage(product, className = "") {
    const image = document.createElement("img");
    image.alt = product.name;
    image.loading = "lazy";
    image.decoding = "async";

    if (className) {
      image.className = className;
    }

    let fallbackShown = false;

    const showFallback = () => {
      if (fallbackShown) return;
      fallbackShown = true;

      const fallback = createFallback();
      image.replaceWith(fallback);
    };

    image.addEventListener("error", showFallback, {
      once: true
    });

    if (product.image) {
      image.src = product.image;
    } else {
      showFallback();
    }

    return image;
  }

  function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "shop-product-card";
    card.dataset.productId = product.id;

    const imageArea = document.createElement("div");
    imageArea.className = "shop-product-image";
    imageArea.appendChild(createProductImage(product));

    const info = document.createElement("div");
    info.className = "shop-product-info";

    const category = document.createElement("p");
    category.className = "shop-product-category";
    category.textContent =
      categoryNames[product.category] || "Beauty";

    const name = document.createElement("h3");
    name.className = "shop-product-name";
    name.textContent = product.name;

    const price = document.createElement("p");
    price.className = "shop-product-price";
    price.textContent = formatPrice(Number(product.price));

    const addButton = document.createElement("button");
    addButton.className = "shop-add-to-cart";
    addButton.type = "button";
    addButton.dataset.addProduct = product.id;
    addButton.textContent = "Add to Cart";

    info.append(category, name, price, addButton);
    card.append(imageArea, info);

    return card;
  }

  function renderProducts() {
    if (!productGrid) return;

    const filteredProducts = getFilteredProducts();
    productGrid.replaceChildren();

    filteredProducts.forEach(product => {
      productGrid.appendChild(createProductCard(product));
    });

    if (resultsCount) {
      resultsCount.textContent =
        `Showing ${filteredProducts.length} of ${products.length} products`;
    }

    if (emptyState) {
      emptyState.hidden = filteredProducts.length !== 0;
    }

    productGrid.hidden = filteredProducts.length === 0;
  }

  // Category filters.
  categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "all";

      categoryButtons.forEach(item => {
        const isActive = item === button;

        item.classList.toggle("active", isActive);
        item.setAttribute(
          "aria-pressed",
          String(isActive)
        );
      });

      renderProducts();
    });

    button.setAttribute(
      "aria-pressed",
      String(button.classList.contains("active"))
    );
  });

  // Search.
  searchInput?.addEventListener("input", () => {
    searchTerm = searchInput.value.trim();
    renderProducts();
  });

  searchButton?.addEventListener("click", () => {
    searchTerm = searchInput?.value.trim() || "";
    renderProducts();
  });

  searchInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchTerm = searchInput.value.trim();
      renderProducts();
    }
  });

  searchToggle?.addEventListener("click", () => {
    document.getElementById("shop-products")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    window.setTimeout(() => searchInput?.focus(), 300);
  });

  // Sorting.
  sortSelect?.addEventListener("change", renderProducts);

  // Price filter.
  priceRange?.addEventListener("input", () => {
    maxPrice = Number(priceRange.value);

    if (priceMaximum) {
      priceMaximum.textContent = formatPrice(maxPrice);
    }

    renderProducts();
  });

  // Reset filters.
  resetFiltersButton?.addEventListener("click", () => {
    activeCategory = "all";
    searchTerm = "";
    maxPrice = Number(priceRange?.max || 50000);

    if (searchInput) searchInput.value = "";

    if (priceRange) {
      priceRange.value = String(maxPrice);
    }

    if (priceMaximum) {
      priceMaximum.textContent = formatPrice(maxPrice);
    }

    if (sortSelect) {
      sortSelect.value = "featured";
    }

    categoryButtons.forEach(button => {
      const isActive = button.dataset.category === "all";

      button.classList.toggle("active", isActive);
      button.setAttribute(
        "aria-pressed",
        String(isActive)
      );
    });

    renderProducts();
  });

  function getCartDetails() {
    return cart
      .map(item => {
        const product = products.find(
          entry => entry.id === item.id
        );

        if (!product) return null;

        return {
          ...product,
          quantity: item.quantity,
          lineTotal: Number(product.price) * item.quantity
        };
      })
      .filter(Boolean);
  }

  function getCartQuantity() {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  function getCartTotal() {
    return getCartDetails().reduce(
      (total, item) => total + item.lineTotal,
      0
    );
  }

  function renderCart() {
    const details = getCartDetails();

    if (cartCount) {
      cartCount.textContent = String(getCartQuantity());
    }

    if (cartToggle) {
      cartToggle.setAttribute(
        "aria-label",
        `Shopping cart, ${getCartQuantity()} items`
      );
    }

    if (cartSubtotal) {
      cartSubtotal.textContent = formatPrice(getCartTotal());
    }

    if (checkoutButton) {
      checkoutButton.disabled = details.length === 0;
      checkoutButton.textContent = "Continue to Checkout";

      checkoutButton.title = details.length === 0
        ? "Add products to your cart first."
        : "Continue to checkout.";
    }

    if (!cartItems) return;

    cartItems.replaceChildren();

    if (details.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "Your shopping bag is empty.";
      cartItems.appendChild(emptyMessage);
      return;
    }

    details.forEach(item => {
      const row = document.createElement("div");
      row.className = "shop-cart-item";

      const image = createProductImage(item);
      image.alt = item.name;

      const info = document.createElement("div");

      const name = document.createElement("h3");
      name.textContent = item.name;

      const price = document.createElement("p");
      price.textContent = formatPrice(item.lineTotal);

      const quantityControls = document.createElement("div");
      quantityControls.className = "shop-cart-quantity";

      const decrease = document.createElement("button");
      decrease.type = "button";
      decrease.textContent = "−";
      decrease.setAttribute(
        "aria-label",
        `Remove one ${item.name}`
      );

      decrease.addEventListener("click", () => {
        changeQuantity(item.id, -1);
      });

      const quantity = document.createElement("span");
      quantity.textContent = String(item.quantity);

      const increase = document.createElement("button");
      increase.type = "button";
      increase.textContent = "+";
      increase.disabled = item.quantity >= 99;
      increase.setAttribute(
        "aria-label",
        `Add one ${item.name}`
      );

      increase.addEventListener("click", () => {
        changeQuantity(item.id, 1);
      });

      quantityControls.append(
        decrease,
        quantity,
        increase
      );

      info.append(name, price, quantityControls);

      const remove = document.createElement("button");
      remove.className = "shop-cart-remove";
      remove.type = "button";
      remove.textContent = "Remove";
      remove.setAttribute(
        "aria-label",
        `Remove ${item.name} from cart`
      );

      remove.addEventListener("click", () => {
        removeFromCart(item.id);
      });

      row.append(image, info, remove);
      cartItems.appendChild(row);
    });
  }

  // Add products to cart.
  function addToCart(productId) {
    const product = products.find(
      item => item.id === productId
    );

    if (!product) return;

    const existingItem = cart.find(
      item => item.id === productId
    );

    if (existingItem) {
      if (existingItem.quantity >= 99) {
        window.alert(
          "You have reached the maximum quantity for this item."
        );
        return;
      }

      existingItem.quantity += 1;
    } else {
      cart.push({
        id: productId,
        quantity: 1
      });
    }

    saveCart();
    renderCart();

    const button = productGrid?.querySelector(
      `[data-add-product="${productId}"]`
    );

    if (button) {
      button.textContent = "Added to Cart ✓";

      window.setTimeout(() => {
        button.textContent = "Add to Cart";
      }, 1200);
    }
  }

  function changeQuantity(productId, change) {
    const item = cart.find(
      entry => entry.id === productId
    );

    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
      cart = cart.filter(
        entry => entry.id !== productId
      );
    } else if (item.quantity > 99) {
      item.quantity = 99;
    }

    saveCart();
    renderCart();
  }

  function removeFromCart(productId) {
    cart = cart.filter(
      item => item.id !== productId
    );

    saveCart();
    renderCart();
  }

  productGrid?.addEventListener("click", event => {
    const button = event.target.closest(
      "[data-add-product]"
    );

    if (button) {
      addToCart(button.dataset.addProduct);
    }
  });

  // Cart overlay.
  function openCart() {
    if (!cartOverlay) return;

    cartOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    cartClose?.focus();
  }

  function closeCart() {
    if (!cartOverlay) return;

    cartOverlay.hidden = true;
    document.body.style.overflow = "";
    cartToggle?.focus();
  }

  cartToggle?.addEventListener("click", openCart);
  cartClose?.addEventListener("click", closeCart);

  cartOverlay?.addEventListener("click", event => {
    if (event.target === cartOverlay) {
      closeCart();
    }
  });

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      cartOverlay &&
      !cartOverlay.hidden
    ) {
      closeCart();
    }
  });

  // Continue to checkout.
  checkoutButton?.addEventListener("click", () => {
    if (cart.length === 0) {
      window.alert(
        "Please add a product to your cart first."
      );
      return;
    }

    window.location.href = "checkout.html";
  });

  // Current year.
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Scroll animations.
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 850,
      easing: "ease-out-cubic",
      once: true,
      offset: 70,
      disable: window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    });
  }

  if (priceMaximum && priceRange) {
    priceMaximum.textContent = formatPrice(
      Number(priceRange.value)
    );
  }

  renderCart();
  loadShopProducts();

  console.log(
    "TimaBeauty Shop JavaScript loaded successfully."
  );
});
