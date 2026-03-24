# 🌸 CycleSync

CycleSync is a beautiful, privacy-first, full-stack women’s health and cycle tracking application. It utilizes dynamic AI suggestions, automated email reminders via Node cronjobs, and a secure PostgreSQL database sealed with JWT authentication.

## 🌟 Features
- **Smart Cycle Tracking**: Log daily menstrual flow, symptoms, moods, and energy levels. 
- **AI Health Insights**: Powered by Google Gemini 2.5 Flash, providing deeply personalized, context-aware suggestions directly based on a user's cycle logs and age.
- **Automated Email Reminders**: Built-in backend Node-Cron scheduler that evaluates user cycles hourly and dispatches HTML-branded reminders perfectly on time.
- **Secure Authentication**: Full JWT validation with cryptographically secure UUIDs and bcrypt-hashed passwords. Integrates an OTP-based email verification flow.
- **Responsive UI**: A highly polished, mobile-first design system with cherry blossom aesthetics, glassmorphism, and clean micro-interactions.

## 🛠 Tech Stack
- **Frontend**: React, Vite, CSS-in-JS `style` objects.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (Neon Cloud DB), `pg` connector.
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
Create a `.env` file in the `server/` directory. You will need a Neon Database connection string:
```
PORT=3000
GEMINI_API_KEY=your_google_api_key
SMTP_EMAIL=your_email_address
SMTP_APP_PASSWORD=your_google_app_password
JWT_SECRET=your_jwt_signing_secret
DATABASE_URL=postgresql://your_neon_db_url_here?sslmode=require
```

4. **Start the Systems:**
- Start the Express server:
```bash
cd ViteApp/server
node index.js
```
- Start the Vite frontend:
```bash
cd ViteApp
npm run dev
```

## 🌍 Production Deployment
- **Frontend**: Deploy perfectly as a static site to **Vercel** or **Netlify**. Ensure you set `VITE_API_URL` to your backend URL.
- **Backend API**: Host your `server/` folder on **Render.com**. Add all environment variables (especially `DATABASE_URL`). 
- **Cron Jobs**: To prevent Render's Free Tier from putting your API to sleep (which pauses the email scheduler), create a free cron task on **cron-job.org** that pings your Render API (`GET /`) every 14 minutes!
