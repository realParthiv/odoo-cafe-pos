<p align="center">
  <h1 align="center">☕ Café POS System</h1>
  <p align="center">
    A modern, full-stack Point of Sale system built for cafés and restaurants — featuring real-time kitchen display, QR-based customer self-ordering, and Razorpay payment integration.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Razorpay-0C2451?style=for-the-badge&logo=razorpay&logoColor=white" alt="Razorpay" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔭 Overview

Café POS is an enterprise-grade Point of Sale system designed for cafés and restaurants. It provides a seamless workflow from order creation to kitchen preparation to payment — all connected in real-time via WebSockets.

**Three role-based dashboards** cater to different users:

| Role | Dashboard | Capabilities |
|------|-----------|-------------|
| **Admin/Owner** | Admin Panel | Staff management, floor/table setup, analytics, settings |
| **Cashier** | POS Terminal | Session management, order creation, payment processing |
| **Kitchen Staff** | Kitchen Display | Real-time order queue, item status updates, order completion |

Customers can also **self-order** by scanning a QR code on their table — browsing the menu and placing orders directly from their phone, with Razorpay payment integration.

---

## ✨ Features

### 🖥️ POS Terminal (Cashier)
- **Session management** — Open/close shifts with starting cash tracking
- **Floor plan view** — Visual table layout with drag & drop
- **Order builder** — Browse menu by category, add items with variants, set quantities
- **Payment processing** — Cash, UPI, Card, and Razorpay digital payments
- **UPI QR generation** — Dynamic QR codes for quick UPI payments
- **Order history** — View and manage past orders

### 🍳 Kitchen Display System (KDS)
- **Real-time order queue** — New orders appear instantly via WebSocket
- **Item-level status tracking** — Pending → Preparing → Ready
- **Bulk status updates** — Mark all items ready at once
- **Order completion** — Complete orders and free up tables automatically

### 📱 QR Self-Ordering (Customer)
- **Scan & order** — Customers scan a table QR code to view the menu
- **Mobile-optimized UI** — Responsive design for phones
- **Razorpay checkout** — Online payment directly from the phone
- **Auto-linked to session** — Orders automatically route to the active POS session

### 👑 Admin Dashboard
- **Staff management** — Invite staff via email, assign roles, deactivate accounts
- **Floor & table configuration** — Create floors, add tables, set capacity and shapes
- **Mobile ordering settings** — Enable/disable self-ordering, configure QR behavior
- **Analytics** — Sales history, cashier performance, dashboard stats (via Recharts)

### 🔐 Authentication & Security
- **JWT authentication** — Access + refresh tokens with auto-rotation
- **Role-based access control** — Admin, Cashier, Kitchen staff permissions
- **Staff invitation flow** — Email-based invite with secure token verification
- **Token blacklisting** — Secure logout with refresh token invalidation

---

## 🏗️ Architecture

```
┌──────────────────┐         ┌──────────────────────────────────────┐
│                  │         │           Django Backend             │
│  React Frontend  │◄──REST──┤  DRF API    │  Channels (WebSocket) │
│  (Vite + Tailwind)│        │             │                       │
│                  │◄──WS────┤  JWT Auth   │  Kitchen Consumer     │
└──────────────────┘         └──────┬──────┴───────────┬───────────┘
                                    │                  │
                              ┌─────▼─────┐     ┌─────▼─────┐
                              │   MySQL    │     │   Redis    │
                              │  Database  │     │  (Channel  │
                              │            │     │   Layer)   │
                              └────────────┘     └───────────┘
                                    │
                              ┌─────▼─────┐
                              │  Razorpay  │
                              │    API     │
                              └───────────┘
```

**Key data flow:**

1. **Cashier** opens a session → creates orders → sends to kitchen
2. **Kitchen staff** sees orders in real-time via WebSocket → updates item status
3. **Order completion** frees up the table automatically
4. **Customers** can also self-order via QR → order flows into the same pipeline

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Django 5.x** | Web framework |
| **Django REST Framework** | RESTful API |
| **SimpleJWT** | JWT token authentication |
| **Django Channels** | WebSocket support (real-time kitchen updates) |
| **Daphne** | ASGI server |
| **MySQL** | Primary database |
| **Redis** | Channel layer backend (WebSocket message routing) |
| **Razorpay SDK** | Payment gateway integration |
| **python-decouple** | Environment variable management |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI library |
| **Vite 7** | Build tool & dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **React Router 7** | Client-side routing |
| **Axios** | HTTP client |
| **Recharts** | Data visualization (analytics) |
| **Lucide React** | Icon library |

---

## 📂 Project Structure

```
odoo-cafe-pos/
├── backend/
│   ├── apps/
│   │   ├── accounts/        # User model, auth views, staff invitations
│   │   ├── cafe_settings/   # Cafe configuration, branding
│   │   ├── core/            # Shared utilities, custom responses, exceptions
│   │   ├── kitchen/         # Kitchen display views, WebSocket consumer & routing
│   │   ├── menu/            # Categories, products, variants
│   │   ├── orders/          # Order CRUD, order lines, QR ordering, dashboard
│   │   ├── payments/        # Payment methods, Razorpay integration, receipts
│   │   ├── sessions/        # POS session management (cashier shifts)
│   │   └── tables/          # Floor & table management, QR codes
│   ├── backend/             # Django project settings, URLs, ASGI/WSGI
│   ├── .env                 # Environment variables (not tracked)
│   ├── .env.example         # Environment variable template
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Cashier/     # POS UI components (18 components)
│   │   ├── context/         # AuthContext (global auth state)
│   │   ├── Navigation/      # Role-based routing
│   │   ├── pages/
│   │   │   ├── Admin/       # Admin dashboard, staff & floor management
│   │   │   ├── Auth/        # Login, register, set-password pages
│   │   │   ├── Cashier/     # Cashier POS terminal
│   │   │   ├── Customer/    # QR self-ordering page
│   │   │   └── Kitchen/     # Kitchen display system
│   │   ├── services/        # API client, endpoints, service layer
│   │   ├── styles/          # Global CSS
│   │   └── theme/           # Theme configuration
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **MySQL** 8.0+
- **Redis** (for WebSocket channel layer)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/odoo-cafe-pos.git
cd odoo-cafe-pos
```

