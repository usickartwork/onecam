# DAZZCAM

A lightweight, privacy-focused web camera application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 📷 Live camera preview with real-time filter effects
- 🎨 10 built-in filters (Original, Vintage, Classic Film, Warm, Cool, Mono, Fade, Retro, Soft, Cinematic)
- 🎚️ Filter intensity slider (0–100)
- ☀️ Brightness & contrast adjustments
- 📸 Photo capture with Canvas-based filter baking
- 💾 Save photos to device (timestamped filename)
- 📤 Share via Web Share API (with download fallback)
- 🔄 Front/rear camera switching
- 🔒 100% client-side — no photo uploads, no server storage
- 📱 Mobile-first responsive design

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Camera access requires HTTPS in production. `localhost` works fine for development.

## Build for Production

```bash
npm run build
npm start
```

## Privacy

DAZZCAM processes all photos entirely in the browser. No images are uploaded to any server.
