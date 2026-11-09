require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Missing Supabase configuration in .env.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
const DATA_DIR = path.join(__dirname, "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const PRODUCT_IMAGES_FILE = path.join(DATA_DIR, "product-images.json");
async function readProductImages() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    const data = await fs.readFile(PRODUCT_IMAGES_FILE, "utf8");
    const images = JSON.parse(data);

    if (!images || typeof images !== "object" || Array.isArray(images)) {
      throw new Error("Product images data must be a JSON object.");
    }

    return images;
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(PRODUCT_IMAGES_FILE, "{}", "utf8");
      return {};
    }

    throw error;
  }
}

async function saveProductImages(images) {
  if (!images || typeof images !== "object" || Array.isArray(images)) {
    throw new Error("Invalid product images data.");
  }

  await fs.mkdir(DATA_DIR, { recursive: true });

  const temporaryFile = `${PRODUCT_IMAGES_FILE}.tmp`;

  await fs.writeFile(
    temporaryFile,
    JSON.stringify(images, null, 2),
    "utf8"
  );

  await fs.rename(temporaryFile, PRODUCT_IMAGES_FILE);
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

const emailTransporter =
  EMAIL_USER && EMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_APP_PASSWORD.replace(/\s/g, ""),
        },
      })
    : null;

// Shop catalogue. Keep product IDs aligned with public/js/shop.js.
// These are the current sample prices; confirm them before taking real orders.

