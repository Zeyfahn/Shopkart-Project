# ShopKart

A full-stack e-commerce project built with React, Vite, Express, MongoDB, and Razorpay Test Mode. It includes account registration and login, product browsing and filtering, wishlists, a cart, checkout, payment verification, and order history.

## Features

- Register, log in, and log out. Authentication uses a JWT stored in an HttpOnly cookie.
- Browse products, search by name, filter by category, and view product details.
- Save products to a wishlist and add products to a stock-checked cart.
- Check out with a shipping address and Razorpay Test Mode.
- Verify payment signatures on the server and view placed orders.
- Seed the database with sample products.

## Requirements

- Node.js 18.11 or newer and npm
- MongoDB running locally or a MongoDB Atlas connection string
- Razorpay Test Mode API keys to try checkout; browsing and other features can be used without payment keys

## Run locally

### 1. Configure and start the backend

In a terminal, from the project folder:

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env`, then set the values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopkart
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_secret
```

Use your own Razorpay **Test Mode** keys for the two Razorpay values. Keep the secret key in the backend environment only. For a MongoDB Atlas database, replace `MONGO_URI` with your Atlas connection string.

Seed sample products and start the API:

```bash
npm run seed
npm run dev
```

The API starts at `http://localhost:5000`. Its health endpoint is `http://localhost:5000/health`.

### 2. Configure and start the frontend

Open a second terminal in the project folder:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env`. The local default is:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local address Vite prints, typically `http://localhost:5173`.

## Payment testing

Checkout uses Razorpay Test Mode. Add your Test Mode key ID and secret to `backend/.env`, restart the backend, and use Razorpay's current test card or UPI details in the checkout popup. Never use production payment keys for this project demo.

The server calculates the payable amount from the current cart and product data. After checkout, it verifies Razorpay's payment signature before marking an order as paid and clearing the cart.

## API overview

The backend runs on port `5000` by default.

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| `POST` | `/customers/register` | Create an account | No |
| `POST` | `/customers/login` | Log in and set the authentication cookie | No |
| `GET` | `/customers/me` | Get the current account | Yes |
| `POST` | `/customers/logout` | Log out | Yes |
| `GET` | `/products?search=&category=` | List, search, and filter products | No |
| `GET` | `/products/:id` | Get product details | No |
| `POST` | `/products` | Create a product | No |
| `GET`, `POST`, `DELETE` | `/wishlist` and `/wishlist/:productId` | Read, add, and remove wishlist items | Yes |
| `GET`, `POST`, `PATCH`, `DELETE` | `/cart` and `/cart/:productId` | Read and update cart items | Yes |
| `POST` | `/orders/create-payment-order` | Create a pending order and Razorpay order | Yes |
| `POST` | `/orders/verify-payment` | Verify payment and place the order | Yes |
| `GET` | `/orders` and `/orders/:id` | List the current account's orders | Yes |

## Project structure

```text
ShopKart/
├── backend/        # Express API, MongoDB models, routes, and seed script
├── frontend/       # React application built with Vite
└── README.md
```

Each application has its own `package.json`, lockfile, and `.env.example` file.

## Deployment

The frontend and API require separate hosting because GitHub Pages serves static files and cannot run the Express server or MongoDB database.

- **Database:** Create a MongoDB Atlas database and use its URI as `MONGO_URI` on the backend host.
- **Backend:** Deploy the `backend` directory to a Node.js host such as Render. Use `npm install` to build dependencies and `npm start` to start the server. Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (the deployed frontend origin, with no trailing slash), `NODE_ENV=production`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` as environment variables. Keep the Razorpay secret server-side.
- **Frontend:** Deploy the `frontend` directory to Vercel as a Vite app. Set `VITE_API_URL` to the deployed backend URL, without a trailing slash, then redeploy.
- After deployment, confirm the backend `/health` endpoint responds and that the frontend can reach the API. The backend's `CLIENT_URL` must match the deployed frontend origin for cookie-based login to work.

The project repository's GitHub Pages address contains project documentation; it is not the deployed, interactive storefront. Add the frontend hosting URL to the submission only after it has been deployed and opened successfully.

## Known limitations

- Product stock is checked during cart and checkout flows, but stock is not decremented after a successful order.
- Razorpay integration is intended for Test Mode; live payment readiness has not been established.
- MongoDB Atlas and a live payment flow must be configured separately before demonstrating a hosted full-stack version.

## Security notes

- Never commit `.env` files, database credentials, JWT secrets, or payment secrets.
- Use `.env.example` as a template and enter real values only in local environment files or your hosting provider's environment settings.
- The Razorpay secret belongs only on the backend.
