import { faker } from "@faker-js/faker";
import { Pool, type PoolClient } from "pg";
import { config } from "dotenv";
import {
  buildPoolConfig,
  buildPoolFromParts,
} from "./connection.js";

config();

faker.seed(42);

const TARGET_ORDERS = 12_000;
const NUM_CUSTOMERS = 2_000;
const NUM_PRODUCTS = 300;
const NUM_REVIEWS = 4_000;
const BATCH_SIZE = 500;
const MONTHS_BACK = 12;

function buildPool(): Pool {
  const url = process.env.DATABASE_URL ?? process.env.DEMO_DATABASE_URL;
  if (url) return new Pool(buildPoolConfig(url));
  return new Pool(
    buildPoolFromParts({
      host: process.env.DB_HOST ?? "localhost",
      port: parseInt(process.env.DB_PORT ?? "5432", 10),
      database: process.env.DB_NAME ?? "bi_platform",
      user: process.env.DB_USER ?? "postgres",
      password: process.env.DB_PASSWORD ?? "",
      ssl: process.env.DB_SSL === "true",
    }),
  );
}

const pool = buildPool();

interface Category {
  id: number;
  name: string;
  parentId: number | null;
}
interface Product {
  id: number;
  price: number;
  categoryId: number;
}
interface Customer {
  id: number;
  state: string;
}
interface OrderRow {
  id: number;
  customerId: number;
  createdAt: Date;
}

const ROOT_CATEGORIES = [
  {
    name: "Electronics",
    slug: "electronics",
    description: "Gadgets, devices, and accessories",
  },
  {
    name: "Clothing",
    slug: "clothing",
    description: "Apparel for men, women, and kids",
  },
  {
    name: "Home & Garden",
    slug: "home-garden",
    description: "Furniture, décor, and outdoor",
  },
  {
    name: "Sports & Fitness",
    slug: "sports-fitness",
    description: "Equipment and activewear",
  },
  {
    name: "Books",
    slug: "books",
    description: "Fiction, non-fiction, and textbooks",
  },
  {
    name: "Beauty",
    slug: "beauty",
    description: "Skincare, makeup, and fragrances",
  },
  {
    name: "Toys & Games",
    slug: "toys-games",
    description: "For kids and adults alike",
  },
  {
    name: "Automotive",
    slug: "automotive",
    description: "Parts, accessories, and tools",
  },
  {
    name: "Food & Grocery",
    slug: "food-grocery",
    description: "Pantry staples and gourmet items",
  },
  {
    name: "Health",
    slug: "health",
    description: "Vitamins, supplements, and medical",
  },
  {
    name: "Office Supplies",
    slug: "office-supplies",
    description: "Stationery and workspace essentials",
  },
  {
    name: "Pet Supplies",
    slug: "pet-supplies",
    description: "Food, toys, and accessories for pets",
  },
];

const SUB_CATEGORIES: Record<string, string[]> = {
  electronics: ["Smartphones", "Laptops & PCs", "Audio & Headphones"],
  clothing: ["Men's Clothing", "Women's Clothing", "Kids' Clothing"],
  "home-garden": ["Furniture", "Kitchen & Dining", "Garden & Outdoor"],
  "sports-fitness": ["Gym Equipment", "Outdoor Sports", "Team Sports"],
  books: ["Fiction", "Business & Finance", "Science & Tech"],
  beauty: ["Skincare", "Makeup", "Hair Care"],
  "toys-games": ["Board Games", "Action Figures", "Educational Toys"],
  automotive: ["Car Accessories", "Tools & Equipment", "Oils & Fluids"],
  "food-grocery": ["Snacks & Sweets", "Beverages", "Organic & Natural"],
  health: ["Vitamins", "Medical Devices", "Personal Care"],
  "office-supplies": [
    "Paper & Notebooks",
    "Writing Instruments",
    "Desk Accessories",
  ],
  "pet-supplies": ["Dog Supplies", "Cat Supplies", "Fish & Aquatics"],
};

const US_STATES = [
  "California",
  "Texas",
  "Florida",
  "New York",
  "Pennsylvania",
  "Illinois",
  "Ohio",
  "Georgia",
  "North Carolina",
  "Michigan",
  "New Jersey",
  "Virginia",
  "Washington",
  "Arizona",
  "Massachusetts",
  "Tennessee",
  "Indiana",
  "Missouri",
  "Maryland",
  "Wisconsin",
  "Colorado",
  "Minnesota",
  "South Carolina",
  "Alabama",
  "Louisiana",
  "Kentucky",
  "Oregon",
  "Oklahoma",
  "Connecticut",
  "Utah",
  "Nevada",
  "Arkansas",
  "Mississippi",
  "Kansas",
  "New Mexico",
];

