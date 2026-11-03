document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // 1. AUTOMATIC FOOTER YEAR
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // 2. MOBILE NAVIGATION
  const menuToggle = document.querySelector(".contact-menu-toggle");
  const navigation = document.querySelector(".contact-navigation");

  if (menuToggle && navigation) {
    const openMenu = () => {
      navigation.classList.add("is-open");
      menuToggle.classList.add("is-open");
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close navigation menu");
    };

    const closeMenu = () => {
      navigation.classList.remove("is-open");
      menuToggle.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    };

    menuToggle.addEventListener("click", () => {
      if (navigation.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close menu when clicking outside it.
    document.addEventListener("click", (event) => {
      if (
        navigation.classList.contains("is-open") &&
        !navigation.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    // Close menu with Escape.
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    // Close mobile menu when returning to desktop width.
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) {
        closeMenu();
      }
    });
  }

  // 3. CONTACT FORM
  const contactForm = document.getElementById("contact-form");
  const statusMessage = document.getElementById("contact-form-status");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!contactForm.reportValidity()) {
        return;
      }

      const formData = new FormData(contactForm);

      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const phone = String(formData.get("phone") || "").trim();
      const subject = String(formData.get("subject") || "").trim();
      const message = String(formData.get("message") || "").trim();

      if (!name || !email || !subject || !message) {
        if (statusMessage) {
          statusMessage.textContent =
            "Please complete all required fields before continuing.";
        }
        return;
      }

      // Prepare an email for the visitor's email application.
      // This does NOT send or store the message on the server.
      const recipient = "timabeauty7@gmail.com";

      const emailSubject = `TimaBeauty Enquiry: ${subject}`;

      const emailBody = [
        "Hello TimaBeauty Salon,",
        "",
        "I would like to make an enquiry.",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || "Not provided"}`,
        `Enquiry type: ${subject}`,
        "",
        "Message:",
        message
      ].join("\n");

      const mailtoLink =
        `mailto:${recipient}` +
        `?subject=${encodeURIComponent(emailSubject)}` +
        `&body=${encodeURIComponent(emailBody)}`;

      if (statusMessage) {
        statusMessage.textContent =
          "Your email app should open with your message prepared. Please review and send it there.";
      }

      // Open the visitor's configured email application.
      window.location.href = mailtoLink;
    });
  }

  // 4. SMOOTH SCROLL FOR SAME-PAGE LINKS
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();

        target.scrollIntoView({
          behavior: window.matchMedia(
            "(prefers-reduced-motion: reduce)"
          ).matches
            ? "auto"
            : "smooth",
          block: "start"
        });
      }
    });
  });

  // 5. AOS SCROLL ANIMATIONS
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 850,
      easing: "ease-out-cubic",
      once: true,
      offset: 70,
      mirror: false,
      disable: window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    });
  }

  console.log("TimaBeauty Contact page JavaScript loaded successfully.");
});
