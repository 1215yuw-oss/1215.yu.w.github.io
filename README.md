<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4a7758a7-2acb-43a7-ad9a-2cffb7934873

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## 🚀 Project Overview

### 1. Project Info
- **Purpose:** 專業個人形象官網 (Professional Personal Profile Website) showcasing skills, experience, and projects.
- **Tech Stack:** React, Vite, Tailwind CSS, TypeScript.
- **Dependencies:** `lucide-react` for icons, `framer-motion` (if used) for animations, and core React/Vite toolchain.

### 2. Operational Logic
- **Component Flow:** `main.tsx` bootstraps the React application into `index.html`. `App.tsx` handles the main responsive layout (mobile-first approach).
- **Styling:** Tailwind CSS utility classes are used for semantic styling and responsive break-points (sm, md, lg).
- **Deployment:** A GitHub Action (`.github/workflows/deploy.yml`) is triggered on every push to the `main` branch. This action builds the Vite project and deploys the `dist` folder to GitHub Pages.

### 3. Usage Instructions
- **Local Development:** Run `npm install` followed by `npm run dev` to preview changes on `localhost:5173`.
- **Deploy:** Commit and push changes directly to the `main` branch:
  ```bash
  git add .
  git commit -m "update: your changes"
  git push origin main
  ```
  The site will automatically build and publish to `https://1215.yu.w.github.io/`.
