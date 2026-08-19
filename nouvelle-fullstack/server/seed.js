// seed.js — run once (npm run seed) to populate the products table.
// Safe to re-run: it clears and re-inserts, so edit the list below and re-seed anytime.

const db = require("./db");

const PRODUCTS = [
  { name: "Corset Cami Top", category: "tops", price: 38, old_price: null, tag: "new",
    image_url: "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&q=80",
    description: "Fitted corset-style cami with adjustable straps and boning detail." },
  { name: "Low-Rise Cargo Pants", category: "bottoms", price: 54, old_price: 68, tag: "sale",
    image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80",
    description: "Low-rise cargo pants with utility pockets and an adjustable waist." },
  { name: "Slip Midi Dress", category: "dresses", price: 62, old_price: null, tag: "new",
    image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80",
    description: "Bias-cut satin slip dress, midi length, adjustable straps." },
  { name: "Chunky Knit Cardigan", category: "tops", price: 46, old_price: null, tag: null,
    image_url: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=600&q=80",
    description: "Oversized chunky knit cardigan, drop shoulder, front button closure." },
  { name: "Baggy Denim Jeans", category: "bottoms", price: 58, old_price: null, tag: "restock",
    image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80",
    description: "Relaxed baggy fit denim with a mid-rise waist." },
  { name: "Mesh Layer Top", category: "tops", price: 32, old_price: null, tag: null,
    image_url: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&q=80",
    description: "Sheer mesh long-sleeve layering top." },
  { name: "Micro Pleat Skirt", category: "bottoms", price: 44, old_price: null, tag: "new",
    image_url: "https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=600&q=80",
    description: "Micro-pleated mini skirt with a high waist and side zip." },
  { name: "Butterfly Sleeve Dress", category: "dresses", price: 66, old_price: 82, tag: "sale",
    image_url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80",
    description: "Flowing dress with dramatic butterfly sleeves." },
  { name: "Claw Clip Duo", category: "accessories", price: 14, old_price: null, tag: null,
    image_url: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&q=80",
    description: "Set of two matte claw clips." },
  { name: "Y2K Mini Bag", category: "accessories", price: 28, old_price: null, tag: "new",
    image_url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80",
    description: "Small structured shoulder bag with chain strap." },
  { name: "Ribbed Tank Set", category: "tops", price: 36, old_price: null, tag: null,
    image_url: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&q=80",
    description: "Two-pack ribbed tanks, cropped fit." },
  { name: "Wide Leg Trousers", category: "bottoms", price: 52, old_price: null, tag: null,
    image_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80",
    description: "Tailored wide-leg trousers with a fluid drape." },
];

db.exec("DELETE FROM products;");

const insert = db.prepare(`
  INSERT INTO products (name, category, price, old_price, tag, image_url, description)
  VALUES (@name, @category, @price, @old_price, @tag, @image_url, @description)
`);

const insertMany = db.transaction((rows) => {
  for (const row of rows) insert.run(row);
});

insertMany(PRODUCTS);

console.log(`Seeded ${PRODUCTS.length} products into database.sqlite`);