const SHOP_PRODUCTS = [
  // HAIR CARE — 20 products

  { id: "hair-001", name: "Rosemary Hair Shampoo", price: 300000, category: "haircare" },
  { id: "hair-002", name: "Nourishing Hair Mask", price: 8000, category: "haircare" },
  { id: "hair-003", name: "Hair Repair Oil", price: 17000, category: "haircare" },
  { id: "hair-004", name: "Curl Defining Cream", price: 9500, category: "haircare" },
  { id: "hair-005", name: "Moisturising Conditioner", price: 11000, category: "haircare" },
  { id: "hair-006", name: "Anti-Dandruff Shampoo", price: 9000, category: "haircare" },
  { id: "hair-007", name: "Leave-In Conditioner", price: 8500, category: "haircare" },
  { id: "hair-008", name: "Hair Growth Serum", price: 5500, category: "haircare" },
  { id: "hair-009", name: "Argan Hair Oil", price: 7500, category: "haircare" },
  { id: "hair-010", name: "Coconut Hair Oil", price: 4000, category: "haircare" },
  { id: "hair-011", name: "Strengthening Hair Cream", price: 8000, category: "haircare" },
  { id: "hair-012", name: "Deep Repair Conditioner", price: 12500, category: "haircare" },
  { id: "hair-013", name: "Heat Protection Spray", price: 7500, category: "haircare" },
  { id: "hair-014", name: "Scalp Treatment Oil", price: 10000, category: "haircare" },
  { id: "hair-015", name: "Anti-Breakage Hair Lotion", price: 8500, category: "haircare" },
  { id: "hair-016", name: "Hair Protein Treatment", price: 6000, category: "haircare" },
  { id: "hair-017", name: "Shea Butter Hair Cream", price: 5500, category: "haircare" },
  { id: "hair-018", name: "Hair Detangling Spray", price: 7000, category: "haircare" },
  { id: "hair-019", name: "Silk Press Serum", price: 11000, category: "haircare" },
  { id: "hair-020", name: "Hair Moisture Butter", price: 4200, category: "haircare" },

  // SKINCARE — 20 products
{ id: "skin-001", name: "Hydrating Face Serum", price: 10500, category: "skincare" },
  { id: "skin-002", name: "Daily Moisturising Cream", price: 10500, category: "skincare" },
  { id: "skin-003", name: "Gentle Facial Cleanser", price: 5000, category: "skincare" },
  { id: "skin-004", name: "Vitamin C Face Serum", price: 4500, category: "skincare" },
  { id: "skin-005", name: "Daily Sunscreen SPF", price: 15000, category: "skincare" },
  { id: "skin-006", name: "Gentle Face Toner", price: 7500, category: "skincare" },
  { id: "skin-007", name: "Niacinamide Serum", price: 12500, category: "skincare" },
  { id: "skin-008", name: "Hyaluronic Acid Serum", price: 13500, category: "skincare" },
  { id: "skin-009", name: "Clay Face Mask", price: 5000, category: "skincare" },
  { id: "skin-010", name: "Exfoliating Face Scrub", price: 7000, category: "skincare" },
  { id: "skin-011", name: "Eye Repair Cream", price: 8500, category: "skincare" },
  { id: "skin-012", name: "Night Repair Cream", price: 14000, category: "skincare" },
  { id: "skin-013", name: "Micellar Cleansing Water", price: 9000, category: "skincare" },
  { id: "skin-014", name: "Aloe Vera Face Gel", price: 6500, category: "skincare" },
  { id: "skin-015", name: "Lip Care Balm", price: 2500, category: "skincare" },
  { id: "skin-016", name: "Gentle Makeup Remover", price: 1500, category: "skincare" },
  { id: "skin-017", name: "Hydrating Face Mist", price: 22000, category: "skincare" },
  { id: "skin-018", name: "Overnight Face Mask", price: 4000, category: "skincare" },
  { id: "skin-019", name: "Pore Cleansing Gel", price: 8500, category: "skincare" },
  { id: "skin-020", name: "Daily Face Moisturiser", price: 9500, category: "skincare" },

  // MAKEUP — 20 products

  { id: "makeup-001", name: "Everyday Makeup Palette", price: 18000, category: "makeup" },
  { id: "makeup-002", name: "Lip Gloss Set", price: 8500, category: "makeup" },
  { id: "makeup-003", name: "Liquid Foundation", price: 12000, category: "makeup" },
  { id: "makeup-004", name: "Matte Lipstick", price: 6500, category: "makeup" },
  { id: "makeup-005", name: "Concealer Palette", price: 9500, category: "makeup" },
  { id: "makeup-006", name: "Pressed Face Powder", price: 8000, category: "makeup" },
  { id: "makeup-007", name: "Loose Setting Powder", price: 9000, category: "makeup" },
  { id: "makeup-008", name: "Waterproof Mascara", price: 7000, category: "makeup" },
  { id: "makeup-009", name: "Liquid Eyeliner", price: 4500, category: "makeup" },
  { id: "makeup-010", name: "Brow Pencil Set", price: 5000, category: "makeup" },
  { id: "makeup-011", name: "Blush Palette", price: 10500, category: "makeup" },
  { id: "makeup-012", name: "Face Contour Kit", price: 12000, category: "makeup" },
  { id: "makeup-013", name: "Highlighter Palette", price: 9500, category: "makeup" },
  { id: "makeup-014", name: "Makeup Setting Spray", price: 8500, category: "makeup" },
  { id: "makeup-015", name: "Lip Liner Set", price: 6000, category: "makeup" },
  { id: "makeup-016", name: "False Eyelashes Set", price: 5500, category: "makeup" },
  { id: "makeup-017", name: "Eyeshadow Brush Set", price: 9000, category: "makeup" },
  { id: "makeup-018", name: "Tinted Lip Oil", price: 5000, category: "makeup" },
  { id: "makeup-019", name: "Primer Makeup Base", price: 10000, category: "makeup" },
  { id: "makeup-020", name: "Full Coverage Foundation", price: 15500, category: "makeup" },

  // HAIR TOOLS — 20 products

  { id: "tool-001", name: "Detangling Hair Brush", price: 4500, category: "tools" },
  { id: "tool-002", name: "Professional Hair Straightener", price: 28000, category: "tools" },
  { id: "tool-003", name: "Wide-Tooth Comb", price: 2000, category: "tools" },
  { id: "tool-004", name: "Professional Blow Dryer", price: 25000, category: "tools" },
  { id: "tool-005", name: "Curling Wand", price: 22000, category: "tools" },
  { id: "tool-006", name: "Round Styling Brush", price: 5000, category: "tools" },
  { id: "tool-007", name: "Sectioning Hair Clips", price: 2500, category: "tools" },
  { id: "tool-008", name: "Edge Styling Brush", price: 1800, category: "tools" },
  { id: "tool-009", name: "Detangling Comb Set", price: 3500, category: "tools" },
  { id: "tool-010", name: "Electric Hot Comb", price: 18000, category: "tools" },
  { id: "tool-011", name: "Hair Diffuser Attachment", price: 9000, category: "tools" },
  { id: "tool-012", name: "Hair Cutting Scissors", price: 7500, category: "tools" },
  { id: "tool-013", name: "Salon Hair Clips Set", price: 3000, category: "tools" },
  { id: "tool-014", name: "Scalp Massage Brush", price: 2500, category: "tools" },
  { id: "tool-015", name: "Silicone Shampoo Brush", price: 2800, category: "tools" },
  { id: "tool-016", name: "Heatless Curling Set", price: 6500, category: "tools" },
  { id: "tool-017", name: "Mini Travel Hair Dryer", price: 16000, category: "tools" },
  { id: "tool-018", name: "Hair Roller Set", price: 4500, category: "tools" },
  { id: "tool-019", name: "Salon Spray Bottle", price: 2200, category: "tools" },
  { id: "tool-020", name: "Professional Hair Dryer Brush", price: 30000, category: "tools" },

  // ACCESSORIES — 20 products

  { id: "accessory-001", name: "Satin Hair Bonnet", price: 3500, category: "accessories" },
  { id: "accessory-002", name: "Beauty Essentials Set", price: 15000, category: "accessories" },
  { id: "accessory-003", name: "Silk Pillowcase", price: 8500, category: "accessories" },
  { id: "accessory-004", name: "Satin Scrunchies Set", price: 3000, category: "accessories" },
  { id: "accessory-005", name: "Fashion Hair Clips", price: 2500, category: "accessories" },
  { id: "accessory-006", name: "Decorative Hair Pins", price: 2000, category: "accessories" },
  { id: "accessory-007", name: "Wide Satin Headband", price: 2500, category: "accessories" },
  { id: "accessory-008", name: "Makeup Travel Bag", price: 6500, category: "accessories" },
  { id: "accessory-009", name: "Cosmetic Storage Organiser", price: 12000, category: "accessories" },
  { id: "accessory-010", name: "Reusable Makeup Pads", price: 3500, category: "accessories" },
  { id: "accessory-011", name: "Makeup Sponge Set", price: 4000, category: "accessories" },
  { id: "accessory-012", name: "Beauty Headband Set", price: 3000, category: "accessories" },
  { id: "accessory-013", name: "Shower Hair Cap", price: 2200, category: "accessories" },
  { id: "accessory-014", name: "Hair Extension Storage Bag", price: 5500, category: "accessories" },
  { id: "accessory-015", name: "Satin Sleep Scrunchies", price: 2800, category: "accessories" },
  { id: "accessory-016", name: "Makeup Brush Cleaning Mat", price: 3500, category: "accessories" },
  { id: "accessory-017", name: "Travel Beauty Mirror", price: 7000, category: "accessories" },
  { id: "accessory-018", name: "Cosmetic Pouch Set", price: 5000, category: "accessories" },
  { id: "accessory-019", name: "Hair Turban Towel", price: 4500, category: "accessories" },
  { id: "accessory-020", name: "Beauty Gift Box Set", price: 18000, category: "accessories" }
];

