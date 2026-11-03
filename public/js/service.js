document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // 1. Automatically update the footer year
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // 2. Mobile navigation menu
  const menuToggle = document.querySelector(".services-menu-toggle");
  const navigation = document.querySelector(".services-navigation");

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

    // Close the menu after selecting a link
    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close the menu when clicking outside it
    document.addEventListener("click", (event) => {
      if (
        navigation.classList.contains("is-open") &&
        !navigation.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    // Close the menu with Escape
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    // Reset the menu when returning to desktop width
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) {
        closeMenu();
      }
    });
  }

  // 3. Scroll to sections smoothly
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();

        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start"
        });
      }
    });
  });

  // 4. Scroll animations using AOS
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 850,
      easing: "ease-out-cubic",
      once: true,
      offset: 70,
      mirror: false,
      disable: window.matchMedia("(prefers-reduced-motion: reduce)").matches
    });
  }

  // 5. Show a useful message if a service link has a missing destination
  document.querySelectorAll(".services-card-content > a").forEach((link) => {
    link.addEventListener("click", () => {
      // Booking links currently pass the selected service in the URL.
      // The booking page must read that parameter to preselect the service.
    });
  });

  console.log("TimaBeauty Services page JavaScript loaded successfully.");
});
