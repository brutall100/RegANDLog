"use strict";

const path = require("path");
const crypto = require("crypto");
const { promisify } = require("util");
const express = require("express");
const mysql = require("mysql2/promise");

const scrypt = promisify(crypto.scrypt);
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT) || 9999;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "reg_and_log",
  waitForConnections: true,
  connectionLimit: 10,
});

/* ===== Password hashing (salt + scrypt, stored as "salt:hash") ===== */
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

async function checkPassword(password, stored) {
  const [salt, hashHex] = stored.split(":");
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

/* ===== Input checks ===== */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

/* ===== App ===== */
const app = express();
app.use(express.json({ limit: "10kb" }));

// Serve only the front-end files, never the server code.
app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));
["css", "js", "images"].forEach((dir) => app.use(`/${dir}`, express.static(path.join(ROOT, dir))));

// The page calls this first. If the database is down, it falls back to demo mode.
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, error: "Database is not reachable." });
  }
});

app.post("/api/register", async (req, res) => {
  const name = clean(req.body.name);
  const email = clean(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({ error: "Name must be 2–50 characters long." });
  }
  if (!EMAIL_RE.test(email) || email.length > 100) {
    return res.status(400).json({ error: "Please enter a valid email." });
  }
  if (password.length < 8 || password.length > 100) {
    return res.status(400).json({ error: "Password must be 8–100 characters long." });
  }

  try {
    const passwordHash = await hashPassword(password);
    await pool.execute("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [
      name,
      email,
      passwordHash,
    ]);
    console.log("User registered:", name);
    res.status(201).json({ name });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "That name or email is already registered." });
    }
    console.error(err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

app.post("/api/login", async (req, res) => {
  const name = clean(req.body.name);
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!name || !password) {
    return res.status(400).json({ error: "Please enter your name and password." });
  }

  try {
    const [rows] = await pool.execute("SELECT name, password_hash FROM users WHERE name = ?", [name]);
    const user = rows[0];
    if (!user || !(await checkPassword(password, user.password_hash))) {
      console.log("Login failed:", name);
      return res.status(401).json({ error: "Wrong name or password." });
    }
    console.log("User logged in:", user.name);
    res.json({ name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
