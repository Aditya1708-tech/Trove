# 🛍️ Trove — Multi-Category E-Commerce Marketplace

A full-stack, production-ready e-commerce marketplace built with the MERN stack (MongoDB, Express, React/Vite, Node.js) — similar in scope to Flipkart/Amazon, featuring electronics, fashion, home & kitchen, books, and more.

---

## ✨ Features

**Customer-Facing**
- Home page with hero banners, category grid, flash deals countdown, personalized recommendations
- Category & sub-category browsing with filters (price, brand, rating, discount) + sorting
- Product detail page: image gallery/zoom, variant selector, specs, reviews, Q&A, similar products
- Persistent cart (localStorage + DB sync), wishlist, save-for-later
- Multi-step checkout: address, delivery slot, payment (Razorpay + COD), coupon codes
- Order tracking with status timeline (placed → packed → shipped → delivered)
- User account: email/phone + OTP or password login, order history, returns, saved addresses
- Global search with autocomplete & recent searches

**Admin Panel**
- Sales analytics dashboard (Recharts)
- User, category, coupon, order, and banner management
- Low-stock alerts, best-seller reports

**Seller Panel**
- Product CRUD with multi-image upload (Cloudinary)
- Inventory/stock management, order fulfillment view

**Backend**
- RESTful API with Joi validation & centralized error handling
- JWT (access + refresh tokens), bcrypt, role-based access control
- Razorpay payment integration & webhook verification
- Shiprocket shipping stub (order creation + tracking webhook)
- Nodemailer email + OTP SMS stub
- Rate limiting, helmet, CORS

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State | React Context API + useReducer |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access/refresh) + bcrypt |
| Payments | Razorpay |
| Images | Cloudinary |
| Shipping | Shiprocket (stub) |
| Email | Nodemailer |
| Charts | Recharts |
| Animations | Framer Motion |

---

## 📁 Project Structure

```
/trove
  /client          ← React + Vite frontend
  /server          ← Node.js + Express backend
  README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js >= 18.x
- MongoDB (local or Atlas)
- Cloudinary account
- Razorpay account (for payments)

### 1. Clone & Install

```bash
git clone <repo-url>
cd trove

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

**Server** — copy `server/.env.example` to `server/.env` and fill in values:

```bash
cp server/.env.example server/.env
```

**Client** — copy `client/.env.example` to `client/.env`:

```bash
cp client/.env.example client/.env
```

### 3. Seed Sample Data

```bash
cd server
npm run seed
```

This creates 20 sample products across 4 categories (Electronics, Fashion, Home & Kitchen, Books), 2 sellers, 1 admin user, and sample coupons.

**Default Admin Credentials:**
- Email: `admin@trove.com`
- Password: `Admin@123`

**Default Seller Credentials:**
- Email: `seller1@trove.com`
- Password: `Seller@123`

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Visit: **http://localhost:5173**

---

## 🔑 Environment Variables

See `server/.env.example` and `client/.env.example` for full lists.

Key variables:
- `MONGODB_URI` — MongoDB connection string
- `JWT_ACCESS_SECRET` — Secret for JWT access tokens
- `JWT_REFRESH_SECRET` — Secret for JWT refresh tokens
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `EMAIL_USER`, `EMAIL_PASS` — Nodemailer SMTP credentials

---

## 🧪 Running Tests

```bash
cd server
npm test
```

---

## 📦 API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login (email/password) |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/products | List products with filters |
| GET | /api/products/:slug | Product detail |
| POST | /api/cart | Add to cart |
| POST | /api/orders | Create order |
| POST | /api/payments/verify | Verify Razorpay payment |
| GET | /api/orders/:id/track | Track order |

Full API documentation available in `/server/docs/api.md`.

---

## 🚢 Deployment

- Frontend: Vercel / Netlify
- Backend: Railway / Render / AWS EC2
- Database: MongoDB Atlas
- Images: Cloudinary CDN

Set `NODE_ENV=production` and configure CORS origins accordingly.

---

## 📄 License

MIT
