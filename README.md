# LittleTools — lightweight browser toolbox

Responsive website for desktop and mobile, with a simple box-based toolbox home screen. Click a tool card to open that tool, then use Back to all tools to return. It currently has two separate tools:
1. QR Code Generator
2. Image Compressor (target under 1 MB)
3. Photo to PDF (combine up to 10 images into one PDF)

Built with React, TypeScript, Vite, and CSS. There is no backend: QR creation and image compression run in the user's browser. This keeps hosting simple and avoids uploading users' files to a server.

## Project structure

```text
src/
  app/
    App.tsx
  components/
    AppHeader.tsx
    ToolCard.tsx
  features/
    qr/
      QrTool.tsx
      qr.utils.ts
    image-compressor/
      ImageCompressorTool.tsx
      image.utils.ts
    photo-to-pdf/
      PhotoToPdfTool.tsx
      photoToPdf.utils.ts
  styles/
    global.css
  main.tsx
```

Each tool lives in its own feature folder, so new tools can be added later without placing everything in one component.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

Vite outputs the deployable static website into `dist/`. Hosting can be set up later on Vercel, Netlify, or another static host. For Vercel, use `npm run build` as the build command and `dist` as the output directory.

## Image compression notes

- Files are processed locally in the browser and are not uploaded.
- JPEG and WebP output are supported; PNG uploads can be converted to JPEG/WebP for a much smaller file.
- Users can choose a maximum output size (100 KB, 200 KB, 300 KB, 500 KB, 750 KB, 1 MB, or a custom value from 20 KB to 1024 KB). The tool lowers quality and resizes as needed; it reports an error rather than claiming success if the selected limit cannot be reached.
- Some image formats (such as animated GIFs, SVGs, and certain HEIC files) are not supported by the browser canvas path.
- The output format can affect transparency: JPEG has no transparency, while WebP usually supports it. Choose WebP when preserving transparent areas matters and your browser supports it.
- Compression always involves a quality/resolution trade-off. Preview the output before using it. Images are limited to 30 MB to keep processing suitable for a lightweight browser tool.

## Future expansion

Add new tools under `src/features/<tool-name>/`, then add a navigation card and a render branch in `src/app/App.tsx`. Photo to PDF uses jsPDF and runs in the browser. It accepts up to 10 images, lets users reorder them, and supports A4/Letter pages, portrait/landscape orientation, and margins. Keep reusable UI in `src/components/` and global styles in `src/styles/`.

## Deploy to Vercel

This project includes `vercel.json` with a single-page-app rewrite, useful if client-side routes are added later.

1. Push this project to a Git repository (GitHub is convenient).
2. In Vercel, choose **Add New → Project** and import the repository.
3. Set the Root Directory to the folder containing this `package.json` (usually `toolbox-web` if the repo has this project in a subfolder).
4. Confirm these build settings:
   - Framework Preset: **Vite**
   - Install Command: `npm install` (or leave the default auto-detected setting)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Deploy. No environment variables or backend service are required for the current three browser-only tools.

Before deploying, run `npm install` and `npm run build` locally to catch any TypeScript/build errors.