const ORDER_STATUSES = [
  { status: "delivered", weight: 55 },
  { status: "shipped", weight: 15 },
  { status: "processing", weight: 8 },
  { status: "confirmed", weight: 7 },
  { status: "pending", weight: 5 },
  { status: "cancelled", weight: 7 },
  { status: "refunded", weight: 3 },
];

const PAYMENT_METHODS = [
  { method: "credit_card", weight: 45 },
  { method: "debit_card", weight: 25 },
  { method: "paypal", weight: 18 },
  { method: "bank_transfer", weight: 5 },
  { method: "crypto", weight: 4 },
  { method: "gift_card", weight: 3 },
];

function weightedRandom<T>(items: { weight: number }[] & T[]): T {
  const total = items.reduce((sum, i) => sum + (i as any).weight, 0);
  let rand = Math.random() * total;
  for (const item of items) {
    rand -= (item as any).weight;
    if (rand <= 0) return item;
  }
  //@ts-ignore
  return items[items.length - 1];
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomOrderDate(): Date {
  const now = new Date();
  const monthsAgo = MONTHS_BACK;
  const startMs = now.getTime() - monthsAgo * 30 * 24 * 60 * 60 * 1000;

  const buckets: { date: Date; weight: number }[] = [];
  for (let m = 0; m < monthsAgo; m++) {
    const d = new Date(now.getTime() - m * 30 * 24 * 60 * 60 * 1000);
    const month = d.getMonth(); // 0=Jan … 11=Dec
    const isHoliday = month === 10 || month === 11; // Nov, Dec
    const isSummer = month >= 5 && month <= 7; // Jun–Aug
    const weight = isHoliday ? 2.5 : isSummer ? 1.3 : 1.0;
    buckets.push({ date: d, weight });
  }

  const chosen = weightedRandom(buckets as any) as { date: Date };

  const dayOffset = randomInt(0, 29) * 24 * 60 * 60 * 1000;
  const hourOffset = randomInt(0, 23) * 60 * 60 * 1000;
  return new Date(chosen.date.getTime() - dayOffset + hourOffset);
}

function slugify(name: string, suffix: string | number): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    suffix
  );
}

async function batchInsert<T>(
  client: PoolClient,
  rows: T[],
  tableName: string,
  insertFn: (batch: T[]) => { text: string; values: any[][] },
): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { text, values } = insertFn(batch);
    await client.query(text, values.flat());
  }
}

