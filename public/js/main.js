
/* =========================================
   TIMABEAUTY SALON — MAIN JAVASCRIPT
   Shared functionality for all website pages
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Automatically update the footer year
  const yearElements = document.querySelectorAll("#current-year");

  yearElements.forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  // Also support footers using the class "current-year"
  document.querySelectorAll(".current-year").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  // 2. Mobile navigation menu
  const menuToggle = document.querySelector(
    ".menu-toggle, .nav-toggle, .hamburger"
  );

  const navigation = document.querySelector(
    ".navigation, .nav-links, .navbar-menu"
  );

  if (menuToggle && navigation) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("active");

      menuToggle.classList.toggle("active", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
      );
    });

    // Close the menu after clicking a navigation link
    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navigation.classList.remove("active");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
      });
    });

    // Close the menu when the user clicks outside it
    document.addEventListener("click", (event) => {
      if (
        !navigation.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        navigation.classList.remove("active");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // 3. Highlight the current page in the navigation
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll("nav a, .navigation a, .nav-links a").forEach(
    (link) => {
      const linkPage = link.getAttribute("href");

      if (!linkPage || linkPage.startsWith("#") || linkPage.startsWith("http")) {
        return;
      }

      const normalizedLink = linkPage.split("/").pop();

      if (normalizedLink === currentPage) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    }
  );

  // 4. Smooth scrolling for links to sections on the same page
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
          block: "start",
        });
      }
    });
  });

  // 5. Initialize AOS scroll animations, if its library is loaded
 
  // 6. Prevent accidental double submission of forms
  document.querySelectorAll("form[data-prevent-double-submit]").forEach(
    (form) => {
      form.addEventListener("submit", () => {
        const submitButton = form.querySelector(
          'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.dataset.originalText =
            submitButton.textContent || submitButton.value || "";

          if (submitButton.tagName === "BUTTON") {
            submitButton.textContent = "Please wait...";
          } else {
            submitButton.value = "Please wait...";
          }
        }
      });
    }
  );

  console.log("TimaBeauty Salon main.js loaded successfully.");
});