const SERVICE_PRICES = {
  "Hair Styling": {
    "Basic Styling": 10000,
    "Premium Styling": 15000,
    "Luxury Styling": 25000,
  },
  Braids: {
    "Knotless Braids": 35000,
    "Box Braids": 25000,
    Cornrows: 15000,
    "Ghana Weaving": 20000,
  },
  "Wig Installation": {
    "Basic Installation": 10000,
    "Installation and Styling": 15000,
    "Premium Installation": 25000,
  },
  "Hair Treatment": {
    "Basic Treatment": 10000,
    "Deep Conditioning": 15000,
    "Premium Treatment": 20000,
  },
  "Hair Colouring": {
    "Basic Colouring": 15000,
    "Full Colouring": 25000,
    "Premium Colouring": 35000,
  },
  "Home Services": {
    "Basic Home Service": 20000,
    "Home Braids": 40000,
    "Premium Home Styling": 50000,
  },
};

const ALLOWED_TIMES = [
  "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00",
];

async function ensureJsonArrayFile(filePath) {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf8");
  }
}

async function readJsonArray(filePath, label) {
  await ensureJsonArrayFile(filePath);

  const contents = await fs.readFile(filePath, "utf8");
  const value = JSON.parse(contents);

  if (!Array.isArray(value)) {
    throw new Error(`${label} storage has an invalid format.`);
  }

  return value;
}

async function saveJsonArray(filePath, value) {
  await ensureJsonArrayFile(filePath);

  const temporaryFile = `${filePath}.tmp`;

  await fs.writeFile(
    temporaryFile,
    JSON.stringify(value, null, 2),
    "utf8"
  );

  await fs.rename(temporaryFile, filePath);
}


