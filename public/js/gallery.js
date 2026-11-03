document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // 1. Automatically update the footer year
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // 2. Mobile navigation menu
  const menuToggle = document.querySelector(".gallery-menu-toggle");
  const navigation = document.querySelector(".gallery-navigation");

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
      navigation.classList.contains("is-open") ? closeMenu() : openMenu();
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
      if (
        navigation.classList.contains("is-open") &&
        !navigation.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  // 3. Gallery category filters
  const filterButtons = document.querySelectorAll(".gallery-filter");
  const galleryItems = document.querySelectorAll(".gallery-item");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedCategory = button.dataset.filter;

      filterButtons.forEach((filter) => {
        const isActive = filter === button;
        filter.classList.toggle("active", isActive);
        filter.setAttribute("aria-pressed", String(isActive));
      });

      galleryItems.forEach((item) => {
        const matches =
          selectedCategory === "all" ||
          item.dataset.category === selectedCategory;

        item.hidden = !matches;
      });
    });
  });

  // 4. Image viewer elements
  const lightbox = document.querySelector(".gallery-lightbox");
  const lightboxImage = document.querySelector(".gallery-lightbox-image");
  const lightboxCaption = document.querySelector(".gallery-lightbox-caption");
  const closeButton = document.querySelector(".gallery-lightbox-close");
  const previousButton = document.querySelector(".gallery-lightbox-prev");
  const nextButton = document.querySelector(".gallery-lightbox-next");
  const photoButtons = Array.from(document.querySelectorAll(".gallery-photo"));

  let currentImageIndex = 0;
  let lastFocusedElement = null;

  const visiblePhotoButtons = () => {
    return photoButtons.filter((button) => {
      const item = button.closest(".gallery-item");
      return item && !item.hidden;
    });
  };

  const showImage = (button) => {
    if (!button || !lightboxImage) return;

    const imageUrl = button.dataset.image;
    const image = button.querySelector("img");
    const caption = button.dataset.caption || image?.alt || "Gallery inspiration";

    if (!imageUrl) return;

    lightboxImage.src = imageUrl;
    lightboxImage.alt = image?.alt || caption;

    if (lightboxCaption) {
      lightboxCaption.textContent = caption;
    }
  };

  const openLightbox = (button) => {
    if (!lightbox) return;

    const visiblePhotos = visiblePhotoButtons();
    currentImageIndex = visiblePhotos.indexOf(button);

    if (currentImageIndex < 0) return;

    lastFocusedElement = button;
    showImage(button);

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("gallery-lightbox-open");

    closeButton?.focus();
  };

  const closeLightbox = () => {
    if (!lightbox) return;

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("gallery-lightbox-open");

    if (lightboxImage) {
      lightboxImage.removeAttribute("src");
    }

    lastFocusedElement?.focus();
  };

  const changeImage = (direction) => {
    const visiblePhotos = visiblePhotoButtons();

    if (!visiblePhotos.length) return;

    currentImageIndex =
      (currentImageIndex + direction + visiblePhotos.length) %
      visiblePhotos.length;

    showImage(visiblePhotos[currentImageIndex]);
  };

  // Open an image when its card is clicked
  photoButtons.forEach((button) => {
    button.addEventListener("click", () => openLightbox(button));
  });

  // Close button
  closeButton?.addEventListener("click", closeLightbox);

  // Previous and next buttons
  previousButton?.addEventListener("click", () => changeImage(-1));
  nextButton?.addEventListener("click", () => changeImage(1));

  // Close by clicking the dark background
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  // Keyboard controls for the image viewer
  document.addEventListener("keydown", (event) => {
    if (!lightbox?.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      changeImage(-1);
    } else if (event.key === "ArrowRight") {
      changeImage(1);
    }
  });

  // 5. Smooth scrolling for in-page links
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

  // 6. AOS scroll animations
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

  console.log("TimaBeauty Gallery JavaScript loaded successfully.");
});
