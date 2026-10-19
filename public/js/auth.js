import {
  apiGet,
  apiPost,
  apiPatch,
  clearToken,
  clearUser,
  getUser,
  saveToken,
  saveUser,
} from "./api.js";

const formStatus = document.querySelector("#form-status");

function showStatus(message, isError = false) {
  if (!formStatus) return;

  formStatus.textContent = message;
  formStatus.classList.toggle("status-error", isError);
}

function getPostLoginPath() {
  const next = new URLSearchParams(window.location.search).get("next");

  // Only allow relative paths on this site.
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) {
    return next;
  }

  return "/profile.html";
}

function redirectIfAlreadyLoggedIn() {
  if (localStorage.getItem("nearhelp_token")) {
    window.location.href = getPostLoginPath();
  }
}

// Hide admin-only navigation for non-admin accounts.
function applyRoleVisibility() {
  const user = getUser();
  const isAdmin = user?.role === "admin";

  document.querySelectorAll("[data-require-admin]").forEach((element) => {
    element.hidden = !isAdmin;
  });
}

// Signup
const signupForm = document.querySelector("#signup-form");

signupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  showStatus("Creating your account…");

  const formData = new FormData(signupForm);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
  };

  try {
    const data = await apiPost("/api/auth/signup", payload);
    saveToken(data.token);
    saveUser(data.user);
    window.location.href = "/profile.html";
  } catch (error) {
    showStatus(error.message || "Could not create your account.", true);
  }
});

// Login
const loginForm = document.querySelector("#login-form");

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  showStatus("Signing in…");

  const formData = new FormData(loginForm);
  const payload = {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
  };

  try {
    const data = await apiPost("/api/auth/login", payload);
    saveToken(data.token);
    saveUser(data.user);
    window.location.href = getPostLoginPath();
  } catch (error) {
    showStatus(error.message || "Could not sign in.", true);
  }
});

// Profile load and save
const profileForm = document.querySelector("#profile-form");
const profileStatus = document.querySelector("#profile-status");

if (profileForm && profileStatus) {
  if (!localStorage.getItem("nearhelp_token")) {
    window.location.href = "/login.html";
  } else {
    try {
      const data = await apiGet("/api/auth/me");
      const user = data.user;

      saveUser(user);
      applyRoleVisibility();

      document.querySelector("#profile-name").textContent = user.name || "";
      document.querySelector("#profile-email").textContent = user.email || "";
      document.querySelector("#gender").value = user.gender || "";
      document.querySelector("#location").value = user.location || "";
      document.querySelector("#work").value = user.work || "";

      profileForm.hidden = false;
      profileStatus.textContent = "";
    } catch (error) {
      profileStatus.textContent = error.message || "Could not load your profile.";
      profileStatus.classList.add("status-error");
    }
  }

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    profileStatus.textContent = "Saving your profile…";
    profileStatus.classList.remove("status-error");

    const formData = new FormData(profileForm);

    try {
      const data = await apiPatch("/api/auth/profile", {
        gender: formData.get("gender"),
        location: formData.get("location"),
        work: formData.get("work"),
      });

      saveUser(data.user);
      profileStatus.textContent = "Profile saved.";
    } catch (error) {
      profileStatus.textContent = error.message || "Could not save your profile.";
      profileStatus.classList.add("status-error");
    }
  });
}

// Logout
document.querySelector("#logout-button")?.addEventListener("click", () => {
  clearToken();
  clearUser();
  window.location.href = "/login.html";
});

// Redirect already-logged-in users away from login/signup.
if (loginForm || signupForm) {
  redirectIfAlreadyLoggedIn();
}

// Password show/hide
const passwordInput = document.querySelector("#password");
const togglePasswordButton = document.querySelector("#toggle-password");

togglePasswordButton?.addEventListener("click", () => {
  if (!passwordInput) return;

  const showingPassword = passwordInput.type === "text";

  passwordInput.type = showingPassword ? "password" : "text";
  togglePasswordButton.textContent = showingPassword ? "Show" : "Hide";
  togglePasswordButton.setAttribute("aria-pressed", String(!showingPassword));
});

// Apply admin nav visibility on any page that loads this module.
applyRoleVisibility();