async function readBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select("record");

  if (error) throw error;

  if (!data.length) {
    const local = await readJsonArray(BOOKINGS_FILE, "Booking");

    if (local.length) {
      await saveBookings(local);
    }

    return local;
  }

  return data.map(row => row.record);
}

async function saveBookings(bookings) {
  if (!bookings.length) return;

  const rows = bookings.map(item => ({
    id: item.id,
    record: item
  }));

  const { error } = await supabase
    .from("bookings")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}
async function readOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("record");

  if (error) throw error;

  if (!data.length) {
    const local = await readJsonArray(ORDERS_FILE, "Order");

    if (local.length) {
      await saveOrders(local);
    }

    return local;
  }

  return data.map(row => row.record);
}

async function saveOrders(orders) {
  if (!orders.length) return;

  const rows = orders.map(item => ({
    id: item.id,
    record: item
  }));

  const { error } = await supabase
    .from("orders")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}
async function sendBookingStatusEmail(booking) {
  if (!emailTransporter) {
    throw new Error(
      "Email is not configured. Check EMAIL_USER and EMAIL_APP_PASSWORD in .env."
    );
  }

  if (!booking.email) {
    throw new Error("This booking has no customer email address.");
  }

  const isConfirmed = booking.status === "confirmed";
  const statusText = isConfirmed ? "Confirmed" : "Rejected";

  const paymentText =
    booking.paymentStatus === "paid"
      ? "Your 30% deposit payment has been received."
      : "Your deposit payment status has not been confirmed as paid.";

  await emailTransporter.sendMail({
    from: `"TimaBeauty Salon" <${EMAIL_USER}>`,
    to: booking.email,
    subject: `TimaBeauty Salon Appointment ${statusText}`,
    text: [
      `Hello ${booking.name || "Customer"},`,
      "",
      isConfirmed
        ? "Good news! Your appointment has been confirmed."
        : "We are sorry, but your appointment could not be confirmed.",
      "",
      `Booking reference: ${booking.id}`,
      `Service: ${booking.service || "Not specified"}`,
      `Style: ${booking.hairstyle || "Not specified"}`,
      `Date: ${booking.date || "Not specified"}`,
      `Time: ${booking.time || "Not specified"}`,
      `Payment: ${paymentText}`,
      "",
      isConfirmed
        ? "We look forward to welcoming you to TimaBeauty Salon."
        : "Please contact TimaBeauty Salon if you need assistance. If you have already paid a deposit, contact the salon regarding the payment.",
      "",
      "TimaBeauty Salon",
    ].join("\n"),
  });
}

if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !SESSION_SECRET) {
  console.error("Missing admin configuration in .env.");
  process.exit(1);
}

if (SESSION_SECRET.length < 32 || ADMIN_PASSWORD.length < 12) {
  console.error("Check your SESSION_SECRET and ADMIN_PASSWORD lengths.");
  process.exit(1);
}

app.disable("x-powered-by");

app.use(
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],

      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://checkout.flutterwave.com"
      ],

      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],

      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],

      imgSrc: [
        "'self'",
        "data:",
        "https:"
      ],

      connectSrc: [
        "'self'",
        "https://api.flutterwave.com"
      ],

      mediaSrc: [
        "'self'",
        "https:"
      ],

      frameSrc: [
        "'self'",
        "https://www.google.com",
        "https://maps.google.com",
        "https://checkout.flutterwave.com"
      ],

      objectSrc: ["'none'"],

      frameAncestors: ["'self'"],

      upgradeInsecureRequests: null
    }
  }
})

);

app.use(express.json({ limit: "20kb" }));

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  session({
    name: "timabeauty.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 4,
    },
  })
);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many login attempts. Please try again later.",
  },
});

function isAuthenticated(req, res, next) {
  if (req.session?.adminAuthenticated === true) {
    return next();
  }

  return res.status(401).json({
    error: "Please log in to access the admin dashboard.",
  });
}

function safeEqual(first, second) {
  const firstHash = crypto.createHash("sha256").update(first).digest();
  const secondHash = crypto.createHash("sha256").update(second).digest();

  return crypto.timingSafeEqual(firstHash, secondHash);
}

