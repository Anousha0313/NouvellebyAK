// server.js — Express backend for Nouvelle by AK
// Serves the frontend (public/) AND the JSON API from one process/port,
// so there's no CORS setup needed for local use.

const path = require("path");
const express = require("express");
const cors = require("cors");
const db = require("./db");

// Stripe needs a secret key from your own Stripe account (test mode to start).
// Get it from https://dashboard.stripe.com/test/apikeys and set it as an
// environment variable — never hardcode it in this file.
// A placeholder key is used as a fallback so the server can still start and
// serve the rest of the site before Stripe is configured; checkout itself
// will return a clear error until a real key is set.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_not_configured");
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

/* ---------------------------------------------------------
   STRIPE WEBHOOK — must read the RAW body, so this route is
   registered BEFORE express.json() below. Stripe uses this raw
   body + signature header to verify the event really came from Stripe.
--------------------------------------------------------- */
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata && session.metadata.orderId;
    if (orderId) {
      db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(orderId);
      console.log(`Order #${orderId} marked as paid`);
    }
  }

  res.json({ received: true });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

/* ---------------------------------------------------------
   PRODUCTS
--------------------------------------------------------- */

// GET /api/products            -> all products
// GET /api/products?category=x -> filtered by category
// GET /api/products?search=y   -> filtered by name match
app.get("/api/products", (req, res) => {
  const { category, search } = req.query;
  let rows;

  if (search) {
    rows = db.prepare(
      "SELECT * FROM products WHERE name LIKE ? ORDER BY created_at DESC"
    ).all(`%${search}%`);
  } else if (category && category !== "all") {
    rows = db.prepare(
      "SELECT * FROM products WHERE category = ? ORDER BY created_at DESC"
    ).all(category);
  } else {
    rows = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
  }

  res.json(rows);
});

// GET /api/products/:id -> single product detail
app.get("/api/products/:id", (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// POST /api/products -> create a product (admin use)
app.post("/api/products", (req, res) => {
  const { name, category, price, old_price, tag, image_url, description } = req.body;
  if (!name || !category || price == null || !image_url) {
    return res.status(400).json({ error: "name, category, price, and image_url are required" });
  }
  const result = db.prepare(`
    INSERT INTO products (name, category, price, old_price, tag, image_url, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, category, price, old_price ?? null, tag ?? null, image_url, description ?? "");

  const created = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/products/:id -> update a product (admin use)
app.put("/api/products/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const merged = { ...existing, ...req.body };
  db.prepare(`
    UPDATE products SET name=?, category=?, price=?, old_price=?, tag=?, image_url=?, description=?, in_stock=?
    WHERE id=?
  `).run(
    merged.name, merged.category, merged.price, merged.old_price,
    merged.tag, merged.image_url, merged.description, merged.in_stock ? 1 : 0,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id));
});

// DELETE /api/products/:id -> remove a product (admin use)
app.delete("/api/products/:id", (req, res) => {
  const result = db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Product not found" });
  res.status(204).send();
});

/* ---------------------------------------------------------
   ORDERS  (cart checkout)
--------------------------------------------------------- */

// POST /api/orders
// body: { customerName, customerEmail, shippingAddress, items: [{ productId, name, price, qty }] }
app.post("/api/orders", (req, res) => {
  const { customerName, customerEmail, shippingAddress, items } = req.body;

  if (!customerName || !customerEmail || !shippingAddress || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "customerName, customerEmail, shippingAddress, and at least one item are required" });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const createOrder = db.transaction(() => {
    // upsert customer
    db.prepare(`
      INSERT INTO customers (name, email) VALUES (?, ?)
      ON CONFLICT(email) DO UPDATE SET name = excluded.name
    `).run(customerName, customerEmail);
    const customer = db.prepare("SELECT id FROM customers WHERE email = ?").get(customerEmail);

    const orderResult = db.prepare(`
      INSERT INTO orders (customer_id, customer_name, customer_email, shipping_address, total)
      VALUES (?, ?, ?, ?, ?)
    `).run(customer.id, customerName, customerEmail, shippingAddress, total);

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertItem.run(orderResult.lastInsertRowid, item.productId ?? null, item.name, item.price, item.qty);
    }

    return orderResult.lastInsertRowid;
  });

  const orderId = createOrder();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  const orderItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);

  res.status(201).json({ ...order, items: orderItems });
});

// GET /api/orders/:id -> order lookup (e.g. confirmation page)
app.get("/api/orders/:id", (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(req.params.id);
  res.json({ ...order, items });
});

// GET /api/orders -> all orders (admin dashboard use)
app.get("/api/orders", (req, res) => {
  const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  res.json(orders);
});

/* ---------------------------------------------------------
   STRIPE CHECKOUT
--------------------------------------------------------- */

// POST /api/checkout/create-session
// body: { customerName, customerEmail, shippingAddress, items: [{ productId, name, price, qty }] }
// Creates a 'pending' order in the DB, then a real Stripe Checkout Session.
// The frontend redirects the browser to the returned url to actually collect payment.
app.post("/api/checkout/create-session", async (req, res) => {
  const { customerName, customerEmail, shippingAddress, items } = req.body;

  if (!customerName || !customerEmail || !shippingAddress || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "customerName, customerEmail, shippingAddress, and at least one item are required" });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Stripe is not configured on this server yet — set STRIPE_SECRET_KEY" });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Record the order as 'pending' now, before the customer pays.
  // The webhook flips it to 'paid' once Stripe confirms the charge succeeded.
  const createOrder = db.transaction(() => {
    db.prepare(`
      INSERT INTO customers (name, email) VALUES (?, ?)
      ON CONFLICT(email) DO UPDATE SET name = excluded.name
    `).run(customerName, customerEmail);
    const customer = db.prepare("SELECT id FROM customers WHERE email = ?").get(customerEmail);

    const orderResult = db.prepare(`
      INSERT INTO orders (customer_id, customer_name, customer_email, shipping_address, total, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(customer.id, customerName, customerEmail, shippingAddress, total);

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertItem.run(orderResult.lastInsertRowid, item.productId ?? null, item.name, item.price, item.qty);
    }
    return orderResult.lastInsertRowid;
  });

  const orderId = createOrder();

  try {
    const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      line_items: items.map(item => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100), // Stripe uses cents
        },
        quantity: item.qty,
      })),
      metadata: { orderId: String(orderId) },
      success_url: `${origin}/success.html?order=${orderId}`,
      cancel_url: `${origin}/cancel.html?order=${orderId}`,
    });

    res.json({ url: session.url, orderId });
  } catch (err) {
    console.error("Stripe session creation failed:", err.message);
    res.status(500).json({ error: "Could not start checkout — please try again" });
  }
});

