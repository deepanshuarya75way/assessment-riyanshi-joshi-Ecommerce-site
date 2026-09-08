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
MONGO_URI=<your-mongodb-connection-string>
CLIENT_URL=http://localhost:5173
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
