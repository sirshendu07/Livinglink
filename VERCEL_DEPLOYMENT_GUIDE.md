# LivingLink — Frontend Deployment Guide for Vercel

This guide provides exact step-by-step instructions for deploying the **LivingLink Frontend** to [Vercel](https://vercel.com/) with SPA routing, environment variables, and backend connectivity.

---

## 1. Quick Setup on Vercel

1. Log into your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository:
   `https://github.com/sirshendu07/Livinglink.git`
4. In the **Configure Project** screen, configure the following fields:

| Field | Setting / Value | Explanation |
| :--- | :--- | :--- |
| **Framework Preset** | `Vite` | Vercel will auto-detect Vite |
| **Root Directory** | `frontend` | **Important**: Click **Edit** and choose `frontend` |
| **Build Command** | `npm run build` | Default Vite production build command |
| **Output Directory** | `dist` | Directory where Vite writes built static assets |
| **Install Command** | `npm install` | Installs frontend dependencies |

---

## 2. Environment Variables in Vercel

Under the **Environment Variables** section on Vercel, add the following two variables:

```env
VITE_API_BASE_URL=https://livinglink-qo95.onrender.com/api/v1
VITE_SOCKET_URL=https://livinglink-qo95.onrender.com
```

> [!TIP]
> Your live backend URL `https://livinglink-qo95.onrender.com` is already configured above! Just copy and paste these two variables into Vercel.

---

## 3. Client-Side SPA Routing (`vercel.json`)

To prevent `404 Not Found` errors when directly navigating or refreshing routes like `/owner/amenities`, `/admin/dashboard`, or `/security/approvals`, the repository includes `frontend/vercel.json` configured with:

```json
{
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Vercel automatically picks this up during deployment.

---

## 4. Backend CORS & Cookie Configuration

Because LivingLink uses secure HttpOnly cookies for silent refresh token rotation, you must whitelist your Vercel URL in your backend environment variables:

In your **Backend Web Service** (e.g. on Render), update the `CLIENT_URL` environment variable:

```env
CLIENT_URL=https://your-project-name.vercel.app
```

*(If you attach a custom domain like `https://livinglink.yourdomain.com`, update `CLIENT_URL` accordingly).*

---

## 5. Verification Checklist

- [ ] Vercel build completes with status `Ready` (typically ~30 seconds).
- [ ] Direct navigation to `/login` loads the dark residential OS interface.
- [ ] Admin login (`sirshendu1037@gmail.com` / `S@nju12345`) successfully redirects to `/admin`.
- [ ] Security portal (`/security`) and Owner portal (`/owner`) render smoothly with live Socket.IO connection.
