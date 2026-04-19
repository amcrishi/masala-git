# SpiceCraft — Features Documentation

Production-ready full-stack e-commerce web application for an Indian traditional masala brand.

---

## 🔐 Default Admin Credentials

After running the seed (see [Seeding the default admin](#seeding-the-default-admin) below):

| Field    | Value                  |
| -------- | ---------------------- |
| Email    | `admin@spicecraft.in`  |
| Password | `Admin@123456`         |
| Role     | `admin`                |

> ⚠️ **Change this password immediately after first login** in production.

---

## Tech Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | Next.js 16 (App Router, Turbopack)          |
| Language      | TypeScript 5                                |
| UI            | React 19 + Tailwind CSS v4                  |
| Database      | MongoDB (Atlas) via Mongoose 9              |
| Auth          | JWT via `jose` (Edge-compatible) + bcryptjs |
| Payments      | Razorpay                                    |
| Validation    | Custom helpers + Mongoose schema validators |

---

## Authentication & Authorization

### Roles (RBAC)

| Role        | Capabilities                                                                      |
| ----------- | --------------------------------------------------------------------------------- |
| `admin`     | **Full access** — all CRUD, user management, analytics, orders, products          |
| `technician`| Manage products (add/edit), view analytics, manage orders                         |
| `user`      | Browse products, place orders, manage own profile                                 |

### How it works

- **Registration / Login**: `POST /api/auth/register`, `POST /api/auth/login` — issues a JWT signed with `JWT_SECRET` (HS256, 7-day expiry) and stores it in an `httpOnly` cookie named `token`.
- **Password security**: bcrypt (cost factor 12).
- **Edge middleware** (`src/middleware.ts`) protects `/dashboard`, `/admin`, `/checkout` — verifies JWT and redirects unauthenticated users to `/login`.
- **API-level RBAC** (`src/lib/api-helpers.ts`):
  - `authenticateRequest(req)` — verifies the cookie token.
  - `authorizeRequest(req, ...allowedRoles)` — verifies token AND role.
- **Self-protection**: Admins cannot delete their own account or change their own role (enforced in `/api/users/[id]`).

---

## Default Admin Capabilities

The default admin (`admin@spicecraft.in`) can:

### Products
- ✅ Add new products (name, description, price, stock, category, image)
- ✅ Edit existing products
- ✅ Delete products
- ✅ View all products with pagination, search, category filter

### Users
- ✅ View all users (paginated, with search by name/email and role filter)
- ✅ Create new users (with any role)
- ✅ Edit user details (name, email, password)
- ✅ Change user role (`user` ↔ `technician` ↔ `admin`)
- ✅ Delete users
- ❌ Cannot delete own account or change own role (safety lock)

### Analytics
- ✅ Total revenue (all-time, paid orders only)
- ✅ Total products / orders / users
- ✅ New users in last 30 days
- ✅ New orders in last 30 days
- ✅ Low stock alerts (≤ 10 units)
- ✅ Out-of-stock alerts
- ✅ Revenue trend (last 7 days, bar chart)
- ✅ Order trend (last 7 days, bar chart)
- ✅ Order status breakdown (pending / confirmed / shipped / delivered / cancelled)
- ✅ Payment status breakdown (pending / paid / failed / refunded)
- ✅ Top 5 selling products (by quantity sold + revenue)
- ✅ Products per category (with total stock)
- ✅ Users per role
- ✅ 5 most recent orders

### Orders
- ✅ View all orders, change status (pending → confirmed → shipped → delivered → cancelled)
- ✅ Verify payment status

---

## Project Structure

```
masala-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── admin/
│   │   │   ├── layout.tsx            # Premium sidebar layout (admin/technician only)
│   │   │   ├── page.tsx              # Product management
│   │   │   ├── analytics/page.tsx    # Analytics dashboard
│   │   │   ├── users/page.tsx        # User management (admin-only)
│   │   │   ├── orders/page.tsx
│   │   │   └── products/[id]/edit/page.tsx
│   │   ├── api/
│   │   │   ├── admin/seed/           # POST — seed default admin
│   │   │   ├── analytics/            # GET — aggregated metrics (admin/technician)
│   │   │   ├── auth/{register,login,logout,me}/
│   │   │   ├── orders/[id]/
│   │   │   ├── payment/{create-order,verify}/
│   │   │   ├── products/[id]/
│   │   │   └── users/[id]/           # GET/POST/PUT/DELETE (admin-only)
│   │   ├── checkout/, dashboard/, login/, register/, products/[id]/
│   │   └── layout.tsx, page.tsx
│   ├── components/
│   │   ├── admin/                    # Admin-specific components
│   │   ├── dashboard/                # Role-based dashboards
│   │   ├── forms/                    # LoginForm, RegisterForm, ProductForm
│   │   ├── layout/                   # Navbar, Footer
│   │   ├── products/                 # ProductCard, ProductGrid
│   │   └── ui/                       # LoadingSpinner, Pagination, Modal
│   ├── context/AuthContext.tsx       # Client auth state
│   ├── lib/
│   │   ├── mongodb.ts                # Cached Mongoose connection (IPv4 forced)
│   │   ├── auth.ts                   # JWT sign/verify, bcrypt
│   │   ├── api-helpers.ts            # successResponse, RBAC helpers
│   │   └── validation.ts             # sanitizeInput, validateEmail, validatePassword
│   ├── models/                       # User, Product, Order Mongoose schemas
│   ├── middleware.ts                 # Edge middleware for route protection
│   └── types/index.ts                # Shared TS interfaces
├── scripts/seed-admin.mjs            # Standalone seed (alternative; needs DB access)
├── .env.local                        # MONGODB_URI, JWT_SECRET, RAZORPAY_*
└── FEATURES.md                       # ← this file
```

---

## API Endpoints

### Public
| Method | Path                       | Description                |
| ------ | -------------------------- | -------------------------- |
| POST   | `/api/auth/register`       | Create user account        |
| POST   | `/api/auth/login`          | Log in (sets cookie)       |
| POST   | `/api/auth/logout`         | Clear cookie               |
| GET    | `/api/auth/me`             | Current user info          |
| GET    | `/api/products`            | List products (paginated)  |
| GET    | `/api/products/:id`        | Single product             |

### Authenticated User
| Method | Path                          | Description              |
| ------ | ----------------------------- | ------------------------ |
| POST   | `/api/orders`                 | Place an order           |
| GET    | `/api/orders`                 | Own orders               |
| GET    | `/api/orders/:id`             | Order detail             |
| POST   | `/api/payment/create-order`   | Razorpay order create    |
| POST   | `/api/payment/verify`         | Verify Razorpay signature|

### Admin / Technician
| Method | Path                  | Roles                  |
| ------ | --------------------- | ---------------------- |
| POST   | `/api/products`       | admin, technician      |
| PUT    | `/api/products/:id`   | admin, technician      |
| DELETE | `/api/products/:id`   | admin, technician      |
| GET    | `/api/analytics`      | admin, technician      |

### Admin only
| Method | Path                  | Description              |
| ------ | --------------------- | ------------------------ |
| GET    | `/api/users`          | List users (paginated, search/filter) |
| POST   | `/api/users`          | Create user with any role |
| GET    | `/api/users/:id`      | Single user              |
| PUT    | `/api/users/:id`      | Update name/email/password/role |
| DELETE | `/api/users/:id`      | Delete user              |
| POST   | `/api/admin/seed`     | Seed default admin (header `x-seed-key: <JWT_SECRET>`) |

---

## UI Pages

| Path                          | Audience              | Description                                    |
| ----------------------------- | --------------------- | ---------------------------------------------- |
| `/`                           | Public                | Landing page                                   |
| `/products`                   | Public                | Product listing with filters & pagination      |
| `/products/[id]`              | Public                | Product detail with add-to-cart                |
| `/login` `/register`          | Public                | Auth forms                                     |
| `/dashboard`                  | Any logged-in user    | Role-aware dashboard (User / Tech / Admin)     |
| `/checkout`                   | User                  | Cart + Razorpay payment                        |
| `/admin`                      | Admin / Technician    | Product management (CRUD)                      |
| `/admin/analytics`            | Admin / Technician    | Premium analytics dashboard with charts        |
| `/admin/users`                | Admin only            | User management with role editor               |
| `/admin/orders`               | Admin / Technician    | All orders, status updates                     |
| `/admin/products/new`         | Admin / Technician    | Add product form                               |
| `/admin/products/[id]/edit`   | Admin / Technician    | Edit product form                              |

The admin section uses a **fixed sidebar** (`src/app/admin/layout.tsx`) with collapsible mobile drawer, role-aware nav items, and gradient stat cards.

---

## Setup Instructions

```powershell
cd D:\SITE\project\masala-app
npm install
# Create .env.local with:
# MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/masala-app
# JWT_SECRET=<min 32 chars>
# RAZORPAY_KEY_ID=<test key>
# RAZORPAY_KEY_SECRET=<test secret>
# NEXT_PUBLIC_RAZORPAY_KEY_ID=<test key>
npm run dev
```

### Seeding the default admin

While the dev server is running:

```powershell
$secret = (Get-Content .env.local | Select-String "^JWT_SECRET=" |
  ForEach-Object { $_.ToString().Split('=',2)[1] })
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/seed" `
  -Method POST -Headers @{"x-seed-key"=$secret} | ConvertTo-Json
```

Then log in at `/login` with `admin@spicecraft.in` / `Admin@123456`.

---

## Security

- ✅ Passwords hashed with bcrypt (cost 12)
- ✅ JWT in `httpOnly` cookie (not accessible to JS)
- ✅ Edge middleware blocks unauthenticated access to protected routes
- ✅ API-level role checks (defense in depth)
- ✅ Input sanitization on all user-supplied fields
- ✅ Email & password format validation
- ✅ Mongoose schema validators
- ✅ Self-deletion / self-role-change prevention for admins
- ✅ Razorpay HMAC signature verification on payment callback
- ✅ All secrets in `.env.local` (never committed)

---

## What's Implemented vs. Pending

### ✅ Implemented
- Full auth flow (register, login, logout, JWT, RBAC)
- Default admin seeding via API
- Product CRUD with pagination
- Order creation + Razorpay payment + signature verification
- User management (CRUD with role editing)
- Analytics dashboard (revenue, orders, top products, alerts)
- Premium admin sidebar layout
- Role-based dashboards
- Input validation & sanitization

### 🚧 Possible future enhancements
- Image upload (currently URL-based) — integrate Cloudinary / S3
- Email verification on registration
- Password reset flow
- Admin order detail / refund flow
- Product reviews & ratings
- Wishlist
- Stripe as alternative to Razorpay
- Rate limiting (e.g., upstash/ratelimit)
- Audit log of admin actions
- Migrate `middleware.ts` → `proxy.ts` (Next.js 16 deprecation)

---

## Recent Changes (this session)

1. Added `POST /api/admin/seed` to create the default admin without manual DB access
2. Added `GET/POST /api/users` and `GET/PUT/DELETE /api/users/:id` (admin-only)
3. Added `GET /api/analytics` aggregating products, orders, users, revenue, top sellers, timelines
4. Created `src/app/admin/layout.tsx` with premium sidebar navigation
5. Created `/admin/users` page with searchable user table, role editor, create/edit modal
6. Created `/admin/analytics` page with stat cards, bar charts, breakdown lists
7. Upgraded `AdminDashboard` with revenue card and Users / Analytics quick-actions
8. Fixed Mongoose duplicate-index warning on `User.email`
9. Forced IPv4 in Mongoose connection (`family: 4`) to fix Atlas SSL issue on Windows