async function seedCategories(client: PoolClient): Promise<Category[]> {
  process.stdout.write("  Inserting categories... ");
  const categories: Category[] = [];
  let displayOrder = 0;

  for (const root of ROOT_CATEGORIES) {
    const res: any = await client.query<{ id: number }>(
      `INSERT INTO categories (name, slug, description, parent_id, display_order)
       VALUES ($1, $2, $3, NULL, $4) RETURNING id`,
      [root.name, root.slug, root.description, displayOrder++],
    );
    const rootId = res.rows[0].id;
    categories.push({ id: rootId, name: root.name, parentId: null });

    const subs = SUB_CATEGORIES[root.slug] ?? [];
    for (const subName of subs) {
      const subSlug =
        root.slug +
        "-" +
        subName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      const subRes: any = await client.query<{ id: number }>(
        `INSERT INTO categories (name, slug, parent_id, display_order)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [subName, subSlug, rootId, displayOrder++],
      );
      categories.push({
        id: subRes.rows[0].id,
        name: subName,
        parentId: rootId,
      });
    }
  }

  console.log(`${categories.length} rows`);
  return categories;
}

async function seedProducts(
  client: PoolClient,
  categories: Category[],
): Promise<Product[]> {
  process.stdout.write("  Inserting products... ");

  const leafCategories = categories.filter((c) => c.parentId !== null);
  const products: Product[] = [];
  const rows: any[] = [];

  for (let i = 0; i < NUM_PRODUCTS; i++) {
    const cat: any = leafCategories[i % leafCategories.length];
    const price = randomFloat(4.99, 1499.99);
    const cost = parseFloat((price * randomFloat(0.3, 0.7)).toFixed(2));
    const name = faker.commerce.productName();
    const sku = `SKU-${faker.string.alphanumeric({ length: 8, casing: "upper" })}`;

    rows.push({
      category_id: cat.id,
      name,
      slug: slugify(name, i + 1),
      description: faker.commerce.productDescription(),
      sku,
      price,
      cost,
      stock_quantity: randomInt(0, 500),
      weight_kg: randomFloat(0.05, 25, 3),
      brand: faker.company.name().split(" ")[0],
      is_active: Math.random() > 0.05, // 95% active
      is_featured: Math.random() < 0.08, // 8% featured
    });
  }

  // Bulk insert in batches
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const placeholders: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const r of batch) {
      placeholders.push(
        `($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++})`,
      );
      values.push(
        r.category_id,
        r.name,
        r.slug,
        r.description,
        r.sku,
        r.price,
        r.cost,
        r.stock_quantity,
        r.weight_kg,
        r.brand,
        r.is_active,
        r.is_featured,
      );
    }

    const res = await client.query<{
      id: number;
      price: number;
      category_id: number;
    }>(
      `INSERT INTO products
         (category_id, name, slug, description, sku, price, cost,
          stock_quantity, weight_kg, brand, is_active, is_featured)
       VALUES ${placeholders.join(",")}
       RETURNING id, price, category_id`,
      values,
    );
    for (const row of res.rows) {
      products.push({
        id: row.id,
        price: parseFloat(row.price as any),
        categoryId: row.category_id,
      });
    }
  }

  console.log(`${products.length} rows`);
  return products;
}

async function seedCustomers(client: PoolClient): Promise<Customer[]> {
  process.stdout.write("  Inserting customers... ");
  const customers: Customer[] = [];
  const rows: any[] = [];

  const segments = ["new", "occasional", "regular", "loyal", "vip"];
  const segmentWeights = [30, 30, 20, 12, 8];

  for (let i = 0; i < NUM_CUSTOMERS; i++) {
    const state = US_STATES[randomInt(0, US_STATES.length - 1)];
    const sexChoice = Math.random();
    const firstName =
      sexChoice < 0.48
        ? faker.person.firstName("male")
        : sexChoice < 0.96
          ? faker.person.firstName("female")
          : faker.person.firstName();
    const lastName = faker.person.lastName();

    // Weighted segment pick
    const totalW = segmentWeights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalW;
    let segment = "new";
    for (let s = 0; s < segments.length; s++) {
      // @ts-ignore
      r -= segmentWeights[s];
      
      if (r <= 0) {
        //@ts-ignore
        segment = segments[s];
        break;
      }
    }

    rows.push({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${faker.internet.domainName()}`,
      first_name: firstName,
      last_name: lastName,
      phone: faker.phone.number(),
      date_of_birth: faker.date.birthdate({ min: 18, max: 75, mode: "age" }),
      gender: sexChoice < 0.48 ? "male" : sexChoice < 0.96 ? "female" : "other",
      segment,
      city: faker.location.city(),
      state,
      country: "United States",
      postal_code: faker.location.zipCode(),
      latitude: randomFloat(25.0, 49.0, 6),
      longitude: randomFloat(-124.0, -67.0, 6),
      is_email_verified: Math.random() > 0.15,
      is_active: Math.random() > 0.03,
      created_at: faker.date.past({ years: 2 }),
    });
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const placeholders: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const r of batch) {
      placeholders.push(
        `($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++}::customer_segment,$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++})`,
      );
      values.push(
        r.email,
        r.first_name,
        r.last_name,
        r.phone,
        r.date_of_birth,
        r.gender,
        r.segment,
        r.city,
        r.state,
        r.country,
        r.postal_code,
        r.latitude,
        r.longitude,
        r.is_email_verified,
        r.is_active,
        r.created_at,
      );
    }

    const res = await client.query<{ id: number; state: string }>(
      `INSERT INTO customers
         (email, first_name, last_name, phone, date_of_birth, gender,
          segment, city, state, country, postal_code, latitude, longitude,
          is_email_verified, is_active, created_at)
       VALUES ${placeholders.join(",")}
       RETURNING id, state`,
      values,
    );
    for (const row of res.rows) {
      customers.push({ id: row.id, state: row.state });
    }
  }

  console.log(`${customers.length} rows`);
  return customers;
}

