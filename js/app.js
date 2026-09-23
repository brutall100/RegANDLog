"use strict";

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

/* ===== Theme toggle (remembers the choice) ===== */
const themeToggle = document.getElementById("theme-toggle");

function currentTheme() {
  return root.dataset.theme || (prefersDark.matches ? "dark" : "light");
}

function updateToggleLabel() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  themeToggle.setAttribute("aria-label", `Switch to ${next} theme`);
}

themeToggle.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    /* storage blocked: the theme still changes for this visit */
  }
  updateToggleLabel();
});

prefersDark.addEventListener("change", updateToggleLabel);
updateToggleLabel();

/* ===== Ripple on every button ===== */
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("pointerdown", (event) => {
    if (reduceMotion.matches) return;
    const rect = btn.getBoundingClientRect();
    const dot = document.createElement("span");
    dot.className = "ripple";
    dot.style.left = `${event.clientX - rect.left}px`;
    dot.style.top = `${event.clientY - rect.top}px`;
    btn.appendChild(dot);
    setTimeout(() => dot.remove(), 700);
  });
});

/* ===== Reveal on scroll + count-up numbers ===== */
function countUp(el) {
  const end = Number(el.dataset.count);
  const start = Number(el.dataset.start || 0);
  if (reduceMotion.matches) {
    el.textContent = end;
    return;
  }
  const duration = 1200;
  const t0 = performance.now();
  function frame(now) {
    const p = Math.min((now - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (end - start) * eased);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        entry.target.querySelectorAll("[data-count]").forEach(countUp);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  document.querySelectorAll("[data-count]").forEach(countUp);
}

/* ===== Show / hide password ===== */
document.querySelectorAll(".pw-toggle").forEach((btn) => {
  const input = document.getElementById(btn.getAttribute("aria-controls"));
  btn.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.textContent = show ? "Hide" : "Show";
    btn.setAttribute("aria-pressed", String(show));
  });
});

/* ===== Password strength meter ===== */
const regPassword = document.getElementById("reg-password");
const strengthBar = document.getElementById("reg-strength-bar");
const strengthText = document.getElementById("reg-strength-text");
const strengthLevels = [
  { label: "Use 8+ characters. Mix letters, numbers and symbols.", color: "var(--line)" },
  { label: "Weak password", color: "var(--err)" },
  { label: "Okay password", color: "var(--accent)" },
  { label: "Good password", color: "var(--accent)" },
  { label: "Strong password", color: "var(--ok)" },
];

regPassword.addEventListener("input", () => {
  const pw = regPassword.value;
  let score = 0;
  if (pw.length > 0) score = 1;
  if (pw.length >= 8) score++;
  if (/[a-z]/i.test(pw) && /\d/.test(pw)) score++;
  if (pw.length >= 12 && /[^a-z0-9]/i.test(pw)) score++;
  strengthBar.style.transform = `scaleX(${score / 4})`;
  strengthBar.style.backgroundColor = strengthLevels[score].color;
  strengthText.textContent = strengthLevels[score].label;
});

/* ===== Storage: real API or browser-only demo ===== */
const API = "api";
// GitHub Pages only hosts static files, so there is no API to ask for.
const staticHost = location.hostname.endsWith("github.io") || location.protocol === "file:";
let mode = "demo";

async function detectServer() {
  const badge = document.getElementById("mode-badge");
  const text = document.getElementById("mode-text");
  if (staticHost) {
    showMode(badge, text);
    return;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API}/health`, { signal: controller.signal });
    clearTimeout(timer);
    const data = res.ok ? await res.json() : null;
    if (data && data.ok) mode = "server";
  } catch {
    mode = "demo";
  }
  showMode(badge, text);
}

function showMode(badge, text) {
  badge.dataset.mode = mode;
  text.textContent = mode === "server" ? "Node API connected" : "Demo mode";
  badge.title =
    mode === "server"
      ? "Accounts are saved in MySQL through the Express API."
      : "No server found. Accounts are saved only in this browser.";
}

const serverReady = detectServer();

async function hashInBrowser(password, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readDemoUsers() {
  try {
    return JSON.parse(localStorage.getItem("demo-users")) || [];
  } catch {
    return [];
  }
}

function saveDemoUsers(users) {
  try {
    localStorage.setItem("demo-users", JSON.stringify(users));
  } catch {
    throw new Error("Your browser blocked storage, so the demo can't save accounts.");
  }
}

const demoApi = {
  async register({ name, email, password }) {
    const users = readDemoUsers();
    const taken = users.some(
      (u) => u.name.toLowerCase() === name.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
    );
    if (taken) throw new Error("That name or email is already registered.");
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
    users.push({ name, email, salt, hash: await hashInBrowser(password, salt) });
    saveDemoUsers(users);
    return { name };
  },
  async login({ name, password }) {
    const user = readDemoUsers().find((u) => u.name.toLowerCase() === name.toLowerCase());
    if (!user || user.hash !== (await hashInBrowser(password, user.salt))) {
      throw new Error("Wrong name or password.");
    }
    return { name: user.name };
  },
};

async function serverCall(path, body) {
  const res = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

const serverApi = {
  register: (body) => serverCall("register", body),
  login: (body) => serverCall("login", body),
};

/* ===== Forms ===== */
function validate(form) {
  let firstBad = null;
  form.querySelectorAll("input").forEach((input) => {
    input.value = input.type === "password" ? input.value : input.value.trim();
    const ok = input.checkValidity();
    input.setAttribute("aria-invalid", String(!ok));
    if (!ok && !firstBad) firstBad = input;
  });
  if (firstBad) {
    firstBad.focus();
    return `${firstBad.labels[0].textContent}: ${firstBad.validationMessage}`;
  }
  return "";
}

function showMessage(form, text, type) {
  const msg = form.querySelector(".form__msg");
  msg.textContent = text;
  msg.dataset.type = type;
}

function handleForm(form, action, onSuccess) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const problem = validate(form);
    if (problem) {
      showMessage(form, problem, "error");
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    showMessage(form, "Working…", "");
    try {
      await serverReady;
      const api = mode === "server" ? serverApi : demoApi;
      const data = await api[action](Object.fromEntries(new FormData(form)));
      onSuccess(data);
    } catch (err) {
      showMessage(form, err.message, "error");
    } finally {
      button.disabled = false;
    }
  });
}

/* Initials avatar as an SVG, so no real photo is ever needed. */
function initialsAvatar(name) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  const safe = initials.replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="#f2b705"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="24" fill="#14181b">${safe}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const welcome = document.getElementById("welcome");

handleForm(registerForm, "register", ({ name }) => {
  registerForm.reset();
  regPassword.dispatchEvent(new Event("input"));
  showMessage(registerForm, `Account created for ${name}. Now log in →`, "ok");
  document.getElementById("login-name").value = name;
});

handleForm(loginForm, "login", ({ name }) => {
  loginForm.reset();
  showMessage(loginForm, "Logged in.", "ok");
  document.getElementById("welcome-name").textContent = name;
  const avatar = document.getElementById("welcome-avatar");
  avatar.src = initialsAvatar(name);
  avatar.alt = `Avatar with the initials of ${name}`;
  loginForm.hidden = true;
  welcome.hidden = false;
  document.getElementById("logout").focus();
});

document.getElementById("logout").addEventListener("click", () => {
  welcome.hidden = true;
  loginForm.hidden = false;
  showMessage(loginForm, "You logged out.", "ok");
  document.getElementById("login-name").focus();
});
