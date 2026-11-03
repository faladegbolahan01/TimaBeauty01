document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.getElementById("reviews-menu-toggle");
  const navigation = document.getElementById("reviews-navigation");
  const reviewForm = document.getElementById("review-form");
  const message = document.getElementById("review-form-message");
  const year = document.getElementById("reviews-year");

  // 1. Automatically update the footer year
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // 2. Mobile navigation menu
  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("is-open");

      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
      );
    });

    // Close the mobile menu after selecting a page
    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navigation.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
      });
    });

    // Close the menu when Escape is pressed
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        navigation.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
        menuButton.focus();
      }
    });
  }

  // 3. Review form validation
  if (reviewForm && message) {
    reviewForm.addEventListener("submit", (event) => {
      event.preventDefault();

      // Clear the previous message
      message.textContent = "";

      // Let the browser check required fields
      if (!reviewForm.checkValidity()) {
        reviewForm.reportValidity();
        return;
      }

      // Read the entered information
      const formData = new FormData(reviewForm);

      const review = {
        name: String(formData.get("name") || "").trim(),
        service: String(formData.get("service") || ""),
        rating: Number(formData.get("rating")),
        feedback: String(formData.get("feedback") || "").trim(),
        consent: formData.get("consent") === "on"
      };

      // Additional checks
      if (review.name.length < 2) {
        message.textContent =
          "Please enter a name with at least 2 characters.";
        return;
      }

      if (!review.service) {
        message.textContent = "Please choose the service you received.";
        return;
      }

      if (
        !Number.isInteger(review.rating) ||
        review.rating < 1 ||
        review.rating > 5
      ) {
        message.textContent = "Please select a rating from 1 to 5.";
        return;
      }

      if (review.feedback.length < 10) {
        message.textContent =
          "Please tell us a little more about your experience.";
        return;
      }

      if (!review.consent) {
        message.textContent =
          "Please confirm the feedback consent checkbox.";
        return;
      }

      /*
       * IMPORTANT:
       * The Express review-submission endpoint and review moderation
       * system have not been connected yet.
       *
       * Do not display this review as published or saved.
       */

      message.textContent =
        "Thank you for preparing your feedback! Online submission is not connected yet, so your review has not been sent or saved. Please contact the salon directly for now.";
    });
  }
});