function validBookingStatus(status) {
  return ["confirmed", "rejected"].includes(status);
}

function getBaseUrl() {
  return (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, "");
}

function validCustomerDetails({ name, phone, email }) {
  return (
    typeof name === "string" &&
    name.trim().length >= 2 &&
    name.trim().length <= 100 &&
    typeof phone === "string" &&
    /^[+0-9\s()-]{7,20}$/.test(phone.trim()) &&
    typeof email === "string" &&
    email.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

// HEALTH CHECK

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "TimaBeauty Salon API",
  });
});
// SERVICES AND PRICES

app.get("/api/services", (req, res) => {
  res.json({
    currency: "NGN",
    services: SERVICE_PRICES,
  });
});

// SHOP PRODUCTS
// The server's prices are trusted, not prices sent by the browser.

// SHOP PRODUCTS
// Product prices are controlled by the server.
// Each product receives its own HTTPS image URL.

const SHOP_IMAGE_URLS = {
  hair: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",
  skincare: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",
  makeup: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600",
  tools: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600",
  accessories: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
};

app.get("/api/shop/products", async (req, res, next) => {
  try {
    const productImages = await readProductImages();

    res.json({
      currency: "NGN",
      products: SHOP_PRODUCTS.map((product) => ({
        ...product,
        image: productImages[product.id] || ""
      }))
    });
  } catch (error) {
    next(error);
  }
});
// ADMIN LOGIN

app.post("/api/admin/login", loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.length > 200 ||
      password.length > 200
    ) {
      return res.status(400).json({
        error: "Please enter your username and password.",
      });
    }

    if (
      !safeEqual(username, ADMIN_USERNAME) ||
      !safeEqual(password, ADMIN_PASSWORD)
    ) {
      return res.status(401).json({
        error: "Incorrect username or password.",
      });
    }

    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.adminAuthenticated = true;
      req.session.adminUsername = ADMIN_USERNAME;

      req.session.save((saveError) => {
        if (saveError) return next(saveError);

        res.json({
          message: "Login successful.",
          username: ADMIN_USERNAME,
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

// CHECK ADMIN SESSION

app.get("/api/admin/me", (req, res) => {
  if (req.session?.adminAuthenticated !== true) {
    return res.status(401).json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    username: req.session.adminUsername,
  });
});

// ADMIN LOGOUT

app.post("/api/admin/logout", isAuthenticated, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("timabeauty.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.json({
      message: "You have logged out successfully.",
    });
  });
});

// CREATE APPOINTMENT BOOKING

