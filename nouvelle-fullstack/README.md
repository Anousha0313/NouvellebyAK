# Nouvelle by AK — Full-Stack Website

A complete frontend + backend + database for the Nouvelle by AK clothing brand.

## Stack
- **Frontend:** HTML, CSS, vanilla JS (`/public`)
- **Backend:** Node.js + Express (`/server`)
- **Database:** SQLite (via `better-sqlite3`) — a single file, `database.sqlite`, no separate database server to install

## Project structure
```
nouvelle-fullstack/
├── public/              ← the website (served by Express)
│   ├── index.html
│   ├── style.css
│   └── script.js
├── server/
│   ├── server.js        ← Express app + all API routes
│   ├── db.js             ← database connection + schema
│   ├── seed.js            ← populates products table with starter catalog
│   ├── package.json
│   └── database.sqlite   ← created automatically on first run
└── README.md
```

## How to run it

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Seed the database** (creates `database.sqlite` and fills the products table)
   ```bash
   npm run seed
   ```
   Re-run this anytime after editing the product list in `seed.js` — it clears and re-inserts.

3. **Start the server**
   ```bash
   npm start
   ```

4. Open **http://localhost:3000** in your browser. The frontend and API both run from this one address — no separate frontend server, no CORS config needed.

## Database schema

| Table | Purpose |
|---|---|
| `products` | Catalog: name, category, price, sale price, tag, image, description |
| `customers` | Created automatically the first time someone places an order |
| `orders` | One row per checkout, with totals and shipping info |
| `order_items` | Line items per order (product, price snapshot, quantity) |
| `wishlist` | Saved items per customer email |
| `contact_messages` | Submissions from the Contact form |
| `newsletter_subscribers` | Emails from the newsletter signup |

## API reference

| Method | Route | Description |
|---|---|---|
| GET | `/api/products` | List all products. Supports `?category=` and `?search=` |
| GET | `/api/products/:id` | Single product |
| POST | `/api/products` | Create a product (admin) |
| PUT | `/api/products/:id` | Update a product (admin) |
| DELETE | `/api/products/:id` | Delete a product (admin) |
| POST | `/api/orders` | Place an order — body: `{ customerName, customerEmail, shippingAddress, items[] }` |
| GET | `/api/orders` | List all orders (admin) |
| GET | `/api/orders/:id` | Single order + line items |
| GET | `/api/wishlist?email=` | Get a customer's saved items |
| POST | `/api/wishlist` | Save an item — body: `{ email, productId }` |
| DELETE | `/api/wishlist` | Remove an item — body: `{ email, productId }` |
| POST | `/api/contact` | Submit contact form — body: `{ name, email, message }` |
| POST | `/api/newsletter` | Subscribe — body: `{ email }` |

## Managing your real catalog

Edit the `PRODUCTS` array at the top of `server/seed.js` with your real product names, prices, and photo URLs, then run `npm run seed` again. Or use the `POST /api/products` endpoint directly (e.g. from a small admin script or a tool like Postman) to add products one at a time without wiping existing ones.

## Accepting real payments (Stripe)

Checkout is wired up to **Stripe Checkout** — customers are redirected to Stripe's real, secure payment page, and your database only marks an order "paid" once Stripe confirms the charge actually succeeded.

1. **Create a Stripe account** at https://dashboard.stripe.com/register (free, instant).
2. **Get your test keys**: https://dashboard.stripe.com/test/apikeys → copy the "Secret key" (starts `sk_test_...`).
3. **Set it as an environment variable** before starting the server:
   ```bash
   export STRIPE_SECRET_KEY=sk_test_your_key_here
   npm start
   ```
4. **Set up the webhook** so orders actually get marked "paid":
   - Install the Stripe CLI (https://stripe.com/docs/stripe-cli), then run:
     ```bash
     stripe listen --forward-to localhost:3000/api/webhooks/stripe
     ```
   - This prints a webhook signing secret (`whsec_...`) — set that too:
     ```bash
     export STRIPE_WEBHOOK_SECRET=whsec_the_secret_it_printed
     ```
5. **Test it**: add something to your cart, hit checkout, and use Stripe's test card `4242 4242 4242 4242` with any future expiry date and any CVC. You'll land on `success.html`, and the order in your database will flip from `pending` to `paid`.
6. **Go live for real**: switch to your **live** keys (same dashboard, toggle "Test mode" off) once you're ready to accept real cards, and add the live webhook endpoint in the Stripe Dashboard under Developers → Webhooks, pointing at `https://yourdomain.com/api/webhooks/stripe`.

Stripe takes a small fee per transaction (around 2.9% + $0.30 in the US) — no other setup fees.

## Going live (deployment)

This app is a single Node process, so it deploys easily to any of these:

- **Render** (https://render.com) — free tier to start. New Web Service → connect your GitHub repo → root directory `server`, build command `npm install`, start command `node server.js`. Add a small persistent disk so `database.sqlite` survives redeploys, and set `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` in the Environment tab.
- **Railway** (https://railway.app) — same idea, also has a generous free tier.
- **Fly.io** or a small VPS — more control, still simple for a project this size.

After deploying, update your Stripe webhook endpoint (Dashboard → Developers → Webhooks) to point at your live URL instead of localhost.

## What's not included (further next steps)

- **Auth:** there's no login/password system. Customers are identified by email only, which is fine for guest checkout but not for secure accounts.
- **Image uploads:** product photos are external URLs (Unsplash placeholders). For your real catalog, host images (e.g. Cloudinary, S3, or a `/public/images` folder) and reference those paths.
- **Inventory tracking:** stock isn't decremented after a sale yet — fine for a small/made-to-order catalog, but worth adding if you carry limited quantities.
- **Scaling the database:** SQLite works well at small-to-medium scale; if you outgrow it, the same schema maps easily to Postgres later.
