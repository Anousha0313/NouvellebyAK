// db.js — SQLite connection + schema
// Uses better-sqlite3: a real, file-based SQL database (database.sqlite),
// no separate database server to install or run.

const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "database.sqlite");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,             -- tops | bottoms | dresses | accessories
  price         REAL NOT NULL,
  old_price     REAL,                      -- nullable, used to show a strike-through sale price
  tag           TEXT,                      -- new | sale | restock | null
  image_url     TEXT NOT NULL,
  description   TEXT,
  sizes         TEXT DEFAULT 'XS,S,M,L,XL',
  in_stock      INTEGER NOT NULL DEFAULT 1, -- 0/1 boolean
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id     INTEGER REFERENCES customers(id),
  customer_name   TEXT NOT NULL,
  customer_email  TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  total           REAL NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | paid | shipped | cancelled
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    INTEGER REFERENCES products(id),
  product_name  TEXT NOT NULL,             -- snapshot, in case product is edited/deleted later
  unit_price    REAL NOT NULL,
  quantity      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS wishlist (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_email TEXT NOT NULL,
  product_id    INTEGER NOT NULL REFERENCES products(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(customer_email, product_id)
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  message       TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;
