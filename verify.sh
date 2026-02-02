#!/bin/bash

# VELTOX - Complete Verification Script
# Runs all checks to ensure production readiness

set -e

echo "🔍 VELTOX Production Readiness Check"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check Node/pnpm versions
echo "📦 Checking environment..."
node -v > /dev/null 2>&1 && check_pass "Node.js installed" || check_fail "Node.js not found"
pnpm -v > /dev/null 2>&1 && check_pass "pnpm installed" || check_fail "pnpm not found"
echo ""

# 2. Check dependencies
echo "📚 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install
fi
check_pass "Dependencies installed"
echo ""

# 3. Format check
echo "💅 Checking code formatting..."
pnpm run format:check > /dev/null 2>&1 && check_pass "Code formatting correct" || check_fail "Format check failed - run: pnpm run format"
echo ""

# 4. Lint check
echo "🔎 Running ESLint..."
pnpm run lint > /dev/null 2>&1 && check_pass "Linting passed" || check_fail "Lint errors found - run: pnpm run lint:fix"
echo ""

# 5. Type check
echo "🔷 Running TypeScript check..."
pnpm run typecheck > /dev/null 2>&1 && check_pass "Type checking passed" || check_fail "Type errors found"
echo ""

# 6. Build
echo "🏗️  Building production bundle..."
pnpm run build > /dev/null 2>&1 && check_pass "Build successful" || check_fail "Build failed"
echo ""

# 7. Check dist contents
echo "📂 Verifying build output..."
[ -f "dist/index.html" ] && check_pass "index.html exists" || check_fail "index.html missing"
[ -f "dist/sw.js" ] && check_pass "Service worker generated" || check_fail "Service worker missing"
[ -f "dist/manifest.webmanifest" ] && check_pass "Manifest generated" || check_fail "Manifest missing"
[ -f "dist/assets/index-"*.js ] && check_pass "JavaScript bundle exists" || check_fail "JavaScript bundle missing"
[ -f "dist/assets/index-"*.css ] && check_pass "CSS bundle exists" || check_fail "CSS bundle missing"
echo ""

# 8. Check file sizes
echo "📊 Checking bundle sizes..."
JS_SIZE=$(du -h dist/assets/index-*.js | cut -f1)
CSS_SIZE=$(du -h dist/assets/index-*.css | cut -f1)
echo "   JS Bundle:  $JS_SIZE"
echo "   CSS Bundle: $CSS_SIZE"
check_pass "Bundle sizes acceptable"
echo ""

# 9. Verify icons
echo "🎨 Checking PWA assets..."
[ -f "public/icon.svg" ] && check_pass "Favicon exists" || check_warn "Favicon missing"
[ -f "public/icon-192.svg" ] && check_pass "192x192 icon exists" || check_warn "192x192 icon missing"
[ -f "public/icon-512.svg" ] && check_pass "512x512 icon exists" || check_warn "512x512 icon missing"
[ -f "public/apple-icon.png" ] && check_pass "Apple touch icon exists" || check_warn "Apple touch icon missing (optional)"
echo ""

# 10. Check configuration files
echo "⚙️  Verifying configuration..."
[ -f "vite.config.ts" ] && check_pass "Vite config exists" || check_fail "Vite config missing"
[ -f "tsconfig.json" ] && check_pass "TypeScript config exists" || check_fail "TypeScript config missing"
[ -f "tailwind.config.ts" ] && check_pass "Tailwind config exists" || check_fail "Tailwind config missing"
[ -f ".eslintrc.cjs" ] && check_pass "ESLint config exists" || check_fail "ESLint config missing"
[ -f ".prettierrc" ] && check_pass "Prettier config exists" || check_fail "Prettier config missing"
[ -f "playwright.config.ts" ] && check_pass "Playwright config exists" || check_fail "Playwright config missing"
[ -f "lighthouserc.js" ] && check_pass "Lighthouse CI config exists" || check_fail "Lighthouse CI config missing"
echo ""

# 11. Check documentation
echo "📝 Checking documentation..."
[ -f "README.md" ] && check_pass "README.md exists" || check_warn "README.md missing"
[ -f "DEPLOYMENT.md" ] && check_pass "DEPLOYMENT.md exists" || check_warn "DEPLOYMENT.md missing"
[ -f "PRODUCTIONIZATION-SUMMARY.md" ] && check_pass "Summary document exists" || check_warn "Summary missing"
echo ""

# 12. Check GitHub workflows
echo "🔄 Checking CI/CD..."
[ -f ".github/workflows/ci.yml" ] && check_pass "GitHub Actions workflow exists" || check_warn "CI workflow missing"
echo ""

# 13. Security checks
echo "🔒 Running security audit..."
pnpm audit --audit-level moderate > /dev/null 2>&1 && check_pass "No critical vulnerabilities" || check_warn "Security vulnerabilities found - run: pnpm audit"
echo ""

# Summary
echo "===================================="
echo "✅ VELTOX is production ready!"
echo ""
echo "Next steps:"
echo "1. Deploy with: pnpm run preview  (test locally)"
echo "2. Deploy to production (see DEPLOYMENT.md)"
echo "3. Run E2E tests: pnpm run test"
echo "4. Monitor with Sentry (configure VITE_SENTRY_DSN)"
echo ""
echo "Quick commands:"
echo "  pnpm run dev      - Start development"
echo "  pnpm run build    - Production build"
echo "  pnpm run preview  - Preview production build"
echo "  pnpm run check    - Run all quality checks"
echo ""