/* ---------------------------------------------------------
   WISHLIST
--------------------------------------------------------- */

// GET /api/wishlist?email=x
app.get("/api/wishlist", (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email query param is required" });
  const rows = db.prepare(`
    SELECT p.* FROM wishlist w JOIN products p ON p.id = w.product_id
    WHERE w.customer_email = ?
  `).all(email);
  res.json(rows);
});

// POST /api/wishlist  body: { email, productId }
app.post("/api/wishlist", (req, res) => {
  const { email, productId } = req.body;
  if (!email || !productId) return res.status(400).json({ error: "email and productId are required" });
  db.prepare(`
    INSERT OR IGNORE INTO wishlist (customer_email, product_id) VALUES (?, ?)
  `).run(email, productId);
  res.status(201).json({ ok: true });
});

// DELETE /api/wishlist  body: { email, productId }
app.delete("/api/wishlist", (req, res) => {
  const { email, productId } = req.body;
  db.prepare(`DELETE FROM wishlist WHERE customer_email = ? AND product_id = ?`).run(email, productId);
  res.status(204).send();
});

/* ---------------------------------------------------------
   CONTACT + NEWSLETTER
--------------------------------------------------------- */

app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "name, email, and message are required" });
  }
  db.prepare(`INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)`)
    .run(name, email, message);
  res.status(201).json({ ok: true, message: "message sent — we'll get back to you soon" });
});

app.post("/api/newsletter", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });
  try {
    db.prepare(`INSERT INTO newsletter_subscribers (email) VALUES (?)`).run(email);
  } catch (err) {
    if (!String(err.message).includes("UNIQUE")) throw err; // already subscribed = fine
  }
  res.status(201).json({ ok: true, message: "you're on the list" });
});

/* ---------------------------------------------------------
--------------------------------------------------------- */

app.listen(PORT, () => {
  console.log(`Nouvelle by AK server running at http://localhost:${PORT}`);
});