app.post("/api/bookings", async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      service,
      hairstyle,
      date,
      time,
      notes = "",
    } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof phone !== "string" ||
      typeof email !== "string" ||
      typeof service !== "string" ||
      typeof hairstyle !== "string" ||
      typeof date !== "string" ||
      typeof time !== "string" ||
      typeof notes !== "string"
    ) {
      return res.status(400).json({
        error: "Please provide valid booking details.",
      });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanNotes = notes.trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        error: "Enter a name between 2 and 100 characters.",
      });
    }

    if (!/^[+0-9\s()-]{7,20}$/.test(cleanPhone)) {
      return res.status(400).json({
        error: "Enter a valid phone number.",
      });
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        error: "Enter a valid email address.",
      });
    }

    if (cleanNotes.length > 1000) {
      return res.status(400).json({
        error: "Booking notes cannot exceed 1,000 characters.",
      });
    }

    const selectedService = SERVICE_PRICES[service];

    if (!selectedService) {
      return res.status(400).json({
        error: "Please select a valid service.",
      });
    }

    const price = selectedService[hairstyle];

    if (typeof price !== "number") {
      return res.status(400).json({
        error: "Please select a valid hairstyle or service option.",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: "Please select a valid appointment date.",
      });
    }

    const appointmentDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(appointmentDate.getTime()) ||
      appointmentDate.toISOString().slice(0, 10) !== date ||
      appointmentDate < today
    ) {
      return res.status(400).json({
        error: "Please choose today or a future date.",
      });
    }

    if (!ALLOWED_TIMES.includes(time)) {
      return res.status(400).json({
        error: "Please select an available appointment time.",
      });
    }

    const bookings = await readBookings();

    const slotTaken = bookings.some(
      (booking) =>
        booking.date === date &&
        booking.time === time &&
        ["pending_review", "confirmed"].includes(booking.status)
    );

    if (slotTaken) {
      return res.status(409).json({
        error: "This time slot has already been requested. Please choose another time.",
      });
    }

    const deposit = Math.round(price * 0.3);

    const booking = {
      id: crypto.randomUUID(),
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      service,
      hairstyle,
      date,
      time,
      notes: cleanNotes,
      currency: "NGN",
      servicePrice: price,
      depositAmount: deposit,
      balanceAmount: price - deposit,
      status: "pending_review",
      paymentStatus: "not_started",
      createdAt: new Date().toISOString(),
    };

    bookings.push(booking);
    await saveBookings(bookings);

    res.status(201).json({
      message: "Your appointment request has been received.",
      booking: {
        id: booking.id,
        service: booking.service,
        hairstyle: booking.hairstyle,
        date: booking.date,
        time: booking.time,
        servicePrice: booking.servicePrice,
        depositAmount: booking.depositAmount,
        balanceAmount: booking.balanceAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

// START FLUTTERWAVE APPOINTMENT DEPOSIT CHECKOUT

app.post("/api/bookings/:id/pay-deposit", async (req, res, next) => {
  try {
    if (!FLUTTERWAVE_SECRET_KEY) {
      return res.status(503).json({
        error: "Payment service is not configured.",
      });
    }

    const bookings = await readBookings();
    const booking = bookings.find((item) => item.id === req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(409).json({
        error: "This booking deposit has already been paid.",
      });
    }

    if (
      !Number.isFinite(Number(booking.depositAmount)) ||
      Number(booking.depositAmount) <= 0 ||
      !booking.email ||
      !booking.name ||
      !booking.phone
    ) {
      return res.status(400).json({
        error: "The booking is missing valid payment details.",
      });
    }

    const txRef = `TIMA-DEP-${booking.id}-${crypto.randomUUID()}`;

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: Number(booking.depositAmount),
        currency: "NGN",
        redirect_url: `${getBaseUrl()}/api/payments/flutterwave-callback`,
        customer: {
          email: booking.email,
          name: booking.name,
          phonenumber: booking.phone,
        },
        meta: {
          bookingId: booking.id,
          purpose: "appointment_deposit",
        },
        customizations: {
          title: "TimaBeauty Salon",
          description: "30% appointment deposit",
        },
      }),
    });

    const result = await response.json();

    if (!response.ok || result.status !== "success" || !result.data?.link) {
      console.error("Flutterwave appointment checkout could not be created.");

      return res.status(502).json({
        error: "Could not start payment. Please try again.",
      });
    }

    booking.paymentReference = txRef;
    booking.paymentStatus = "pending";
    await saveBookings(bookings);

    res.json({
      paymentLink: result.data.link,
      reference: booking.id,
    });
  } catch (error) {
    next(error);
  }
});

// CREATE SHOP ORDER AND START FULL-PAYMENT CHECKOUT

