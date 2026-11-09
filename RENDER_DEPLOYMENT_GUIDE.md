# LivingLink — Render Deployment & Environment Variable Guide

This guide walks you through deploying both the **LivingLink Backend** (Web Service) and **LivingLink Frontend** (Static Site) on **Render**, connected to your GitHub repository:
`https://github.com/sirshendu07/Livinglink.git`

---

## 1. Backend Web Service on Render

Your live backend service is deployed at:
👉 **`https://livinglink-qo95.onrender.com`**

Health check endpoint:
👉 **`https://livinglink-qo95.onrender.com/api/v1/health`**

---

### Step 1.2: Backend Environment Variables
In the **Environment Variables** section on Render, add the following key-value pairs:

```env
NODE_ENV=production
PORT=5000

# Client Application URL (Set this to your frontend Render URL after creating frontend)
CLIENT_URL=https://livinglink-frontend.onrender.com

# MongoDB Atlas
MONGODB_URI=mongodb+srv://SANJU386:S%40nju12345@sanju.kdjrh0n.mongodb.net/livinglink?retryWrites=true&w=majority

# Upstash Redis (TLS enabled)
REDIS_URL=rediss://default:gQAAAAAAAuRbAAIgcDJmMjEzZGVhYmEwMzc0NjViODNhMTliMzZmMGI2M2Y2MA@vast-deer-189531.upstash.io:6379

# JWT Secrets (Cryptographically Secure)
JWT_ACCESS_SECRET=livinglink_access_super_secret_jwt_key_2026_prod!
JWT_REFRESH_SECRET=livinglink_refresh_super_secret_jwt_key_2026_prod!
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Gmail SMTP Email Dispatch (OTP & Alerts)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=sirshendu1037@gmail.com
EMAIL_APP_PASSWORD=ozfiwodcmntlihez
EMAIL_FROM="LivingLink Society" <sirshendu1037@gmail.com>

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=sanju
CLOUDINARY_API_KEY=919794741585527
CLOUDINARY_API_SECRET=fo2duuv_JzsNA8zU3f_C52dBvOs

# Demo Payment Gateway
DEMO_PAYMENTS_ENABLED=true
PAYMENT_DEMO_SECRET=LivingLinkDemoPay2026!

# Digital Amenity Access HMAC Secret
AMENITY_CARD_HMAC_SECRET=LivingLinkAmenityPassHMACSecret2026Key!

# Initial Admin Seeding Credentials (Auto-bootstrapped on startup)
INITIAL_ADMIN_EMAIL=sirshendu1037@gmail.com
INITIAL_ADMIN_PASSWORD=S@nju12345
INITIAL_ADMIN_PHONE=9735228423
INITIAL_ADMIN_NAME=Sirshendu Admin
```

---

## 2. Deploying the Frontend (Render Static Site)

### Step 2.1: Create Static Site
1. In your Render Dashboard, click **New +** &rarr; **Static Site**.
2. Connect the same repository: `sirshendu07/Livinglink`.
3. Configure the static site settings:

| Field | Value | Notes |
| :--- | :--- | :--- |
| **Name** | `livinglink-frontend` | Or any unique name |
| **Branch** | `main` | Production branch |
| **Root Directory** | `frontend` | **Important**: points to frontend app |
| **Build Command** | `npm install && npm run build` | Compiles Vite production bundle |
| **Publish Directory** | `dist` | Directory containing built static assets |

---

### Step 2.2: Frontend Environment Variables
In the **Environment Variables** section of your Static Site, add:

```env
VITE_API_BASE_URL=https://livinglink-backend.onrender.com/api/v1
VITE_SOCKET_URL=https://livinglink-backend.onrender.com
```
*(Replace `https://livinglink-backend.onrender.com` with your real backend service URL)*

---

### Step 2.3: Single-Page Application (SPA) Routing Rewrite
Because React Router uses client-side routing (`/owner`, `/admin`, `/security`, `/login`), configure a redirect rule on Render:
1. Go to your frontend service's **Redirects / Rewrites** tab in Render.
2. Click **Add Rule**:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `200`
3. Click **Save Changes**.

---

## 3. Pre-Configured System Credentials

| Role | Email | Password | Phone | Portal Access |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `sirshendu1037@gmail.com` | `S@nju12345` | `9735228423` | `/admin` |
| **SECURITY** | Pre-seeded / Create in `/admin/staff` | Minimum 8 chars | Any | `/security` |
| **OWNER** | Register via `/register` | Minimum 8 chars | Valid 10-digit | `/owner` (Requires OTP + Admin approval) |

---

## 4. Verification & Health Checks

1. **Backend Health Check**:
   Visit `https://livinglink-backend.onrender.com/api/v1/health` in your browser.
   Expected response:
   ```json
   {
     "status": "UP",
     "timestamp": "...",
     "services": {
       "database": "UP",
       "redis": "UP"
     }
   }
   ```

2. **Frontend Loading**:
   Open your frontend URL: `https://livinglink-frontend.onrender.com`.
   The dark residential OS will load, silently authenticating your credentials.
