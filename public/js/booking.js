
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // =========================================
    // TIMABEAUTY SALON BOOKING SYSTEM
    // =========================================

    const bookingForm = document.getElementById("booking-form");
    const serviceSelect = document.getElementById("booking-service");
    const hairstyleSelect = document.getElementById("booking-hairstyle");
    const hairstyleField = document.getElementById("hairstyle-field");
    const hairstyleHelp = document.getElementById("hairstyle-help");

    const selectedStyleDisplay =
        document.getElementById("selected-hairstyle-name");
    const priceDisplay =
        document.getElementById("booking-service-price");
    const depositDisplay =
        document.getElementById("booking-deposit-amount");
    const balanceDisplay =
        document.getElementById("booking-balance-amount");
    const bookingStatus =
        document.getElementById("booking-form-status");
    const bookingDate =
        document.getElementById("booking-date");

    const submitButton = bookingForm
        ? bookingForm.querySelector('button[type="submit"]')
        : null;

    // =========================================
    // HAIRSTYLE CATALOG
    // =========================================

    const hairstyleCatalog = {
        "Hair Styling": [
            { name: "Basic Styling", price: 10000 },
            { name: "Premium Styling", price: 15000 },
            { name: "Luxury Styling", price: 25000 }
        ],
        "Braids": [
            { name: "Knotless Braids", price: 35000 },
            { name: "Box Braids", price: 25000 },
            { name: "Cornrows", price: 15000 },
            { name: "Ghana Weaving", price: 20000 }
        ],
        "Wig Installation": [
            { name: "Basic Installation", price: 10000 },
            { name: "Installation and Styling", price: 15000 },
            { name: "Premium Installation", price: 25000 }
        ],
        "Hair Treatment": [
            { name: "Basic Treatment", price: 10000 },
            { name: "Deep Conditioning", price: 15000 },
            { name: "Premium Treatment", price: 20000 }
        ],
        "Hair Colouring": [
            { name: "Basic Colouring", price: 15000 },
            { name: "Full Colouring", price: 25000 },
            { name: "Premium Colouring", price: 35000 }
        ],
        "Home Services": [
            { name: "Basic Home Service", price: 20000 },
            { name: "Home Braids", price: 40000 },
            { name: "Premium Home Styling", price: 50000 }
        ]
    };

    // =========================================
    // CURRENCY FORMAT
    // =========================================

    function formatNaira(amount) {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }).format(amount);
    }

    // =========================================
    // STATUS MESSAGES
    // =========================================

    function showStatus(message, type = "info") {
        if (!bookingStatus) {
            window.alert(message);
            return;
        }

        bookingStatus.textContent = message;
        bookingStatus.dataset.status = type;
        bookingStatus.style.whiteSpace = "pre-line";
        bookingStatus.setAttribute("role", "status");
        bookingStatus.setAttribute("aria-live", "polite");
    }

    // =========================================
    // UPDATE PRICE SUMMARY
    // =========================================

    function updatePriceSummary() {
        const service = serviceSelect?.value || "";
        const hairstyle = hairstyleSelect?.value || "";
        const styles = hairstyleCatalog[service] || [];

        const selectedStyle = styles.find(
            style => style.name === hairstyle
        );

        if (!selectedStyle) {
            if (selectedStyleDisplay) {
                selectedStyleDisplay.textContent =
                    "Choose a service and style";
            }

            if (priceDisplay) {
                priceDisplay.textContent = formatNaira(0);
            }

            if (depositDisplay) {
                depositDisplay.textContent = formatNaira(0);
            }

            if (balanceDisplay) {
                balanceDisplay.textContent = formatNaira(0);
            }

            return;
        }

        const totalPrice = selectedStyle.price;
        const totalKobo = totalPrice * 100;
        const depositKobo = Math.round(totalKobo * 0.30);
        const balanceKobo = totalKobo - depositKobo;

        if (selectedStyleDisplay) {
            selectedStyleDisplay.textContent = selectedStyle.name;
        }

        if (priceDisplay) {
            priceDisplay.textContent = formatNaira(totalPrice);
        }

        if (depositDisplay) {
            depositDisplay.textContent =
                formatNaira(depositKobo / 100);
        }

        if (balanceDisplay) {
            balanceDisplay.textContent =
                formatNaira(balanceKobo / 100);
        }
    }

    // =========================================
    // UPDATE HAIRSTYLE OPTIONS
    // =========================================

    function updateHairstyleOptions() {
        if (!serviceSelect || !hairstyleSelect) {
            updatePriceSummary();
            return;
        }

        const service = serviceSelect.value;
        const styles = hairstyleCatalog[service] || [];

        hairstyleSelect.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = styles.length
            ? "Choose your preferred hairstyle"
            : "Select a service first";

        hairstyleSelect.appendChild(placeholder);

        styles.forEach(style => {
            const option = document.createElement("option");
            option.value = style.name;
            option.textContent =
                `${style.name} — ${formatNaira(style.price)}`;

            hairstyleSelect.appendChild(option);
        });

        if (hairstyleField) {
            hairstyleField.hidden = !service;
        }

        hairstyleSelect.required = Boolean(service);

        if (hairstyleHelp) {
            hairstyleHelp.textContent = service
                ? "Choose a hairstyle to see your estimated price and deposit."
                : "Select a service first to see available hairstyles.";
        }

        updatePriceSummary();
    }

    // =========================================
    // MINIMUM BOOKING DATE
    // =========================================

    if (bookingDate) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        bookingDate.min = `${year}-${month}-${day}`;
    }

    // =========================================
    // PRESELECT SERVICE FROM URL
    // =========================================

    if (serviceSelect) {
        const params = new URLSearchParams(window.location.search);
        const requestedService = params.get("service");

        const aliases = {
            "hair-styling": "Hair Styling",
            "braids": "Braids",
            "wig-installation": "Wig Installation",
            "hair-treatment": "Hair Treatment",
            "hair-colouring": "Hair Colouring",
            "hair-coloring": "Hair Colouring",
            "home-services": "Home Services"
        };

        if (requestedService) {
            const normalized =
                aliases[requestedService.toLowerCase()] ||
                requestedService;

            const matchingOption = Array.from(
                serviceSelect.options
            ).find(option => option.value === normalized);

            if (matchingOption) {
                serviceSelect.value = normalized;
            }
        }
    }

    // =========================================
    // EVENT LISTENERS
    // =========================================

    if (serviceSelect) {
        serviceSelect.addEventListener(
            "change",
            updateHairstyleOptions
        );
    }

    if (hairstyleSelect) {
        hairstyleSelect.addEventListener(
            "change",
            updatePriceSummary
        );
    }

    updateHairstyleOptions();

    // =========================================
    // READ SERVER RESPONSE SAFELY
    // =========================================

    async function readServerResponse(response) {
        const responseText = await response.text();

        if (!responseText.trim()) {
            throw new Error(
                `The server returned an empty response (HTTP ${response.status}). ` +
                "Your booking may not have been saved. Check the server before retrying."
            );
        }

        let result;

        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error(
                `The server returned an invalid response (HTTP ${response.status}). ` +
                "Please check the server logs."
            );
        }

        if (!response.ok) {
            throw new Error(
                result.error ||
                `The booking request failed (HTTP ${response.status}).`
            );
        }

        return result;
    }

    // =========================================
    // SUBMIT BOOKING AND START PAYMENT
    // =========================================

    if (bookingForm) {
        bookingForm.addEventListener("submit", async event => {
            event.preventDefault();

            if (!bookingForm.checkValidity()) {
                bookingForm.reportValidity();
                return;
            }

            const name =
                document.getElementById("booking-name")
                    ?.value.trim() || "";
            const phone =
                document.getElementById("booking-phone")
                    ?.value.trim() || "";
            const email =
                document.getElementById("booking-email")
                    ?.value.trim() || "";

            const service = serviceSelect?.value || "";
            const hairstyle = hairstyleSelect?.value || "";
            const date = bookingDate?.value || "";

            const time =
                document.getElementById("booking-time")
                    ?.value || "";
            const notes =
                document.getElementById("booking-notes")
                    ?.value.trim() || "";

            const styles = hairstyleCatalog[service] || [];
            const selectedStyle = styles.find(
                style => style.name === hairstyle
            );

            if (!selectedStyle) {
                showStatus(
                    "Please select a service and hairstyle.",
                    "error"
                );
                hairstyleSelect?.focus();
                return;
            }

            if (!name || !phone || !service || !date || !time) {
                showStatus(
                    "Please complete all required booking fields.",
                    "error"
                );
                return;
            }

            if (!email) {
                showStatus(
                    "Please enter your email address to continue to payment.",
                    "error"
                );
                document.getElementById("booking-email")?.focus();
                return;
            }

            const originalButtonText = submitButton
                ? submitButton.textContent
                : "";

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Submitting...";
            }

            showStatus(
                "Sending your appointment request...",
                "info"
            );

            let bookingWasSaved = false;

            try {
                const response = await fetch("/api/bookings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        phone,
                        email,
                        service,
                        hairstyle,
                        date,
                        time,
                        notes
                    })
                });

                const result = await readServerResponse(response);

                if (!result.booking || !result.booking.id) {
                    throw new Error(
                        "The server response did not contain a booking reference. " +
                        "Please check the admin dashboard before submitting again."
                    );
                }

                const booking = result.booking;
                bookingWasSaved = true;

                const servicePrice = Number(
                    booking.servicePrice ?? selectedStyle.price
                );

                const depositAmount = Number(
                    booking.depositAmount ??
                    Math.round(servicePrice * 0.30)
                );

                const balanceAmount = Number(
                    booking.balanceAmount ??
                    servicePrice - depositAmount
                );

                showStatus(
                    [
                        "Your appointment request has been saved!",
                        "",
                        `Reference: ${booking.id}`,
                        `Service: ${booking.service || service}`,
                        `Hairstyle: ${booking.hairstyle || hairstyle}`,
                        `Service price: ${formatNaira(servicePrice)}`,
                        `30% deposit due now: ${formatNaira(depositAmount)}`,
                        `70% balance at salon: ${formatNaira(balanceAmount)}`,
                        "",
                        "Connecting you to secure Flutterwave checkout..."
                    ].join("\n"),
                    "info"
                );

                const paymentResponse = await fetch(
                    `/api/bookings/${encodeURIComponent(booking.id)}/pay-deposit`,
                    {
                        method: "POST",
                        headers: {
                            "Accept": "application/json"
                        }
                    }
                );

                const paymentResult =
                    await readServerResponse(paymentResponse);

                if (!paymentResult.paymentLink) {
                    throw new Error(
                        "Your booking was saved, but checkout could not start. " +
                        `Keep reference ${booking.id} and contact the salon. ` +
                        "Please do not submit the same booking again."
                    );
                }

                // Redirect to Flutterwave's secure hosted checkout.
                window.location.assign(paymentResult.paymentLink);

            } catch (error) {
                console.error(
                    "Booking/payment submission error:",
                    error
                );

                if (bookingWasSaved) {
                    showStatus(
                        `${error.message || "Checkout could not start."}\n\n` +
                        "Your appointment request may already be saved. " +
                        "Please contact the salon before trying to book again.",
                        "error"
                    );
                } else {
                    showStatus(
                        error.message ||
                        "Something went wrong while submitting your booking.",
                        "error"
                    );
                }

            } finally {
                if (submitButton && !bookingWasSaved) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                } else if (submitButton && bookingWasSaved) {
                    submitButton.disabled = true;
                    submitButton.textContent = "Booking Saved";
                }
            }
        });
    }

    // =========================================
    // MOBILE NAVIGATION
    // =========================================

    const menuToggle =
        document.querySelector(".booking-menu-toggle");
    const navigation =
        document.querySelector(".booking-navigation");

    if (menuToggle && navigation) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navigation.classList.toggle("is-open");
            menuToggle.classList.toggle("is-open", isOpen);

            menuToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });

        navigation.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navigation.classList.remove("is-open");
                menuToggle.classList.remove("is-open");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );
            });
        });
    }

    // =========================================
    // SMOOTH SCROLLING
    // =========================================

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", event => {
            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            const target = document.querySelector(targetId);

            if (target) {
                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });

    // =========================================
    // AOS ANIMATIONS
    // =========================================

    if (typeof AOS !== "undefined") {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 80
        });
    }
        // =========================================
    // DISPLAY FLUTTERWAVE PAYMENT RESULT
    // =========================================
    const paymentParams = new URLSearchParams(window.location.search);
    const paymentResult = paymentParams.get("payment");
    const bookingReference = paymentParams.get("reference");

    if (paymentResult === "success") {
        showStatus(
            `Your deposit payment was verified successfully!\nBooking reference: ${bookingReference || "Please check with the salon."}\nYour appointment is awaiting salon confirmation.`,
            "success"
        );
    } else if (paymentResult === "failed") {
        showStatus(
            `We could not verify your deposit payment.\nBooking reference: ${bookingReference || "Please check with the salon."}\nPlease contact the salon before paying again.`,
            "error"
        );
    }
});
