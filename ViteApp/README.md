# 🌸 CycleSync

CycleSync is a beautiful, privacy-first, full-stack women’s health and cycle tracking application. It utilizes dynamic AI suggestions, automated email reminders via Node cronjobs, and a secure SQLite database sealed with JWT authentication.

## 🌟 Features
- **Smart Cycle Tracking**: Log daily menstrual flow, symptoms, moods, and energy levels. 
- **AI Health Insights**: Powered by Google Gemini 2.5 Flash, providing deeply personalized, context-aware suggestions directly based on a user's cycle logs and age.
- **Automated Email Reminders**: Built-in backend Node-Cron scheduler that evaluates user cycles hourly and dispatches HTML-branded reminders perfectly on time (e.g., 2 days before a period).
- **Secure Authentication**: Full JWT validation with cryptographically secure UUIDs and bcrypt-hashed passwords. Integrates an OTP-based email verification flow using Nodemailer.
- **Responsive UI**: A highly polished, mobile-first design system with cherry blossom aesthetics, glassmorphism, and clean micro-interactions.

## 🛠 Tech Stack
- **Frontend**: React, Vite, CSS-in-JS `style` objects.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite3 (`node-sqlite3`).
- **Authentication**: JWT (`jsonwebtoken`), Bcrypt, UUIDv4.
- **Email Service**: Nodemailer + Gmail SMTP.
- **AI Engine**: Google Generative AI (`@google/generative-ai`).

## 🚀 Running Locally

1. **Clone & Install Frontend:**
```bash
cd ViteApp
npm install
```

2. **Setup Backend & Database:**
```bash
cd server
npm install
```

3. **Configure Environment Variables:**
Create a `.env` file in the `server/` directory:
```
PORT=3000
GEMINI_API_KEY=your_google_api_key
SMTP_EMAIL=your_email_address
SMTP_APP_PASSWORD=your_google_app_password
JWT_SECRET=your_jwt_signing_secret
```

4. **Start the Systems:**
- Open terminal 1 and start the Express server (this also boots the SQLite DB and Cron scheduler):
```bash
cd ViteApp/server
node index.js
```
- Open terminal 2 and start the Vite frontend:
```bash
cd ViteApp
npm run dev
```

## 🌍 Production Deployment
- **Frontend** should be deployed to a static host like Vercel with a proxy pointing to the backend.
- **Backend API & Database** should be uploaded to a continuous web service like **Render** with a mapped Persistent Disk for `/data` so your SQLite file safely persists across server restarts!
