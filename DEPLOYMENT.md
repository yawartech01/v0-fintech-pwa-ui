# VELTOX - Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration

Create `.env.production` with production values:

```bash
# Optional: Sentry monitoring
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 2. API Integration

Replace mock data layer with real API:

**File:** `src/lib/data-store.ts`

Replace all methods with actual API calls:

```typescript
// Example transformation
async login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()
  // Store token, update state, persist
}
```

Key endpoints needed:
- `/api/auth/login` - User authentication
- `/api/auth/signup` - User registration
- `/api/wallet/*` - Wallet operations
- `/api/sell-ads/*` - Sell ad management
- `/api/bank-accounts/*` - Payment method management
- `/api/referrals/*` - Referral system
- `/api/rate` - Current USDT rate

### 3. Icon Assets

Replace placeholder icons in `/public`:

**Required icons:**
- `icon.svg` - Favicon (32x32)
- `icon-192.svg` - App icon (192x192) ✅ Created
- `icon-512.svg` - Large app icon (512x512) ✅ Created
- `apple-icon.png` - Apple touch icon (180x180)

Generate from your brand assets using:
```bash
# Install imagemagick
apt install imagemagick

# Generate PNG icons from SVG
convert icon-192.svg icon-192.png
convert icon-512.svg icon-512.png
convert -resize 180x180 icon-512.svg apple-icon.png
```

### 4. Build Production Bundle

```bash
pnpm install
pnpm run build
```

Output: `dist/` directory with optimized assets

**Verify build:**
- Check bundle size is reasonable (<500 KiB gzipped)
- Ensure service worker is generated (`dist/sw.js`)
- Verify manifest.webmanifest is present

### 5. Test Preview Build

```bash
pnpm run preview
```

Access at `http://localhost:4173` and verify:
- ✅ App loads correctly
- ✅ Authentication flow works
- ✅ Navigation between tabs
- ✅ PWA install prompt appears
- ✅ Offline mode works (disconnect network)

## Deployment Options

### Option 1: Vercel (Recommended)

**One-Click Deploy:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd /root/v0-fintech-pwa-ui
vercel --prod
```

**Or use Vercel Dashboard:**
1. Push to GitHub
2. Import project in Vercel
3. Framework preset: Vite
4. Build command: `pnpm run build`
5. Output directory: `dist`
6. Install command: `pnpm install`

**Environment Variables in Vercel:**
- Add `VITE_SENTRY_DSN` if using Sentry

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**netlify.toml:**
```toml
[build]
  command = "pnpm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Custom Server (Nginx)

**Build:**
```bash
pnpm run build
```

**Nginx Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name veltox.app;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/veltox/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker must not be cached
    location = /sw.js {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Manifest
    location = /manifest.webmanifest {
        expires 1d;
        add_header Cache-Control "public";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

**Deploy:**
```bash
rsync -avz dist/ user@server:/var/www/veltox/dist/
nginx -s reload
```

### Option 4: Docker

**Dockerfile:**
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Build & Run:**
```bash
docker build -t veltox-pwa .
docker run -p 80:80 veltox-pwa
```

## Post-Deployment Verification

### 1. PWA Audit

Use Lighthouse:
```bash
npm install -g @lhci/cli
lhci autorun --url=https://your-domain.com
```

**Target Scores:**
- Performance: ≥90
- Accessibility: ≥90
- Best Practices: ≥90
- SEO: ≥90
- PWA: ≥90

### 2. Test on Real Devices

**iOS:**
- Safari: Add to Home Screen
- Check safe area insets
- Verify touch targets

**Android:**
- Chrome: Install prompt
- Check offline mode
- Test bottom nav

### 3. Cross-Browser Testing

Test on:
- Chrome (desktop + mobile)
- Safari (iOS)
- Firefox
- Edge

### 4. Monitoring Setup

If using Sentry:

1. Create release:
```bash
sentry-cli releases new veltox@1.0.0
sentry-cli releases set-commits veltox@1.0.0 --auto
sentry-cli releases finalize veltox@1.0.0
```

2. Upload sourcemaps (uncomment in `.github/workflows/ci.yml`)

3. Monitor errors in Sentry dashboard

## Performance Optimization

### 1. Enable Gzip/Brotli

All static hosts should compress assets. Verify:
```bash
curl -H "Accept-Encoding: gzip" -I https://your-domain.com
```

Should return: `Content-Encoding: gzip`

### 2. CDN Setup

Use a CDN for static assets:
- Cloudflare (free)
- AWS CloudFront
- Vercel Edge Network (included)

### 3. Preload Critical Assets

Add to `index.html` if needed:
```html
<link rel="preload" href="/assets/index-*.js" as="script">
<link rel="preload" href="/assets/index-*.css" as="style">
```

## Security Considerations

### 1. HTTPS Only

Ensure site is served over HTTPS (required for PWAs)

### 2. Content Security Policy

Add CSP headers:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;
```

### 3. API Authentication

Implement proper JWT/session handling in data store

### 4. Rate Limiting

Add rate limiting to prevent abuse

## Maintenance

### Regular Updates

```bash
# Update dependencies monthly
pnpm update

# Check for security issues
pnpm audit

# Run full check
pnpm run check
```

### Monitoring

- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor Sentry for errors
- Check Lighthouse scores monthly
- Review analytics

## Rollback Plan

If deployment fails:

**Vercel:**
```bash
vercel rollback
```

**Manual:**
```bash
# Restore previous dist
rsync -avz dist-backup/ dist/
```

**Always keep previous build:**
```bash
mv dist dist-backup
pnpm run build
```

## Domain Configuration

### DNS Records

```
Type  Name    Value
A     @       your-server-ip
A     www     your-server-ip
```

Or for Vercel:
```
Type   Name    Value
CNAME  @       cname.vercel-dns.com
CNAME  www     cname.vercel-dns.com
```

### SSL Certificate

**Let's Encrypt (Free):**
```bash
certbot --nginx -d veltox.app -d www.veltox.app
```

## Troubleshooting

### Service Worker Not Updating

Clear with:
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister())
})
```

### Build Errors

```bash
# Clear cache
rm -rf node_modules/.cache
rm -rf dist

# Reinstall
rm -rf node_modules
pnpm install
pnpm run build
```

### PWA Not Installing

Check:
1. HTTPS is enabled
2. manifest.webmanifest is accessible
3. Service worker registers successfully
4. Icons are valid

## Success Criteria

✅ All tests pass (`pnpm run check`)
✅ Build completes successfully
✅ Preview works locally
✅ Production site loads < 3s
✅ Lighthouse PWA score ≥ 90
✅ Install prompt appears on mobile
✅ Offline mode works
✅ No console errors
✅ All routes accessible
✅ Monitoring configured

---

**Production Checklist Complete!** 🚀

For support, see `README.md` or open an issue.
