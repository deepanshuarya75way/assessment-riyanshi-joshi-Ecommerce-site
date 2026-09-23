# Ecommerce-Site

A full-stack MERN e-commerce application.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Axios, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose

## Project Structure

```
Ecommerce-Site/
├── client/                 # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/         # Local images/assets
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Future global state/context
│   │   ├── hooks/          # Custom React hooks
│   │   ├── layouts/        # Application layouts
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # API communication (Axios)
│   │   ├── utils/          # Reusable utility functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   └── vite.config.js
│
├── server/                 # Node.js + Express backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers (added in later phases)
│   ├── middleware/         # Centralized error handling
│   ├── models/             # Mongoose models (added in later phases)
│   ├── routes/             # API routes
│   ├── utils/
│   ├── .env.example
│   └── server.js
│
└── README.md
```

## Prerequisites

- Node.js (v20 or later)
- npm
- A MongoDB connection string (local or MongoDB Atlas)

## Installation

### 1. Install backend dependencies

```bash
cd server
npm install
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

## Configuration

### Backend (`server/.env`)

Copy the example file and fill in your values:

```bash
cp server/.env.example server/.env
```

```
PORT=5000
NODE_ENV=development
MONGO_URI=<your-mongodb-connection-string>
CLIENT_URL=http://localhost:5173
JWT_SECRET=<development-only-secret>
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=<development-stripe-secret>
STRIPE_WEBHOOK_SECRET=<development-webhook-secret>
```

> The server starts even if `MONGO_URI` is empty, but database features will
> not work until you add a valid connection string. Never commit real
> credentials — `.env` files are git-ignored.

### Frontend (`client/.env`)

Copy the example file:

```bash
cp client/.env.example client/.env
```

```
VITE_API_URL=http://localhost:5000/api
```

## Running the App

### Start the backend

```bash
cd server
npm run dev
```

The API runs at `http://localhost:5000`.

### Start the frontend

```bash
cd client
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Health Check

Verify the API is running:

```
GET http://localhost:5000/api/health
```

Response:

```json
{
  "success": true,
  "message": "Ecommerce-Site API is running"
}
```

The Home page also displays a live "Backend Status" indicator based on this endpoint.

## Development Demo Seed

The existing `server/scripts/seedCatalog.js` is a safe, repeatable demo seed. It
upserts fictional categories, products, a demo admin, a demo customer, a paid
sample order, and review-eligible demo reviews. It does not delete collections
or modify production data.

Run it only against a development database. The command refuses production mode
and requires an explicit confirmation token plus credentials supplied through
environment variables:

```bash
cd server
SEED_CONFIRM=SEED_DEMO_DATA \
SEED_ADMIN_EMAIL=admin@your-demo.invalid \
SEED_ADMIN_PASSWORD=<choose-a-development-password> \
SEED_CUSTOMER_EMAIL=customer@your-demo.invalid \
SEED_CUSTOMER_PASSWORD=<choose-a-development-password> \
npm run seed:demo
```

On PowerShell, set the same variables with `$env:NAME='value'` before running
`npm run seed:demo`. Never reuse production credentials or a production
`MONGO_URI` for this operation.