app.post("/api/shop/checkout", async (req, res, next) => {
  try {
    if (!FLUTTERWAVE_SECRET_KEY) {
      return res.status(503).json({
        error: "Payment service is not configured.",
      });
    }

    const body = req.body || {};
    const { name, email, phone, address, items } = body;

    if (!validCustomerDetails({ name, email, phone })) {
      return res.status(400).json({
        error: "Enter a valid name, email address, and phone number.",
      });
    }

    if (
      typeof address !== "string" ||
      address.trim().length < 8 ||
      address.trim().length > 500
    ) {
      return res.status(400).json({
        error: "Enter a delivery address between 8 and 500 characters.",
      });
    }

    if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
      return res.status(400).json({
        error: "Your cart is empty or contains too many different products.",
      });
    }

    const orderItems = [];
    let total = 0;
    const seen = new Set();

    for (const item of items) {
      if (
        !item ||
        typeof item.id !== "string" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99 ||
        seen.has(item.id)
      ) {
        return res.status(400).json({
          error: "Your cart contains an invalid product or quantity.",
        });
      }

      seen.add(item.id);

      const product = SHOP_PRODUCTS.find((entry) => entry.id === item.id);

      if (!product) {
        return res.status(400).json({
          error: "A product in your cart is no longer available.",
        });
      }

      const lineTotal = product.price * item.quantity;
      total += lineTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        lineTotal,
      });
    }

    if (!Number.isSafeInteger(total) || total <= 0) {
      return res.status(400).json({
        error: "The order total is invalid.",
      });
    }

    const orderId = crypto.randomUUID();
    const txRef = `TIMA-SHOP-${orderId}-${crypto.randomUUID()}`;

    const order = {
      id: orderId,
      reference: txRef,
      customer: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
      },
      items: orderItems,
      currency: "NGN",
      totalAmount: total,
      paymentStatus: "pending",
      orderStatus: "awaiting_payment",
      createdAt: new Date().toISOString(),
    };

    const orders = await readOrders();
    orders.push(order);
    await saveOrders(orders);

    let response;

    try {
      response = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: total,
          currency: "NGN",
          redirect_url: `${getBaseUrl()}/api/payments/flutterwave-callback`,
          customer: {
            email: order.customer.email,
            name: order.customer.name,
            phonenumber: order.customer.phone,
          },
          meta: {
            orderId,
            purpose: "shop_order",
          },
          customizations: {
            title: "TimaBeauty Salon Shop",
            description: `Full payment for order ${orderId}`,
          },
        }),
      });
    } catch (paymentError) {
      order.paymentStatus = "checkout_error";
      order.orderStatus = "checkout_error";
      await saveOrders(orders);

      return res.status(502).json({
        error: "Could not connect to the payment service. Please try again.",
      });
    }

    const result = await response.json();

    if (!response.ok || result.status !== "success" || !result.data?.link) {
      order.paymentStatus = "checkout_error";
      order.orderStatus = "checkout_error";
      await saveOrders(orders);

      return res.status(502).json({
        error: "Could not start payment. Please try again.",
      });
    }

    order.paymentLinkCreatedAt = new Date().toISOString();
    await saveOrders(orders);

    res.status(201).json({
      message: "Order created. Continue to Flutterwave to pay.",
      orderId,
      paymentLink: result.data.link,
      totalAmount: total,
      currency: "NGN",
    });
  } catch (error) {
    next(error);
  }
});
// FLUTTERWAVE CALLBACK
// Verify shop orders and appointment deposits directly with Flutterwave.

