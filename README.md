# 🌿 SpiceCraft — Authentic Indian Masala Brand

A production-ready full-stack web application for an Indian traditional masala brand built with Next.js, MongoDB, Tailwind CSS, JWT auth, and Razorpay payments.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS 4
- **Backend**: Next.js API Routes (RESTful)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (via `jose`) + bcrypt password hashing
- **Payments**: Razorpay integration
- **Language**: TypeScript

## Features

### Authentication & Authorization (RBAC)
- JWT-based cookie authentication
- Three roles: **Admin**, **Technician**, **User**
- Route-level protection via Edge Middleware
- API-level role-based access control

| Role       | Permissions                              |
|------------|------------------------------------------|
| Admin      | Full access (CRUD products, manage orders) |
| Technician | Add/edit products                        |
| User       | Browse products, place orders            |

### Product Management
- Full CRUD operations for masalas/spices
- Categories: Whole Spices, Ground Spices, Blended Masala, Herbs, Seasoning, Organic, Premium, Combo Packs
- Paginated product listing with search and category filters
- Text search on product names and descriptions

### Order Management
- Order creation with stock validation
- Order status tracking (pending → confirmed → shipped → delivered)
- Admin order management dashboard

### Payment Integration
- Razorpay payment gateway
- Secure server-side order creation
- HMAC-SHA256 signature verification
- Payment status tracking

### Security
- Input sanitization (XSS prevention)
- Password validation (min 8 chars, uppercase, lowercase, number)
- HttpOnly secure cookies
- CSRF-safe API design
- Environment variable configuration

## Getting Started

### Prerequisites

- **Node.js** 18+ 
- **MongoDB** running locally or a MongoDB Atlas connection string
- **Razorpay** account (for payment integration)

### 1. Install Dependencies

```bash
cd masala-app
npm install
```

### 2. Configure Environment Variables

Edit `.env.local` in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/masala-app
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

> ⚠️ **Important**: Change `JWT_SECRET` to a strong random string in production. Get Razorpay keys from https://dashboard.razorpay.com

### 3. Start MongoDB

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in MONGODB_URI
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create Admin User

Register a new user at `/register`, then update their role directly in MongoDB:

```javascript
// In MongoDB shell
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

### 6. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, register)
│   ├── admin/                    # Admin panel pages
│   │   ├── orders/               # Order management
│   │   └── products/             # Product CRUD
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Auth endpoints
│   │   ├── orders/               # Order endpoints
│   │   ├── payment/              # Razorpay endpoints
│   │   └── products/             # Product endpoints
│   ├── checkout/                 # Checkout page
│   ├── dashboard/                # Role-based dashboard
│   ├── products/                 # Product listing & detail
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # Reusable components
│   ├── admin/                    # Admin components
│   ├── dashboard/                # Dashboard components
│   ├── forms/                    # Form components
│   ├── layout/                   # Layout (Navbar, Footer)
│   ├── products/                 # Product components
│   └── ui/                       # UI primitives
├── context/                      # React contexts
│   └── AuthContext.tsx            # Auth state management
├── lib/                          # Utilities
│   ├── api-helpers.ts            # API response helpers
│   ├── auth.ts                   # JWT & bcrypt utilities
│   ├── mongodb.ts                # Database connection
│   └── validation.ts             # Input validation
├── middleware.ts                  # Edge middleware (route protection)
├── models/                       # Mongoose models
│   ├── Order.ts
│   ├── Product.ts
│   └── User.ts
└── types/                        # TypeScript types
    └── index.ts
```

## API Endpoints

### Authentication
| Method | Endpoint             | Description          | Auth Required |
|--------|----------------------|----------------------|---------------|
| POST   | `/api/auth/register` | Register new user    | No            |
| POST   | `/api/auth/login`    | Login                | No            |
| POST   | `/api/auth/logout`   | Logout               | No            |
| GET    | `/api/auth/me`       | Get current user     | Yes           |

### Products
| Method | Endpoint              | Description          | Auth Required          |
|--------|-----------------------|----------------------|------------------------|
| GET    | `/api/products`       | List products        | No                     |
| POST   | `/api/products`       | Create product       | Admin/Technician       |
| GET    | `/api/products/:id`   | Get product          | No                     |
| PUT    | `/api/products/:id`   | Update product       | Admin/Technician       |
| DELETE | `/api/products/:id`   | Delete product       | Admin                  |

### Orders
| Method | Endpoint           | Description          | Auth Required |
|--------|--------------------|----------------------|---------------|
| GET    | `/api/orders`      | List orders          | Yes           |
| POST   | `/api/orders`      | Create order         | Yes           |
| GET    | `/api/orders/:id`  | Get order            | Yes           |
| PUT    | `/api/orders/:id`  | Update order status  | Admin         |

### Payments
| Method | Endpoint                    | Description           | Auth Required |
|--------|-----------------------------|-----------------------|---------------|
| POST   | `/api/payment/create-order` | Create Razorpay order | Yes           |
| POST   | `/api/payment/verify`       | Verify payment        | Yes           |

## Deployment

### Vercel (Recommended)
```bash
npx vercel
```

Set environment variables in Vercel dashboard.

### Docker / Self-hosted
Ensure MongoDB is accessible and all environment variables are set. Build and run:
```bash
npm run build
npm start
```