async function seedOrders(
  client: PoolClient,
  customers: Customer[],
): Promise<OrderRow[]> {
  process.stdout.write(`  Inserting ${TARGET_ORDERS} orders... `);
  const orders: OrderRow[] = [];
  const rows: any[] = [];

  const coupons = [
    "SAVE10",
    "WELCOME20",
    "SUMMER15",
    "FLASH5",
    null,
    null,
    null,
    null,
    null,
    null,
  ];

  for (let i = 0; i < TARGET_ORDERS; i++) {
    const customer: any = customers[randomInt(0, customers.length - 1)];
    const status = (weightedRandom(ORDER_STATUSES as any) as any)
      .status as string;
    const payment = (weightedRandom(PAYMENT_METHODS as any) as any)
      .method as string;
    const createdAt = randomOrderDate();

    const subtotal = randomFloat(9.99, 799.99);
    const discount =
      Math.random() < 0.2
        ? parseFloat((subtotal * randomFloat(0.05, 0.25)).toFixed(2))
        : 0;
    const shipping = subtotal > 50 ? 0 : randomFloat(3.99, 14.99);
    const tax = parseFloat(((subtotal - discount) * 0.08).toFixed(2));
    const total = parseFloat((subtotal - discount + shipping + tax).toFixed(2));

    const isShipped = ["shipped", "delivered"].includes(status);
    const isDelivered = status === "delivered";
    const shippedAt = isShipped
      ? new Date(createdAt.getTime() + randomInt(1, 5) * 86400000)
      : null;
    const deliveredAt = isDelivered
      ? new Date(createdAt.getTime() + randomInt(4, 12) * 86400000)
      : null;

    rows.push({
      customer_id: customer.id,
      status,
      payment_method: payment,
      subtotal,
      discount_amount: discount,
      shipping_amount: shipping,
      tax_amount: tax,
      total_amount: total,
      shipping_name: faker.person.fullName(),
      shipping_address: faker.location.streetAddress(),
      shipping_city: faker.location.city(),
      shipping_state: customer.state,
      shipping_country: "United States",
      shipping_postal: faker.location.zipCode(),
      coupon_code: coupons[randomInt(0, coupons.length - 1)],
      shipped_at: shippedAt,
      delivered_at: deliveredAt,
      created_at: createdAt,
    });
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const placeholders: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const r of batch) {
      placeholders.push(
        `($${idx++},$${idx++}::order_status,$${idx++}::payment_method,` +
          `$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},` +
          `$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++})`,
      );
      values.push(
        r.customer_id,
        r.status,
        r.payment_method,
        r.subtotal,
        r.discount_amount,
        r.shipping_amount,
        r.tax_amount,
        r.total_amount,
        r.shipping_name,
        r.shipping_address,
        r.shipping_city,
        r.shipping_state,
        r.shipping_country,
        r.shipping_postal,
        r.coupon_code,
        r.shipped_at,
        r.delivered_at,
        r.created_at,
      );
    }

    const res = await client.query<{
      id: number;
      customer_id: number;
      created_at: Date;
    }>(
      `INSERT INTO orders
         (customer_id, status, payment_method,
          subtotal, discount_amount, shipping_amount, tax_amount, total_amount,
          shipping_name, shipping_address, shipping_city,
          shipping_state, shipping_country, shipping_postal,
          coupon_code, shipped_at, delivered_at, created_at)
       VALUES ${placeholders.join(",")}
       RETURNING id, customer_id, created_at`,
      values,
    );
    for (const row of res.rows) {
      orders.push({
        id: row.id,
        customerId: row.customer_id,
        createdAt: row.created_at,
      });
    }
  }

  console.log(`${orders.length} rows`);
  return orders;
}

