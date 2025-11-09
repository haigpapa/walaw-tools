# Deployment Guide - Walaw Tools

This guide explains how to deploy Walaw Tools to various platforms.

## 🚀 Quick Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy this React/Vite application:

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project or create new
   - Accept default settings
   - Deploy!

### Option 2: Deploy via Vercel Dashboard

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect the settings from `vercel.json`
   - Click "Deploy"

## 🌐 Other Deployment Options

### Netlify

1. **Create `netlify.toml`** in project root:
   ```toml
   [build]
     base = "client"
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy:**
   - Connect your GitHub repo to Netlify
   - Or use Netlify CLI: `netlify deploy --prod`

### GitHub Pages

1. **Install gh-pages:**
   ```bash
   cd client
   npm install --save-dev gh-pages
   ```

2. **Add to `package.json` scripts:**
   ```json
   "homepage": "https://yourusername.github.io/walaw-tools",
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

### Render

1. **Create `render.yaml`:**
   ```yaml
   services:
     - type: web
       name: walaw-tools
       env: static
       buildCommand: cd client && npm install && npm run build
       staticPublishPath: ./client/dist
       routes:
         - type: rewrite
           source: /*
           destination: /index.html
   ```

2. Connect your GitHub repo to Render

## 🛠️ Local Development

```bash
# Install dependencies
cd client
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Build Configuration

The project includes:
- ✅ `vercel.json` - Vercel deployment config
- ✅ `vite.config.ts` - Vite build configuration
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `tailwind.config.js` - Tailwind CSS configuration
- ✅ `package.json` - Dependencies and scripts

## 🔧 Environment Variables

This application doesn't require any environment variables for basic deployment.

If you add backend features later, create a `.env` file:

```env
VITE_API_URL=https://your-api-url.com
```

Access in code with `import.meta.env.VITE_API_URL`

## 📊 Build Output

The build creates an optimized production bundle:
- Code splitting for better performance
- React vendor chunk (~140KB gzipped)
- Radix UI chunk (~80KB gzipped)
- Tool-specific chunks loaded on demand
- Total initial load: ~250KB gzipped

## 🎯 Domain Setup

### Vercel
1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

### Netlify
1. Go to Site Settings > Domain Management
2. Add custom domain
3. Configure DNS

## 🔒 Security Headers

Consider adding these headers in your deployment platform:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: microphone=(self), camera=()
```

## 📈 Performance Tips

1. **Enable Compression:** Vercel/Netlify do this automatically
2. **CDN:** Both platforms include global CDN
3. **Caching:** Build outputs are automatically cached
4. **Analytics:** Add Vercel Analytics or Google Analytics if needed

## ✅ Deployment Checklist

- [ ] All dependencies in `package.json`
- [ ] Build succeeds locally (`npm run build`)
- [ ] Preview looks good (`npm run preview`)
- [ ] All routes work with client-side routing
- [ ] Images and assets load correctly
- [ ] No console errors in production build
- [ ] Mobile responsive on all pages
- [ ] Audio Visualizer microphone permissions work
- [ ] Export functionality works (download files)

## 🎉 Post-Deployment

After deploying:

1. **Test all tools:**
   - Cell Mosaic Animator
   - Particle Image Swarm
   - Vector Split & Offset
   - Contour Type Sampler
   - Generative Pattern Studio
   - Recursive Drawing Machine
   - Audio Visualizer Composer

2. **Test features:**
   - Image upload
   - Audio upload/microphone
   - Export (PNG, JPG, WebP, WebM)
   - Preset save/load
   - Undo/redo
   - Keyboard shortcuts

3. **Share your deployed URL!**

## 🐛 Troubleshooting

**Build fails:**
- Check Node version (requires 18+)
- Clear node_modules and reinstall
- Check for TypeScript errors

**Routes don't work:**
- Ensure rewrites are configured in `vercel.json`
- Check that all routes redirect to `/index.html`

**Assets not loading:**
- Check that files are in `public/` folder
- Verify asset paths are relative

**Performance issues:**
- Enable compression
- Check bundle size with `npm run build`
- Consider lazy loading heavy components

---

## 🌟 Recommended: Vercel

For the best experience with this React/Vite app, we recommend Vercel:

- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Instant rollbacks
- ✅ Preview deployments for PRs
- ✅ Built-in analytics

**Deploy now:** `npx vercel`

---

*For more help, see [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)*
