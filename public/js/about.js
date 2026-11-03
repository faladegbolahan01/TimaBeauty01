
// =============================================
// TIMABEAUTY SALON — ABOUT PAGE JAVASCRIPT
// File: public/js/about.js
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // 1. UPDATE FOOTER YEAR
  const yearElement = document.querySelector("#current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // 2. MOBILE NAVIGATION
  const menuToggle = document.querySelector(".about-menu-toggle");
  const navigation = document.querySelector(".about-navigation");

  if (menuToggle && navigation) {
    const closeMenu = () => {
      navigation.classList.remove("is-open");
      menuToggle.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    };

    const openMenu = () => {
      navigation.classList.add("is-open");
      menuToggle.classList.add("is-open");
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close navigation menu");
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = navigation.classList.contains("is-open");

      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close the menu after a navigation link is selected.
    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close the menu when clicking outside it.
    document.addEventListener("click", (event) => {
      if (
        navigation.classList.contains("is-open") &&
        !navigation.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    // Close the menu with the Escape key.
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    // Close the mobile menu when returning to desktop width.
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) {
        closeMenu();
      }
    });
  }

  // 3. SCROLL ANIMATIONS
  // AOS is optional. The page still works without it.
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

  // 4. SMOOTH SCROLLING FOR SAME-PAGE LINKS
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const targetElement = document.querySelector(targetId);

      if (!targetElement) {
        return;
      }

      event.preventDefault();

      targetElement.scrollIntoView({
        behavior: window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? "auto"
          : "smooth",
        block: "start"
      });
    });
  });

  console.log("TimaBeauty About page JavaScript loaded.");
});
