#!/bin/bash

# Quick Deploy Script for VELTOX PWA

echo "🚀 VELTOX Deployment Options"
echo "=============================="
echo ""

# Current server info
echo "📍 Current Server Access:"
echo "   Local:    http://localhost:4174"
echo "   Network:  http://5.223.61.117:4174"
echo ""
echo "⚠️  Note: Direct IP access may be blocked by firewall"
echo ""

echo "🌐 Deployment Options:"
echo ""
echo "1️⃣  VERCEL (Recommended - FREE)"
echo "   cd /root/v0-fintech-pwa-ui"
echo "   vercel --prod"
echo "   → Follow prompts to link GitHub repo"
echo "   → Get instant public URL"
echo ""

echo "2️⃣  NETLIFY (FREE)"
echo "   npm install -g netlify-cli"
echo "   cd /root/v0-fintech-pwa-ui"
echo "   netlify deploy --prod --dir=dist"
echo ""

echo "3️⃣  GITHUB PAGES (Manual)"
echo "   - Push to GitHub"
echo "   - Enable GitHub Pages in repo settings"
echo "   - Set source to 'dist' folder"
echo ""

echo "4️⃣  CLOUDFLARE PAGES (FREE)"
echo "   - Connect GitHub repo at pages.cloudflare.com"
echo "   - Build: pnpm run build"
echo "   - Output: dist"
echo ""

echo "✨ Fastest Deploy (Vercel):"
echo "   cd /root/v0-fintech-pwa-ui && vercel --prod"
echo ""

read -p "Deploy to Vercel now? (y/n): " choice
if [ "$choice" = "y" ] || [ "$choice" = "Y" ]; then
    cd /root/v0-fintech-pwa-ui
    vercel --prod
fi
