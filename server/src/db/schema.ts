import { Pool } from "pg";
import { config } from "dotenv";
import { buildPoolConfig } from "./connection.js";

config();

function getPool(): Pool {
  const url = process.env.DATABASE_URL ?? process.env.DEMO_DATABASE_URL;
  if (!url) {
    throw new Error("Set DATABASE_URL or DEMO_DATABASE_URL for db:schema");
  }
  return new Pool(buildPoolConfig(url));
}

const SCHEMA_SQL = `
DROP TABLE IF EXISTS reviews      CASCADE;
DROP TABLE IF EXISTS order_items  CASCADE;
DROP TABLE IF EXISTS orders       CASCADE;
DROP TABLE IF EXISTS customers    CASCADE;
DROP TABLE IF EXISTS products     CASCADE;
DROP TABLE IF EXISTS categories   CASCADE;

DROP TYPE IF EXISTS order_status      CASCADE;
DROP TYPE IF EXISTS payment_method    CASCADE;
DROP TYPE IF EXISTS customer_segment  CASCADE;

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

CREATE TYPE payment_method AS ENUM (
  'credit_card',
  'debit_card',
  'paypal',
  'bank_transfer',
  'crypto',
  'gift_card'
);

CREATE TYPE customer_segment AS ENUM (
  'new',
  'occasional',
  'regular',
  'loyal',
  'vip'
);

CREATE TABLE categories (
  id            SERIAL        PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  slug          VARCHAR(120)  NOT NULL UNIQUE,
  description   TEXT,
  parent_id     INT           REFERENCES categories(id) ON DELETE SET NULL,
  display_order INT           NOT NULL DEFAULT 0,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent   ON categories(parent_id);
CREATE INDEX idx_categories_slug     ON categories(slug);

CREATE TABLE products (
  id               SERIAL          PRIMARY KEY,
  category_id      INT             NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name             VARCHAR(200)    NOT NULL,
  slug             VARCHAR(220)    NOT NULL UNIQUE,
  description      TEXT,
  sku              VARCHAR(50)     NOT NULL UNIQUE,
  price            NUMERIC(10, 2)  NOT NULL CHECK (price >= 0),
  cost             NUMERIC(10, 2)  NOT NULL CHECK (cost >= 0),
  stock_quantity   INT             NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  weight_kg        NUMERIC(6, 3),
  brand            VARCHAR(100),
  is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
  is_featured      BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_products_sku        ON products(sku);
CREATE INDEX idx_products_price      ON products(price);
CREATE INDEX idx_products_brand      ON products(brand);
CREATE INDEX idx_products_active     ON products(is_active);

CREATE TABLE customers (
  id               SERIAL           PRIMARY KEY,
  email            VARCHAR(255)     NOT NULL UNIQUE,
  first_name       VARCHAR(80)      NOT NULL,
  last_name        VARCHAR(80)      NOT NULL,
  phone            VARCHAR(30),
  date_of_birth    DATE,
  gender           VARCHAR(20),
  segment          customer_segment NOT NULL DEFAULT 'new',
  city             VARCHAR(100),
  state            VARCHAR(100),
  country          VARCHAR(80)      NOT NULL DEFAULT 'United States',
  postal_code      VARCHAR(20),
  latitude         NUMERIC(9, 6),
  longitude        NUMERIC(9, 6),
  is_email_verified BOOLEAN         NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_email     ON customers(email);
CREATE INDEX idx_customers_segment   ON customers(segment);
CREATE INDEX idx_customers_state     ON customers(state);
CREATE INDEX idx_customers_country   ON customers(country);
CREATE INDEX idx_customers_created   ON customers(created_at);

CREATE TABLE orders (
  id                  SERIAL          PRIMARY KEY,
  customer_id         INT             NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status              order_status    NOT NULL DEFAULT 'pending',
  payment_method      payment_method  NOT NULL,
  subtotal            NUMERIC(12, 2)  NOT NULL CHECK (subtotal >= 0),
  discount_amount     NUMERIC(12, 2)  NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  shipping_amount     NUMERIC(12, 2)  NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  tax_amount          NUMERIC(12, 2)  NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount        NUMERIC(12, 2)  NOT NULL CHECK (total_amount >= 0),
  shipping_name       VARCHAR(160),
  shipping_address    TEXT,
  shipping_city       VARCHAR(100),
  shipping_state      VARCHAR(100),
  shipping_country    VARCHAR(80),
  shipping_postal     VARCHAR(20),
  coupon_code         VARCHAR(40),
  notes               TEXT,
  shipped_at          TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer     ON orders(customer_id);
CREATE INDEX idx_orders_status       ON orders(status);
CREATE INDEX idx_orders_created      ON orders(created_at);
CREATE INDEX idx_orders_total        ON orders(total_amount);
CREATE INDEX idx_orders_payment      ON orders(payment_method);
CREATE INDEX idx_orders_active       ON orders(created_at)
  WHERE status NOT IN ('cancelled', 'refunded');

CREATE TABLE order_items (
  id              SERIAL          PRIMARY KEY,
  order_id        INT             NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      INT             NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity        INT             NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(10, 2)  NOT NULL CHECK (unit_price >= 0),
  discount_pct    NUMERIC(5, 2)   NOT NULL DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 100),
  line_total      NUMERIC(12, 2)  NOT NULL CHECK (line_total >= 0),
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order    ON order_items(order_id);
CREATE INDEX idx_order_items_product  ON order_items(product_id);
CREATE UNIQUE INDEX uq_order_items_order_product ON order_items(order_id, product_id);

CREATE TABLE reviews (
  id              SERIAL        PRIMARY KEY,
  customer_id     INT           NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id      INT           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id        INT           REFERENCES orders(id) ON DELETE SET NULL,
  rating          SMALLINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title           VARCHAR(200),
  body            TEXT,
  is_verified     BOOLEAN       NOT NULL DEFAULT FALSE,
  helpful_count   INT           NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_customer    ON reviews(customer_id);
CREATE INDEX idx_reviews_product     ON reviews(product_id);
CREATE INDEX idx_reviews_rating      ON reviews(rating);
CREATE INDEX idx_reviews_created     ON reviews(created_at);
CREATE UNIQUE INDEX uq_reviews_customer_product ON reviews(customer_id, product_id);

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE TRIGGER set_updated_at_customers
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE TRIGGER set_updated_at_reviews
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();
`;

async function runSchema(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(SCHEMA_SQL);
    await client.query("COMMIT");
    console.log("schema ok");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runSchema().catch((err) => {
  console.error(err);
  process.exit(1);
});
