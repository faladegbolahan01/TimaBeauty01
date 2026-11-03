
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => document.getElementById(id);

    const elements = {
        total: $("totalAppointments"),
        pending: $("pendingAppointments"),
        confirmed: $("confirmedAppointments"),
        today: $("todayAppointments"),
        table: $("bookingsTable"),
        search: $("searchBookings"),
        statusFilter: $("statusFilter"),
        dateFilter: $("dateFilter"),
        refresh: $("refreshBookings"),
        message: $("bookingMessage"),
        totalValue: $("totalBookingValue"),
        deposits: $("depositsReceived"),
        balance: $("outstandingBalance"),

        ordersTable: $("shopOrdersTable"),
        ordersSearch: $("searchShopOrders"),
        ordersPaymentFilter: $("shopPaymentFilter"),
        ordersRefresh: $("refreshOrders"),
        ordersMessage: $("shopOrdersMessage"),
        totalOrders: $("totalShopOrders"),
        paidOrders: $("paidShopOrders"),
        salesTotal: $("shopSalesTotal")
    };

    const state = {
        bookings: [],
        orders: [],
        bookingsLoading: false,
        ordersLoading: false
    };

    const naira = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
    });

    function money(amount) {
        const number = Number(amount);
        return naira.format(
            Number.isFinite(number) && number >= 0 ? number : 0
        );
    }

    function safeNumber(...values) {
        for (const value of values) {
            const number = Number(value);
            if (value !== null && value !== "" && Number.isFinite(number)) {
                return Math.max(0, number);
            }
        }
        return 0;
    }

    function showMessage(element, message, type = "") {
        if (!element) return;
        element.textContent = message;
        element.className = element.id === "shopOrdersMessage"
            ? "orders-message"
            : "message";
        if (type) {
            element.classList.add(
                type === "error" ? "orders-error" :
                type === "success" ? "orders-success" : type
            );
        }
    }

    function showTableMessage(table, message, colspan = 7) {
        if (!table) return;

        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = colspan;
        cell.className = "table-message";
        cell.textContent = message;
        row.appendChild(cell);
        table.replaceChildren(row);
    }

    async function requestJSON(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            credentials: "same-origin",
            headers: {
                Accept: "application/json",
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...(options.headers || {})
            }
        });

        const contentType = response.headers.get("content-type") || "";
        let data = null;

        if (contentType.includes("application/json")) {
            data = await response.json();
        }

        if (!response.ok) {
            const error = new Error(
                data?.message || `Request failed (${response.status})`
            );
            error.status = response.status;
            throw error;
        }

        if (!data) {
            throw new Error("The server did not return JSON.");
        }

        return data;
    }

    function dateOnly(dateString) {
        if (!dateString) return "";

        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateString));
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;

        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return "";
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    function formatDate(dateString) {
        const date = dateOnly(dateString);
        if (!date) return "Date unavailable";

        const [year, month, day] = date.split("-").map(Number);
        return new Date(year, month - 1, day).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function todayLocal() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }

    function cell(text, className = "") {
        const td = document.createElement("td");
        td.textContent = text ?? "";
        if (className) td.className = className;
        return td;
    }

    function appendText(parent, tag, text, className) {
        const node = document.createElement(tag);
        node.textContent = text || "";
        if (className) node.className = className;
        parent.appendChild(node);
        return node;
    }

    // ---------------- APPOINTMENTS ----------------

    function statusLabel(status) {
        return ({
            pending_review: "Pending review",
            confirmed: "Confirmed",
            rejected: "Rejected"
        })[status] || "Unknown";
    }

    function visibleBookings() {
        const query = (elements.search?.value || "").trim().toLowerCase();
        const status = elements.statusFilter?.value || "all";
        const date = elements.dateFilter?.value || "";

        return state.bookings.filter((booking) => {
            const searchable = [
                booking.name, booking.phone, booking.email,
                booking.service, booking.hairstyle, booking.id
            ].filter(Boolean).join(" ").toLowerCase();

            return (!query || searchable.includes(query)) &&
                (status === "all" || booking.status === status) &&
                (!date || dateOnly(booking.date) === date);
        });
    }

    function customerCell(booking) {
        const td = document.createElement("td");
        appendText(td, "span", booking.name || "Unnamed customer", "customer-name");
        appendText(td, "span", booking.phone || "No phone provided", "customer-contact");
        return td;
    }

    function serviceCell(booking) {
        const td = document.createElement("td");
        appendText(td, "span", booking.service || "Service unavailable", "service-name");
        appendText(td, "span", booking.hairstyle || "No hairstyle specified", "hairstyle-name");
        return td;
    }

    function bookingStatusCell(booking) {
        const td = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `status-badge status-${booking.status || "unknown"}`;
        badge.textContent = statusLabel(booking.status);
        td.appendChild(badge);
        return td;
    }

    function bookingActionCell(booking) {
        const td = document.createElement("td");
        const wrapper = document.createElement("div");
        wrapper.className = "action-buttons";

        if (booking.status === "pending_review") {
            for (const action of ["confirm", "reject"]) {
                const button = document.createElement("button");
                button.type = "button";
                button.className = action === "confirm"
                    ? "action-button action-confirm"
                    : "action-button action-reject";
                button.textContent = action === "confirm" ? "Confirm" : "Reject";
                button.dataset.action = action;
                button.dataset.id = booking.id;
                wrapper.appendChild(button);
            }
        } else {
            appendText(wrapper, "span", "No action available", "hairstyle-name");
        }

        td.appendChild(wrapper);
        return td;
    }

    function renderBookings() {
        if (!elements.table) return;

        const bookings = visibleBookings();

        if (!bookings.length) {
            showTableMessage(
                elements.table,
                state.bookings.length
                    ? "No appointments match your search or filters."
                    : "No appointments returned by the server."
            );
            return;
        }

        const fragment = document.createDocumentFragment();

        for (const booking of bookings) {
            const tr = document.createElement("tr");
            tr.append(
                customerCell(booking),
                serviceCell(booking),
                cell(`${formatDate(booking.date)} · ${booking.time || "Time unavailable"}`),
                cell(money(booking.servicePrice), "money"),
                cell(money(booking.depositAmount), "money"),
                bookingStatusCell(booking),
                bookingActionCell(booking)
            );
            fragment.appendChild(tr);
        }

        elements.table.replaceChildren(fragment);
    }

    function renderBookingStatistics() {
        const bookings = state.bookings;

        const pending = bookings.filter(b => b.status === "pending_review").length;
        const confirmed = bookings.filter(b => b.status === "confirmed").length;
        const today = bookings.filter(b => dateOnly(b.date) === todayLocal()).length;

        if (elements.total) elements.total.textContent = bookings.length;
        if (elements.pending) elements.pending.textContent = pending;
        if (elements.confirmed) elements.confirmed.textContent = confirmed;
        if (elements.today) elements.today.textContent = today;

        const totalValue = bookings.reduce(
            (sum, b) => sum + safeNumber(b.servicePrice), 0
        );

        const deposits = bookings.reduce((sum, b) => {
            const paid = ["paid", "successful"].includes(
                String(b.paymentStatus || "").toLowerCase()
            );
            return sum + (paid ? safeNumber(b.depositAmount) : 0);
        }, 0);

        const balance = bookings.reduce((sum, b) => {
            return b.status === "confirmed"
                ? sum + safeNumber(b.balanceAmount)
                : sum;
        }, 0);

        if (elements.totalValue) elements.totalValue.textContent = money(totalValue);
        if (elements.deposits) elements.deposits.textContent = money(deposits);
        if (elements.balance) elements.balance.textContent = money(balance);
    }

    async function loadBookings() {
        if (state.bookingsLoading) return;
        state.bookingsLoading = true;

        if (elements.refresh) {
            elements.refresh.disabled = true;
            elements.refresh.textContent = "Loading...";
        }

        showMessage(elements.message, "Loading appointment data...");
        showTableMessage(elements.table, "Loading appointments...");

        try {
            const data = await requestJSON("/api/admin/bookings");

            if (!Array.isArray(data.bookings)) {
                throw new Error("Unexpected response from the booking API.");
            }

            state.bookings = data.bookings;
            renderBookingStatistics();
            renderBookings();

            showMessage(
                elements.message,
                `${state.bookings.length} appointment(s) loaded.`,
                "success"
            );
        } catch (error) {
            console.error("Could not load bookings:", error);
            state.bookings = [];
            renderBookingStatistics();

            showTableMessage(
                elements.table,
                error.status === 401 || error.status === 403
                    ? "Please sign in as an authorized administrator."
                    : "Could not load appointments. Check the server connection."
            );

            showMessage(
                elements.message,
                error.status === 401 || error.status === 403
                    ? "Administrator authentication is required."
                    : error.message || "Could not load appointments.",
                "error"
            );
        } finally {
            state.bookingsLoading = false;
            if (elements.refresh) {
                elements.refresh.disabled = false;
                elements.refresh.textContent = "↻ Refresh";
            }
        }
    }

    async function updateBookingStatus(id, action) {
        const booking = state.bookings.find(b => String(b.id) === String(id));
        if (!booking) {
            showMessage(elements.message, "Appointment not found.", "error");
            return;
        }

        if (!window.confirm(`Are you sure you want to ${action} this appointment?`)) {
            return;
        }

        try {
            const result = await requestJSON(
                `/api/admin/bookings/${encodeURIComponent(id)}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: action === "confirm" ? "confirmed" : "rejected"
                    })
                }
            );

            if (!result.booking) {
                throw new Error("The server did not confirm the update.");
            }

            showMessage(elements.message, "Appointment status updated.", "success");
            await loadBookings();
        } catch (error) {
            showMessage(
                elements.message,
                error.message || "Could not update appointment status.",
                "error"
            );
        }
    }

    // ---------------- SHOP ORDERS ----------------

    function getOrdersFromResponse(data) {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.orders)) return data.orders;
        if (Array.isArray(data.shopOrders)) return data.shopOrders;
        if (Array.isArray(data.data)) return data.data;
        return null;
    }

    function orderPaymentStatus(order) {
        return String(
            order.paymentStatus ??
            order.payment_status ??
            order.payment_state ??
            "unknown"
        ).toLowerCase();
    }

    function orderStatus(order) {
        return String(
            order.orderStatus ??
            order.order_status ??
            order.status ??
            "unknown"
        );
    }

    function orderAmount(order) {
        return safeNumber(
            order.total,
            order.totalAmount,
            order.total_amount,
            order.amount,
            order.amountPaid
        );
    }

    function orderReference(order) {
        return String(
            order.reference ??
            order.tx_ref ??
            order.txRef ??
            order.id ??
            "Unavailable"
        );
    }

    function orderTransactionId(order) {
        return String(
            order.transactionId ??
            order.transaction_id ??
            order.transactionID ??
            "—"
        );
    }

    function orderCustomerName(order) {
        const customer = order.customer || {};
        return String(
            order.customerName ??
            order.customer_name ??
            customer.name ??
            order.name ??
            order.fullName ??
            order.full_name ??
            "Customer"
        );
    }

    function orderCustomerContact(order) {
        const customer = order.customer || {};
        return String(
            order.email ??
            order.customerEmail ??
            order.customer_email ??
            customer.email ??
            order.phone ??
            order.customerPhone ??
            customer.phone ??
            ""
        );
    }

    function orderProducts(order) {
        const products = order.items || order.products || order.cart || [];

        if (typeof products === "string") return products;
        if (!Array.isArray(products)) {
            return String(order.productName || order.product_name || "Product details unavailable");
        }

        if (!products.length) return "Product details unavailable";

        return products.map(item => {
            if (typeof item === "string") return item;

            const name = item.name || item.title || item.productName ||
                item.product_name || "Product";
            const quantity = safeNumber(item.quantity, item.qty) || 1;

            return `${name} × ${quantity}`;
        }).join(", ");
    }

    function paymentLabel(status) {
        if (status === "paid" || status === "successful" || status === "completed") {
            return { text: "Paid", className: "paid" };
        }

        if (status === "failed" || status === "cancelled" || status === "canceled") {
            return { text: "Failed", className: "failed" };
        }

        if (status === "not_started" || status === "pending" || status === "unknown") {
            return { text: status === "unknown" ? "Unknown" : "Pending", className: "pending" };
        }

        return { text: status.replaceAll("_", " "), className: "pending" };
    }

    function visibleOrders() {
        const query = (elements.ordersSearch?.value || "").trim().toLowerCase();
        const filter = elements.ordersPaymentFilter?.value || "all";

        return state.orders.filter(order => {
            const searchable = [
                orderCustomerName(order),
                orderCustomerContact(order),
                orderReference(order),
                orderTransactionId(order),
                orderProducts(order)
            ].join(" ").toLowerCase();

            const status = orderPaymentStatus(order);
            const paid = ["paid", "successful", "completed"].includes(status);
            const failed = ["failed", "cancelled", "canceled"].includes(status);

            const matchesFilter =
                filter === "all" ||
                (filter === "paid" && paid) ||
                (filter === "failed" && failed) ||
                (filter === "pending" && !paid && !failed);

            return (!query || searchable.includes(query)) && matchesFilter;
        });
    }

    function renderOrders() {
        if (!elements.ordersTable) return;

        const orders = visibleOrders();

        if (!orders.length) {
            showTableMessage(
                elements.ordersTable,
                state.orders.length
                    ? "No orders match your search or payment filter."
                    : "No shop orders were returned by the server."
            );
            return;
        }

        const fragment = document.createDocumentFragment();

        for (const order of orders) {
            const tr = document.createElement("tr");

            const customer = document.createElement("td");
            appendText(customer, "span", orderCustomerName(order), "order-customer");
            appendText(customer, "span", orderCustomerContact(order), "order-secondary");

            const reference = document.createElement("td");
            reference.textContent = orderReference(order);

            const products = document.createElement("td");
            products.className = "order-products";
            products.textContent = orderProducts(order);

            const amount = document.createElement("td");
            amount.textContent = money(orderAmount(order));

            const payment = document.createElement("td");
            const badge = document.createElement("span");
            const statusInfo = paymentLabel(orderPaymentStatus(order));
            badge.className = `order-badge ${statusInfo.className}`;
            badge.textContent = statusInfo.text;
            payment.appendChild(badge);

            const status = document.createElement("td");
            status.textContent = orderStatus(order).replaceAll("_", " ");

            const transaction = document.createElement("td");
            transaction.textContent = orderTransactionId(order);

            tr.append(customer, reference, products, amount, payment, status, transaction);
            fragment.appendChild(tr);
        }

        elements.ordersTable.replaceChildren(fragment);
    }

    function renderOrderStatistics() {
        const paid = state.orders.filter(order =>
            ["paid", "successful", "completed"].includes(orderPaymentStatus(order))
        );

        const sales = paid.reduce((sum, order) => sum + orderAmount(order), 0);

        if (elements.totalOrders) elements.totalOrders.textContent = state.orders.length;
        if (elements.paidOrders) elements.paidOrders.textContent = paid.length;
        if (elements.salesTotal) elements.salesTotal.textContent = money(sales);
    }

    async function loadOrders() {
        if (state.ordersLoading) return;
        state.ordersLoading = true;

        if (elements.ordersRefresh) {
            elements.ordersRefresh.disabled = true;
            elements.ordersRefresh.textContent = "Loading...";
        }

        showMessage(elements.ordersMessage, "Loading shop orders...");
        showTableMessage(elements.ordersTable, "Loading shop orders...");

        try {
            const data = await requestJSON("/api/admin/orders");
            const orders = getOrdersFromResponse(data);

            if (!orders) {
                throw new Error(
                    "The orders API response does not contain an orders array. Check /api/admin/orders in server.js."
                );
            }

            state.orders = orders;
            renderOrderStatistics();
            renderOrders();

            showMessage(
                elements.ordersMessage,
                `${orders.length} shop order(s) loaded.`,
                "success"
            );
        } catch (error) {
            console.error("Could not load shop orders:", error);
            state.orders = [];
            renderOrderStatistics();

            showTableMessage(
                elements.ordersTable,
                error.status === 401 || error.status === 403
                    ? "Administrator login is required to view shop orders."
                    : error.status === 404
                        ? "The /api/admin/orders route was not found."
                        : "Unable to load shop orders. Check the server and API response."
            );

            showMessage(
                elements.ordersMessage,
                error.status === 401 || error.status === 403
                    ? "Please sign in as an authorized administrator."
                    : error.message || "Could not load shop orders.",
                "error"
            );
        } finally {
            state.ordersLoading = false;
            if (elements.ordersRefresh) {
                elements.ordersRefresh.disabled = false;
                elements.ordersRefresh.textContent = "↻ Refresh Orders";
            }
        }
    }

    // ---------------- EVENT LISTENERS ----------------
    
function restoreDashboard() {
    localStorage.removeItem("timabeautyDashboardCleared");
    loadBookings();
    loadOrders();
}

elements.refresh?.addEventListener("click", restoreDashboard);
elements.ordersRefresh?.addEventListener("click", restoreDashboard);


    elements.search?.addEventListener("input", renderBookings);
    elements.statusFilter?.addEventListener("change", renderBookings);
    elements.dateFilter?.addEventListener("change", renderBookings);

    elements.table?.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button || button.disabled) return;

        const id = button.dataset.id;
        const action = button.dataset.action;

        if (id && ["confirm", "reject"].includes(action)) {
            updateBookingStatus(id, action);
        }
    });

    elements.ordersSearch?.addEventListener("input", renderOrders);
    elements.ordersPaymentFilter?.addEventListener("change", renderOrders);

    // Sidebar active link
    document.querySelectorAll(".sidebar-nav .nav-link").forEach(link => {
        link.addEventListener("click", () => {
            document.querySelectorAll(".sidebar-nav .nav-link")
                .forEach(item => item.classList.remove("active"));
            link.classList.add("active");
        });
    });

    // Date and footer year
    const now = new Date();

    if ($("currentDate")) {
        $("currentDate").textContent = new Intl.DateTimeFormat("en-NG", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(now);
    }

    if ($("currentYear")) {
        $("currentYear").textContent = now.getFullYear();
    }

    if (typeof AOS !== "undefined") {
        AOS.init({
            duration: 750,
            easing: "ease-out-cubic",
            once: true,
            offset: 60,
            mirror: false,
            disable: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        });
    }

    if (localStorage.getItem("timabeautyDashboardCleared") !== "true") {
    loadBookings();
    loadOrders();
} else {
    state.bookings = [];
    state.orders = [];

    renderBookingStatistics();
    renderBookings();

    renderOrderStatistics();
    renderOrders();

    showMessage(elements.message, "Dashboard cleared. Saved appointments are safe.");
    showMessage(elements.ordersMessage, "Dashboard cleared. Saved orders are safe.");
}
    // Clear dashboard display without deleting saved records
const clearDashboardButton = document.getElementById("clearDashboard");

if (clearDashboardButton) {
    clearDashboardButton.addEventListener("click", () => {
        const confirmed = confirm(
            "Hide all appointments and shop orders? Saved records will not be deleted."
        );

        if (!confirmed) return;

        localStorage.setItem("timabeautyDashboardCleared", "true");

        alert("Dashboard cleared. Your saved records are safe.");
        location.reload();
    });
}
});
