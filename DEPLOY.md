# DEPLOYMENT GUIDE: EARTH 616 JUKEBOX

Earth 616 is a zero-backend, client-side static web application built with Vite, React, TypeScript, and Three.js. It can be deployed in under 2 minutes to **Vercel**, **Netlify**, or **GitHub Pages**.

---

## 1. Deploying to Vercel (Recommended)

### Option A: Via GitHub (Fastest, Auto-Deploy on Push)
1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Sign in with your GitHub account (`architajain902-hope`).
3. Select your repository: **`Earth-Jukebox`**.
4. Configure Project settings (Vercel automatically detects Vite):
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Click **Deploy**.
6. Your live URL will be ready in ~30 seconds (e.g. `https://earth-jukebox.vercel.app`).
7. Paste this live link into your Space Apps submission portal!

### Option B: Via Vercel CLI
```powershell
npm install -g vercel
vercel login
vercel --prod
```

---

## 2. Deploying to Netlify

### Option A: Via Git
1. Go to [https://app.netlify.com/start](https://app.netlify.com/start).
2. Connect your GitHub repository: `architajain902-hope/Earth-Jukebox`.
3. Set build configuration:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Click **Deploy Site**.

### Option B: Via Netlify CLI
```powershell
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist
```

---

## 3. Deploying to GitHub Pages

1. In `vite.config.ts`, ensure `base: './'` or `base: '/Earth-Jukebox/'` is set if hosting on project subpath.
2. In your GitHub repository:
   - Go to **Settings > Pages**.
   - Under **Build and deployment > Source**, select **GitHub Actions**.
   - Use the standard **Static HTML / Vite** GitHub Actions workflow to build and deploy `dist/`.

---

## 4. Verification After Deployment

Once deployed, open your live link in an **Incognito / Private browser window** and verify:
1. The 3D rotating Earth globe loads smoothly with day and cloud textures.
2. The start screen appears with the "Start Experience" button.
3. Clicking "Start Experience" enables real-time Web Audio API synthesis without errors.
4. The timeline slider, warming stripes scrubber, and modals work properly.
5. Zero console errors or warnings appear in the Developer Tools console (`F12`).