### 2. Backend Setup

```bash
# Create virtual environment
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials (DB password, Razorpay keys, email config, etc.)

# Create database
mysql -u root -p -e "CREATE DATABASE cafe_pos_db;"

# Run migrations
python manage.py migrate

# Create superuser (Admin)
python manage.py createsuperuser

# Start the development server (ASGI for WebSocket support)
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API endpoint (optional — defaults to http://localhost:8000)
# Create a .env file with:
# VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
```

### 4. Start Redis (for WebSocket)

```bash
# Start Redis server (required for kitchen real-time updates)
redis-server
```

The app will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Admin Panel:** http://localhost:8000/admin

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory using `.env.example` as a template:

| Variable | Description | Required |
|----------|-------------|----------|
| `DJANGO_SECRET_KEY` | Django secret key for cryptographic signing | ✅ |
| `DJANGO_DEBUG` | Enable debug mode (`True`/`False`) | ❌ (default: `True`) |
| `DB_ENGINE` | Database engine | ❌ (default: `mysql`) |
| `DB_NAME` | Database name | ❌ (default: `cafe_pos_db`) |
| `DB_USER` | Database username | ❌ (default: `root`) |
| `DB_PASSWORD` | Database password | ✅ |
| `DB_HOST` | Database host | ❌ (default: `127.0.0.1`) |
| `DB_PORT` | Database port | ❌ (default: `3306`) |
| `EMAIL_HOST_USER` | Gmail address for sending invitations | ✅ |
| `EMAIL_HOST_PASSWORD` | Gmail app password | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | ✅ (for payments) |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret | ✅ (for payments) |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret | ❌ |
| `FRONTEND_URL` | Frontend URL for email links | ❌ (default: `http://localhost:5173`) |

**Frontend** (optional `.env` in `frontend/` directory):

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API URL | ❌ (default: `http://localhost:8000`) |

---

## 📡 API Endpoints

### Authentication (`/api/auth/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register/` | Register admin/owner | Public |
| POST | `/api/auth/login/` | Login and get JWT tokens | Public |
| POST | `/api/auth/logout/` | Logout (blacklist token) | 🔒 |
| POST | `/api/auth/token/refresh/` | Refresh access token | Public |
| GET/PATCH | `/api/auth/profile/` | Get/update profile | 🔒 |
| POST | `/api/auth/change-password/` | Change password | 🔒 |
| GET | `/api/auth/users/` | List all users | 🔒 Admin |
| POST | `/api/auth/staff/invite/` | Invite staff via email | 🔒 Admin |

### Sessions (`/api/sessions/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/sessions/current/` | Get current open session | 🔒 |
| POST | `/api/sessions/open/` | Open new POS session | 🔒 |
| POST | `/api/sessions/{id}/close/` | Close session | 🔒 |

### Menu (`/api/menu/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/menu/products/` | List products | 🔒 |
| POST | `/api/menu/products/` | Create product | 🔒 |
| GET | `/api/menu/categories/` | List categories | 🔒 |
| POST | `/api/menu/categories/` | Create category | 🔒 |

### Tables (`/api/tables/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tables/floors/` | List floors | 🔒 |
| POST | `/api/tables/floors/` | Create floor | 🔒 |
| GET | `/api/tables/tables/` | List tables | 🔒 |
| POST | `/api/tables/tables/` | Create table | 🔒 |
| GET | `/api/tables/tables/{id}/qrcode/` | Get QR code image | 🔒 |

### Orders (`/api/orders/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET/POST | `/api/orders/` | List/create orders | 🔒 |
| POST | `/api/orders/{id}/lines/` | Add item to order | 🔒 |
| POST | `/api/orders/{id}/send-to-kitchen/` | Send order to kitchen | 🔒 |
| POST | `/api/orders/{id}/close/` | Close order, free table | 🔒 |
| POST | `/api/orders/{id}/payments/` | Process payment | 🔒 |
| GET | `/api/orders/qr/info/` | Validate QR table token | Public |
| POST | `/api/orders/qr/` | Place order via QR | Public |

### Kitchen (`/api/kitchen/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/kitchen/orders/` | List kitchen orders | 🔒 Kitchen |
| PATCH | `/api/kitchen/orders/{id}/update-status/` | Update item status | 🔒 Kitchen |
| POST | `/api/kitchen/orders/{id}/complete/` | Complete order | 🔒 Kitchen |

### Payments (`/api/payments/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments/create-razorpay-order/` | Create Razorpay order | Public |
| POST | `/api/payments/verify/` | Verify Razorpay payment | Public |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `ws://host/ws/kitchen/orders/` | Real-time kitchen order updates |

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ for the modern café experience
</p>