async function seedOrderItems(
  client: PoolClient,
  orders: OrderRow[],
  products: Product[],
): Promise<Map<number, Set<number>>> {
  process.stdout.write("  Inserting order items... ");

  const customerProductMap = new Map<number, Set<number>>();
  const rows: any[] = [];
  let totalItems = 0;

  for (const order of orders) {
    const numItems = randomInt(1, 4);

    const usedProductIds = new Set<number>();

    for (let j = 0; j < numItems; j++) {
      let product: Product | any;
      let attempts = 0;
      do {
        product = products[randomInt(0, products.length - 1)];
        attempts++;
      } while (usedProductIds.has(product.id) && attempts < 20);

      if (usedProductIds.has(product.id)) continue;
      usedProductIds.add(product.id);

      const quantity = randomInt(1, 5);
      const discountPct = Math.random() < 0.15 ? randomFloat(5, 30) : 0;
      const lineTotal = parseFloat(
        (product.price * quantity * (1 - discountPct / 100)).toFixed(2),
      );

      rows.push({
        order_id: order.id,
        product_id: product.id,
        quantity,
        unit_price: product.price,
        discount_pct: discountPct,
        line_total: lineTotal,
      });

      if (!customerProductMap.has(order.customerId)) {
        customerProductMap.set(order.customerId, new Set());
      }
      customerProductMap.get(order.customerId)!.add(product.id);
      totalItems++;
    }
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const placeholders: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const r of batch) {
      placeholders.push(
        `($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++})`,
      );
      values.push(
        r.order_id,
        r.product_id,
        r.quantity,
        r.unit_price,
        r.discount_pct,
        r.line_total,
      );
    }

    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount_pct, line_total)
       VALUES ${placeholders.join(",")}
       ON CONFLICT (order_id, product_id) DO NOTHING`,
      values,
    );
  }

  console.log(`${totalItems} rows`);
  return customerProductMap;
}

async function seedReviews(
  client: PoolClient,
  customerProductMap: Map<number, Set<number>>,
  orders: OrderRow[],
): Promise<void> {
  process.stdout.write(`  Inserting reviews (up to ${NUM_REVIEWS})... `);

  const eligible: [number, number][] = [];
  for (const [customerId, productIds] of customerProductMap.entries()) {
    for (const productId of productIds) {
      eligible.push([customerId, productId]);
    }
  }

  for (let i = eligible.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    //@ts-ignore
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  const toReview = eligible.slice(0, NUM_REVIEWS);

  // Build a customer→orderId map for linking reviews to orders
  const customerOrderMap = new Map<number, number>();
  for (const o of orders) {
    if (!customerOrderMap.has(o.customerId)) {
      customerOrderMap.set(o.customerId, o.id);
    }
  }

  const rows: any[] = [];
  const seenPairs = new Set<string>(); // guard against duplicates

  for (const [customerId, productId] of toReview) {
    const key = `${customerId}:${productId}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);

    // Ratings skew positive (reflects real ecommerce patterns)
    const ratingWeights = [3, 7, 12, 35, 43]; // 1★ … 5★
    let rng = Math.random() * 100;
    let rating = 5;
    for (let s = 0; s < ratingWeights.length; s++) {
      // @ts-ignore
      rng -= ratingWeights[s];
      if (rng <= 0) {
        rating = s + 1;
        break;
      }
    }

    rows.push({
      customer_id: customerId,
      product_id: productId,
      order_id: customerOrderMap.get(customerId) ?? null,
      rating,
      title: faker.lorem.sentence({ min: 4, max: 8 }),
      body: faker.lorem.paragraph({ min: 1, max: 4 }),
      is_verified: Math.random() > 0.2,
      helpful_count: randomInt(0, 120),
      created_at: faker.date.past({ years: 1 }),
    });
  }

  // Bulk insert in batches
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const placeholders: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const r of batch) {
      placeholders.push(
        `($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++})`,
      );
      values.push(
        r.customer_id,
        r.product_id,
        r.order_id,
        r.rating,
        r.title,
        r.body,
        r.is_verified,
        r.helpful_count,
        r.created_at,
      );
    }

    await client.query(
      `INSERT INTO reviews
         (customer_id, product_id, order_id, rating, title, body, is_verified, helpful_count, created_at)
       VALUES ${placeholders.join(",")}
       ON CONFLICT (customer_id, product_id) DO NOTHING`,
      values,
    );
  }

  console.log(`${rows.length} rows`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log("\nStarting database seed\n");
  const startTime = Date.now();

  const client = await pool.connect();
  try {
    // Verify schema exists
    const tableCheck = await client.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM information_schema.tables
       WHERE table_schema = 'public'
       AND table_name IN ('categories','products','customers','orders','order_items','reviews')`,
    );
    // @ts-ignore
    if (parseInt(tableCheck.rows[0].count, 10) < 6) {
      throw new Error(
        "Schema tables not found. Run `npm run db:schema` first.",
      );
    }

    await client.query("BEGIN");

    // Disable triggers temporarily for speed (re-enable after)
    await client.query("SET session_replication_role = replica");

    const categories = await seedCategories(client);
    const products = await seedProducts(client, categories);
    const customers = await seedCustomers(client);
    const orders = await seedOrders(client, customers);
    const customerProducts = await seedOrderItems(client, orders, products);
    await seedReviews(client, customerProducts, orders);

    // Re-enable triggers
    await client.query("SET session_replication_role = DEFAULT");

    await client.query("COMMIT");

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nSeed complete in ${elapsed}s\n`);
    console.log("Summary:");
    console.log(`  Categories : ${categories.length}`);
    console.log(`  Products   : ${products.length}`);
    console.log(`  Customers  : ${customers.length}`);
    console.log(`  Orders     : ${orders.length}`);
    console.log(`  Reviews    : up to ${NUM_REVIEWS}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\nSeed failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
