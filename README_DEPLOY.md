# MediSense Deployment Guide (Vercel)

To deploy this application to Vercel, follow these steps:

### 1. Project Configuration
Ensure your `vercel.json` is present in the root directory (already added). This file handles:
- Routing `/api/*` requests to the Express backend.
- Serving the Vite frontend for all other routes.

### 2. Environment Variables
If you are using the Gemini AI features, you must add your `GEMINI_API_KEY` to the Vercel project settings:
1. Go to your Project Dashboard on Vercel.
2. Navigate to **Settings** > **Environment Variables**.
3. Add `GEMINI_API_KEY` with your actual key.

### 3. Troubleshooting Warnings
The `npm warn deprecated` messages you saw are **non-blocking warnings**. They are common in modern web development and do not indicate a failed build.
- I have removed `better-sqlite3` from the project as it was an unused native dependency causing the `prebuild-install` warning.
- The other warnings (glob, domexception) are sub-dependencies of standard libraries and can be safely ignored.

### 4. Build Command
Vercel should automatically detect the settings, but if prompted:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
