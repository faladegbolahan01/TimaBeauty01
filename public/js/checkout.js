
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const CART_KEY = "timabeauty_shop_cart_v1";

  const form = document.getElementById("checkout-form");
  const itemsBox = document.getElementById("order-items");
  const totalBox = document.getElementById("order-total");
  const grandTotalBox = document.getElementById("grand-total");
  const countBox = document.getElementById("order-count");
  const cartCountBox = document.getElementById("cart-count");
  const messageBox = document.getElementById("checkout-message");
  const payButton = document.getElementById("pay-button");

  document.getElementById("current-year").textContent =
    new Date().getFullYear();

  let cart = [];
  let products = [];

  const money = amount =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(amount);

  function showMessage(text) {
    messageBox.textContent = text;
  }

  function readCart() {
    try {
      const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  function getCategory(product) {
    const category = String(product.category || "").toLowerCase();

    if (category.includes("hair")) return "hair";
    if (category.includes("skin")) return "skin";
    if (category.includes("makeup")) return "makeup";
    if (category.includes("tool")) return "tool";
    if (category.includes("accessor")) return "accessory";

    return "beauty";
  }

  function getCategoryLabel(product) {
    const category = String(product.category || "").toLowerCase();

    if (category.includes("hair")) return "Hair care";
    if (category.includes("skin")) return "Skincare";
    if (category.includes("makeup")) return "Makeup";
    if (category.includes("tool")) return "Beauty tools";
    if (category.includes("accessor")) return "Accessories";

    return "Beauty essentials";
  }

  function getProductIcon(product) {
    const category = getCategory(product);

    const icons = {
      hair: "✧",
      skin: "❀",
      makeup: "♡",
      tool: "✦",
      accessory: "❋",
      beauty: "✧"
    };

    return icons[category] || "✧";
  }

  function getValidCartItems() {
    const productMap = new Map(
      products.map(product => [String(product.id), product])
    );

    return cart
      .filter(item =>
        item &&
        typeof item.id === "string" &&
        productMap.has(item.id) &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0 &&
        Number(item.quantity) <= 99
      )
      .map(item => ({
        id: item.id,
        quantity: Number(item.quantity),
        product: productMap.get(item.id)
      }));
  }

  function updateCartCount() {
    const quantity = cart.reduce((sum, item) => {
      const number = Number(item?.quantity);

      return sum + (
        Number.isInteger(number) && number > 0 ? number : 0
      );
    }, 0);

    cartCountBox.textContent = String(quantity);
  }

  function renderOrder() {
    itemsBox.replaceChildren();

    const items = getValidCartItems();

    updateCartCount();

    countBox.textContent = `${items.reduce(
      (sum, item) => sum + item.quantity,
      0
    )} item${items.reduce(
      (sum, item) => sum + item.quantity,
      0
    ) === 1 ? "" : "s"} in your cart`;

    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent =
        "Your shopping bag is empty. Return to the shop to choose your beauty essentials.";

      itemsBox.appendChild(empty);

      totalBox.textContent = money(0);
      grandTotalBox.textContent = money(0);
      payButton.disabled = true;

      return;
    }

    let subtotal = 0;

    for (const item of items) {
      const product = item.product;
      const price = Number(product.price);

      if (!Number.isSafeInteger(price) || price < 0) {
        continue;
      }

      const lineTotal = price * item.quantity;

      subtotal += lineTotal;

      const row = document.createElement("article");
      row.className = "order-item";

      const thumbnail = document.createElement("div");
thumbnail.className = "product-thumb";
thumbnail.dataset.category = getCategory(product);

if (product.image && product.image.trim() !== "") {
  const image = document.createElement("img");

  image.src = product.image;
  image.alt = product.name;
  image.loading = "lazy";

  image.onerror = () => {
    thumbnail.replaceChildren();
    thumbnail.textContent = getProductIcon(product);
  };

  thumbnail.appendChild(image);
} else {
  thumbnail.textContent = getProductIcon(product);
}
      const details = document.createElement("div");
      details.className = "product-details";

      const name = document.createElement("p");
      name.className = "product-name";
      name.textContent = product.name;

      const category = document.createElement("span");
      category.className = "product-category";
      category.textContent = getCategoryLabel(product);

      const bottom = document.createElement("div");
      bottom.className = "product-bottom";

      const quantity = document.createElement("span");
      quantity.className = "quantity-pill";

      const quantityText = document.createElement("span");
      quantityText.textContent = `Qty ${item.quantity}`;

      quantity.appendChild(quantityText);

      const amount = document.createElement("strong");
      amount.className = "product-price";
      amount.textContent = money(lineTotal);

      bottom.append(quantity, amount);
      details.append(name, category, bottom);
      row.append(thumbnail, details);
      itemsBox.appendChild(row);
    }

    totalBox.textContent = money(subtotal);
    grandTotalBox.textContent = money(subtotal);
    payButton.disabled = subtotal <= 0;
  }

  async function loadProducts() {
    cart = readCart();
    updateCartCount();

    if (!cart.length) {
      renderOrder();
      return;
    }

    try {
      const response = await fetch("/api/shop/products", {
        headers: {
          Accept: "application/json"
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not load products from the server."
        );
      }

      products = Array.isArray(data)
        ? data
        : data.products;

      if (!Array.isArray(products)) {
        throw new Error("The server returned an unexpected product list.");
      }

      renderOrder();

      if (!getValidCartItems().length) {
        showMessage(
          "Some items in your cart are no longer available. Please return to the shop and update your cart."
        );
      }
    } catch (error) {
      itemsBox.replaceChildren();

      const problem = document.createElement("p");
      problem.className = "empty";
      problem.textContent =
        "We couldn't load your order. Please refresh the page or return to the shop.";

      itemsBox.appendChild(problem);

      totalBox.textContent = money(0);
      grandTotalBox.textContent = money(0);
      payButton.disabled = true;

      showMessage(error.message || "Could not load your order.");
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    showMessage("");

    if (!form.reportValidity()) {
      return;
    }

    cart = readCart();

    const items = getValidCartItems();

    if (!items.length) {
      showMessage(
        "Your shopping bag is empty or contains unavailable products. Please return to the shop."
      );
      payButton.disabled = true;
      return;
    }

    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const state = String(formData.get("state") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^[+0-9\s()-]{7,20}$/.test(phone) ||
      address.length < 8
    ) {
      showMessage(
        "Please check your name, email, phone number and delivery address."
      );
      return;
    }

    /*
     * The existing server checkout route accepts one address field.
     * Combine optional delivery details into that field so we don't
     * have to change the existing backend or payment integration.
     */
    const addressParts = [address];

    if (city) addressParts.push(`City/area: ${city}`);
    if (state) addressParts.push(`State: ${state}`);
    if (notes) addressParts.push(`Delivery notes: ${notes}`);

    const completeAddress = addressParts.join("\n");

    if (completeAddress.length > 500) {
      showMessage(
        "Your combined delivery details are too long. Please shorten the address or notes."
      );
      return;
    }

    payButton.disabled = true;

    const originalButton = payButton.innerHTML;

    payButton.innerHTML =
      '<span class="pay-lock" aria-hidden="true">♙</span>' +
      "<span>Preparing secure payment...</span>";

    try {
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          address: completeAddress,
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity
          }))
        })
      });

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The server returned an unreadable response. Please try again."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error || "The server could not prepare your payment."
        );
      }

      if (typeof result.paymentLink !== "string") {
        throw new Error(
          "The server did not return a Flutterwave payment link. No payment has been started."
        );
      }

      let paymentUrl;

      try {
        paymentUrl = new URL(result.paymentLink);
      } catch {
        throw new Error(
          "The server returned an invalid payment link."
        );
      }

const allowedFlutterwaveHosts = new Set([
  "checkout.flutterwave.com",
  "flutterwave.com",
  "www.flutterwave.com",
  "checkout-v2.dev-flutterwave.com"
]);

const hostname = paymentUrl.hostname.toLowerCase();

const isFlutterwave =
  paymentUrl.protocol === "https:" &&
  paymentUrl.username === "" &&
  paymentUrl.password === "" &&
  allowedFlutterwaveHosts.has(hostname);

if (!isFlutterwave) {
  console.error("Unexpected payment hostname:", hostname);
  throw new Error(
    "Flutterwave returned an unrecognized payment domain. Please try again."
  );
}

window.location.assign(paymentUrl.href);

    } catch (error) {
      showMessage(
        error.message || "Checkout failed. Please try again."
      );

      payButton.disabled = false;
      payButton.innerHTML = originalButton;
    }
  });

  loadProducts();
});
