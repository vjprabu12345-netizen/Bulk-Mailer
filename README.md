# Bulk Mailer

A full-stack bulk email app: React (Vite) frontend, Express + MongoDB
backend, and Nodemailer for delivery. Admin logs in, composes one email for
a list of recipients, sends it, and can review send history afterward.

## Run the backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: MongoDB URI, admin login, and SMTP credentials
npm start
```
Runs on `http://localhost:5000`.

**SMTP note:** for real sending, a Gmail account needs an
[app password](https://myaccount.google.com/apppasswords) (not your normal
password) in `SMTP_PASS`. For safe testing without emailing real inboxes,
point `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` at a free
[Mailtrap](https://mailtrap.io) sandbox inbox instead.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`. `/api/*` calls are proxied to the backend
(see `vite.config.js`), so nothing needs a hardcoded host.

## Deploy on Vercel

Deploy this repository as two Vercel projects:

1. Create a backend project with the project root set to `backend`. Add the
  `MONGO_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`, `SMTP_HOST`,
  `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` environment variables
  in Vercel. Use a hosted MongoDB URI; `127.0.0.1` will not work after deploy.
  The API is available under `/api/*` on the backend deployment URL.
2. Create a frontend project with the project root set to `frontend`. Set
  `VITE_API_URL` to the backend deployment URL ending in `/api`, for example
  `https://your-backend.vercel.app/api`, then deploy.

The frontend uses the Vite proxy locally and `VITE_API_URL` on Vercel. Keep
MongoDB and SMTP credentials in the backend project's environment variables;
do not add them to the frontend.

## Admin login

Whatever you set in the backend's `.env`:
```
ADMIN_EMAIL=admin@bulkmail.com
ADMIN_PASSWORD=Admin@123
```

## Structure

```
backend/
  server.js                    # Express app, health check, error handler
  config/db.js                  # Mongoose connection
  models/Email.js               # subject, body, recipients, status, timestamps
  controllers/
    authController.js           # static admin login, issues a JWT
    mailController.js           # sends via nodemailer, logs to Mongo, history
  routes/
    authRoutes.js
    mailRoutes.js                # protected by requireAuth
  middleware/auth.js             # verifies the JWT bearer token
  .env.example

frontend/
  vite.config.js                 # proxies /api to the backend in dev
  src/
    main.jsx, App.jsx             # routes + a simple auth guard
    index.css
    api/client.js                 # axios instance, attaches the JWT, handles 401
    pages/
      Login.jsx / Login.css
      ComposeMail.jsx / ComposeMail.css
      History.jsx / History.css
    components/
      Navbar.jsx / Navbar.css
      RecipientInput.jsx / RecipientInput.css   # chip-style multi-email input
      StatusBanner.jsx / StatusBanner.css
```

## How it works

1. **Login** — the frontend posts email/password to `/api/auth/login`; the
   backend checks them against `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env`
   (no user collection — matches the assignment's "no database needed" scope
   for auth) and returns a JWT, stored in `localStorage`.
2. **Compose** — `RecipientInput` lets you type an email and press Enter (or
   comma) to add it as a chip; each one is validated with a regex before
   it's accepted. Subject, body, and at least one recipient are all
   required before submit fires.
3. **Send** — the frontend POSTs `{ subject, body, recipients }` to
   `/api/mail/send` with the JWT attached automatically (via the axios
   interceptor in `api/client.js`). The backend emails each recipient
   individually with Nodemailer (so one bad address doesn't block the rest),
   tracks who failed, and saves an `Email` document with the resulting
   status: `sent`, `partial`, or `failed`.
4. **History** — `/api/mail/history` returns the last 50 `Email` documents,
   newest first; the History page renders each with a status badge and,
   for partial sends, the list of addresses that failed.
5. Any route under `/api/mail` requires the JWT (`middleware/auth.js`); an
   expired or missing token bounces the frontend back to `/login`.

## Notes on styling

This project intentionally looks different from other demo apps in the same
series: a light "paper" background instead of a dark theme, Sora for
headings paired with Inter for body text, and an emerald accent
(`#146c53`). The recipient chip-input is a from-scratch component, not a
restyled text field.
