 ShopSphere - Full Stack E-Commerce Platform
A modern full-stack e-commerce platform built using React, Node.js, Express, MongoDB, and Cloudinary. ShopSphere provides a complete shopping experience for customers and a powerful admin dashboard for store management.

 Features:-
-> Customer Features
User Authentication & Authorization
Browse Products by Category and Brand
Product Search and Filtering
Product Variants (Size, Color, etc.)
Shopping Cart Management
Wishlist Support
Secure Checkout Flow
Order History Tracking
Profile Management

-> Admin Features
Admin Dashboard
Product Management
Category Management
Brand Management
Order Management
Inventory Tracking
Customer Overview
Revenue Statistics
Product Image Uploads via Cloudinary

-> Dashboard Analytics
Total Products
Total Orders
Total Customers
Total Revenue
Pending Orders Tracking

-> Integrations
Cloudinary Image Storage
JWT Authentication
REST API Architecture

-> Tech Stack
Frontend
React.js
React Router
Tailwind CSS
Context API
Axios
Backend
Node.js
Express.js
MongoDB
Mongoose
Authentication
JWT Authentication
Role Based Access Control
Media Management
Cloudinary

Deployment
Vercel (Frontend)
Render / Railway (Backend)
MongoDB Atlas


⚙️ Installation
Clone Repository
git clone https://github.com/sanjeev-kumar80/ShopSphere-E-Commerce-Platform.git

Frontend Setup
cd frontend
npm install
npm run dev

Backend Setup
cd backend
npm install
npm run dev

Environment Variables
From the backend directory, copy `.env.example` to `.env` and fill in the values required for your local setup. Keep `.env` private and do not commit it.

 env PORT=5000
MONGO_URI=your_mongodb_connection 

JWT_SECRET=your_secret_key 

CLOUDINARY_CLOUD_NAME=your_cloud_name 
CLOUDINARY_API_KEY=your_api_key 
CLOUDINARY_API_SECRET=your_api_secret

AI Shopping Assistant Setup
The backend AI gateway defaults to Ollama as the primary provider, followed by Gemini and Groq as fallbacks (`AI_PRIMARY_PROVIDER` and `AI_FALLBACK_ORDER` in `backend/.env.example`). Ollama defaults to `http://localhost:11434` and model `qwen2.5:3b`; start Ollama and make that model available locally.

To enable the cloud fallbacks, set `GEMINI_API_KEY` and `GROQ_API_KEY` in your private `backend/.env`. These credentials are optional when using Ollama alone. Provider models, endpoints, and timeouts can be overridden with the corresponding `GEMINI_*`, `GROQ_*`, and `OLLAMA_*` variables shown in `backend/.env.example` and the backend AI configuration. Never put real provider keys in source control.

 API Modules
Authentication API
Product API
Category API
Brand API
Cart API
Wishlist API
Order API
Upload API
Admin Dashboard API

👨‍💻 Author
Sanjeev Kumar

Bachelor of Technology

GLA University

GitHub: https://github.com/sanjeev-kumar80