app.get("/api/payments/flutterwave-callback", async (req, res) => {
  const redirectTo = (page, payment, reference) => {
    const query = new URLSearchParams({ payment });

    if (reference) {
      query.set("reference", reference);
    }

    return res.redirect(`${getBaseUrl()}/${page}?${query.toString()}`);
  };

  try {
    const { status, tx_ref, transaction_id } = req.query;

    if (
      !["successful", "completed"].includes(status) ||
      typeof tx_ref !== "string" ||
      typeof transaction_id !== "string" ||
      !FLUTTERWAVE_SECRET_KEY
    ) {
      return redirectTo("booking.html", "failed");
    }

    // First check whether the reference belongs to a shop order.

    const orders = await readOrders();
    const order = orders.find((item) => item.reference === tx_ref);

    if (order) {
      // Do not reprocess an order already marked as paid.

      if (order.paymentStatus === "paid") {
        return redirectTo("shop.html", "success", order.id);
      }

      const verifyResponse = await fetch(
        `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const verification = await verifyResponse.json();
      const transaction = verification.data;

      const valid =
        verifyResponse.ok &&
        verification.status === "success" &&
        transaction?.status === "successful" &&
        String(transaction?.tx_ref) === order.reference &&
        transaction?.currency === "NGN" &&
        Number(transaction?.amount) === Number(order.totalAmount);

      if (!valid) {
        order.paymentStatus = "verification_failed";
        order.orderStatus = "payment_not_confirmed";
        await saveOrders(orders);

        return redirectTo("shop.html", "failed", order.id);
      }

      order.paymentStatus = "paid";
      order.orderStatus = "processing";
      order.transactionId = String(transaction.id);
      order.paidAt = new Date().toISOString();

      await saveOrders(orders);

      return redirectTo("shop.html", "success", order.id);
    }

    // If no shop order matches, look for an appointment deposit.

    const bookings = await readBookings();
    const booking = bookings.find((item) => item.paymentReference === tx_ref);

    if (!booking) {
      return redirectTo("booking.html", "failed");
    }

    if (booking.paymentStatus === "paid") {
      return redirectTo("booking.html", "success", booking.id);
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verification = await response.json();
    const transaction = verification.data;

    const valid =
      response.ok &&
      verification.status === "success" &&
      transaction?.status === "successful" &&
      String(transaction?.tx_ref) === booking.paymentReference &&
      transaction?.currency === "NGN" &&
      Number(transaction?.amount) >= Number(booking.depositAmount);

    if (!valid) {
      return redirectTo("booking.html", "failed", booking.id);
    }

    booking.paymentStatus = "paid";
    booking.paymentTransactionId = String(transaction.id);
    booking.paidAt = new Date().toISOString();

    await saveBookings(bookings);

    return redirectTo("booking.html", "success", booking.id);
  } catch (error) {
    console.error("Payment verification error:", error.message);
    return redirectTo("booking.html", "failed");
  }
});

// ADMIN: GET ALL BOOKINGS

app.get("/api/admin/bookings", isAuthenticated, async (req, res, next) => {
  try {
    const bookings = await readBookings();

    bookings.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

// ADMIN: GET SHOP ORDERS

app.get("/api/admin/orders", isAuthenticated, async (req, res, next) => {
  try {
    const orders = await readOrders();

    orders.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    res.json({ orders });
  } catch (error) {
    next(error);
  }
});
app.put("/api/admin/products/:id/image", isAuthenticated, async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = SHOP_PRODUCTS.find((item) => item.id === productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const imageUrl = typeof req.body.image === "string"
      ? req.body.image.trim()
      : "";

    if (imageUrl.length > 2000) {
      return res.status(400).json({ error: "Image URL is too long." });
    }

    if (imageUrl) {
      let parsedUrl;

      try {
        parsedUrl = new URL(imageUrl);
      } catch {
        return res.status(400).json({ error: "Enter a valid image URL." });
      }

      if (parsedUrl.protocol !== "https:") {
        return res.status(400).json({ error: "Image URL must use HTTPS." });
      }
    }

    const images = await readProductImages();

    if (imageUrl) {
      images[productId] = imageUrl;
    } else {
      delete images[productId];
    }

    await saveProductImages(images);

    res.json({
      success: true,
      message: "Product image saved successfully.",
      productId,
      image: images[productId] || ""
    });
  } catch (error) {
    next(error);
  }
});
// ADMIN: CONFIRM OR REJECT BOOKINGS

app.patch(
  "/api/admin/bookings/:id/status",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const bookingId = req.params.id;
      const { status } = req.body || {};

      if (!validBookingStatus(status)) {
        return res.status(400).json({
          error: "Status must be confirmed or rejected.",
        });
      }

      const bookings = await readBookings();
      const index = bookings.findIndex((item) => item.id === bookingId);

      if (index === -1) {
        return res.status(404).json({ error: "Booking not found." });
      }

      const booking = bookings[index];

      if (booking.status === "rejected") {
        return res.status(409).json({
          error: "This booking has already been rejected.",
        });
      }

      if (booking.status === "confirmed" && status === "rejected") {
        return res.status(409).json({
          error: "A confirmed booking cannot be rejected through this action.",
        });
      }

      if (status === "confirmed") {
        const conflict = bookings.some(
          (other) =>
            other.id !== bookingId &&
            other.date === booking.date &&
            other.time === booking.time &&
            other.status === "confirmed"
        );

        if (conflict) {
          return res.status(409).json({
            error: "Another appointment is already confirmed for this time slot.",
          });
        }
      }

      const previousStatus = booking.status;

      booking.status = status;
      booking.updatedAt = new Date().toISOString();

      await saveBookings(bookings);

      let emailNotification = "not_sent";

      if (previousStatus !== status) {
        try {
          await sendBookingStatusEmail(booking);
          emailNotification = "sent";
        } catch (emailError) {
          console.error(
            "Appointment status email failed:",
            emailError.message
          );
          emailNotification = "failed";
        }
      }

      res.json({
        message: `Booking ${status} successfully.`,
        emailNotification,
        booking: {
          id: booking.id,
          status: booking.status,
          date: booking.date,
          time: booking.time,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// UNKNOWN API ENDPOINT

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found." });
});

// WEBSITE FILES

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  res.sendFile(
    path.join(__dirname, "public", "index.html"),
    (error) => {
      if (error) next(error);
    }
  );
});

// ERROR HANDLER
 
app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  if (res.headersSent) {
    return next(error);
  }   

  res.status(500).json({
    error: "Something went wrong on the server.",
  });
});

// START SERVER

app.listen(PORT, () => {
  console.log(`TimaBeauty Salon is running at http://localhost:${PORT}`);
});