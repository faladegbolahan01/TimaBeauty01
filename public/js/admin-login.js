"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginButton = document.getElementById("loginButton");
    const buttonText = document.getElementById("buttonText");
    const loginMessage = document.getElementById("loginMessage");
    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    function showMessage(message, type = "error") {
        loginMessage.textContent = message;
        loginMessage.className = `login-message ${type}`;
        loginMessage.hidden = false;
    }

    function clearMessage() {
        loginMessage.textContent = "";
        loginMessage.className = "login-message";
        loginMessage.hidden = true;
    }

    function setLoading(isLoading) {
        loginButton.disabled = isLoading;
        usernameInput.disabled = isLoading;
        passwordInput.disabled = isLoading;

        buttonText.textContent = isLoading
            ? "Signing in..."
            : "Sign In Securely";
    }

    async function checkExistingSession() {
        try {
            const response = await fetch("/api/admin/me", {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json"
                },
                cache: "no-store"
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            if (data.authenticated === true) {
                window.location.replace("/admin.html");
            }
        } catch (error) {
            // If the server is temporarily unavailable,
            // leave the login form visible.
            console.error("Could not check admin session.", error);
        }
    }

    togglePassword.addEventListener("click", () => {
        const showingPassword = passwordInput.type === "text";

        passwordInput.type = showingPassword ? "password" : "text";

        togglePassword.textContent = showingPassword
            ? "Show"
            : "Hide";

        togglePassword.setAttribute(
            "aria-label",
            showingPassword ? "Show password" : "Hide password"
        );
    });

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            showMessage("Please enter your username and password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                cache: "no-store",
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(
                        "Too many login attempts. Please wait before trying again."
                    );
                }

                if (response.status === 401 || response.status === 403) {
                    throw new Error(
                        "Incorrect username or password. Please try again."
                    );
                }

                throw new Error(
                    data.error ||
                    "Login failed. Please try again."
                );
            }

            showMessage("Login successful. Opening dashboard...", "success");

            buttonText.textContent = "Opening dashboard...";

            window.location.replace("/admin.html");
        } catch (error) {
            showMessage(
                error.message ||
                "Unable to contact the server. Check that the server is running."
            );

            setLoading(false);
        }
    });

    checkExistingSession();
});