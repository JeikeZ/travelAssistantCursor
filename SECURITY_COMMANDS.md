# CVE-2025-55182 Fix - Command Reference

Quick reference for all commands needed to fix the React2Shell vulnerability.

---

## 🚀 Quick Fix Commands

### Automated Fix (Easiest)
```bash
# Run Vercel's automated fix tool
npx fix-react2shell-next
```

### Manual Fix (Alternative)
```bash
# Update Next.js and related packages
npm install next@15.5.7 eslint-config-next@15.5.7

# Update all dependencies
npm install
```

---

## 🔍 Verification Commands

### Check Installed Version
```bash
# Show Next.js version
npm list next

# Show detailed dependency tree
npm list next --depth=0

# Check package.json
cat package.json | grep "next"

# Check package-lock.json
cat package-lock.json | grep "\"next\"" | head -5
```

### Check Runtime Version
```javascript
// In browser console after loading your app:
next.version
// Should show: "15.5.7"
```

---

## 🧪 Testing Commands

### Build and Test
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Type checking
npm run type-check

# Linting
npm run lint

# Build the application
npm run build

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# All tests
npm run test:all

# Run with coverage
npm run test:coverage
```

### Development Testing
```bash
# Start development server
npm run dev

# Then open http://localhost:3000
# and test all features
```

---

## 📦 Deployment Commands

### Git Commit
```bash
# Stage the changes
git add package.json package-lock.json

# Commit with clear message
git commit -m "Security: Update Next.js to 15.5.7 (Fix CVE-2025-55182)"

# Push to remote
git push origin main
```

### Production Build
```bash
# Build for production
npm run build

# Start production server (local testing)
npm run start
```

---

## 🔒 Security Audit Commands

### Check for Vulnerabilities
```bash
# Run security audit
npm audit

# Show detailed audit
npm audit --json

# Try to auto-fix
npm audit fix

# Force auto-fix (may cause breaking changes)
npm audit fix --force
```

### Check for Outdated Packages
```bash
# List outdated packages
npm outdated

# Update all packages (careful with major versions)
npm update

# Update specific package
npm update next
```

---

## 🔎 Investigation Commands

### Check for React Server Components Packages
```bash
# Search for RSC-related packages
npm list | grep -i "react-server"

# Check all React packages
npm list react react-dom
```

### Review API Routes
```bash
# List all API routes
find src/app/api -name "route.ts" -o -name "route.tsx"

# Count API routes
find src/app/api -name "route.ts" | wc -l
```

### Check Server Components
```bash
# Find files without 'use client' (likely Server Components)
find src/app -name "*.tsx" -o -name "*.ts" | while read file; do
  if ! grep -q "'use client'" "$file" && ! grep -q '"use client"' "$file"; then
    echo "$file"
  fi
done
```

---

## 📊 Monitoring Commands

### Check Application Logs
```bash
# For local development
npm run dev 2>&1 | tee dev.log

# Watch for errors
npm run dev 2>&1 | grep -i error

# For production (depends on hosting platform)
# Vercel: Use Vercel dashboard
# PM2: pm2 logs
# Docker: docker logs <container-id>
```

### Check Build Size
```bash
# Build with analysis
ANALYZE=true npm run build
```

---

## 🚨 Emergency Commands

### Rollback (NOT RECOMMENDED - Leaves Vulnerability)
```bash
# Only use if absolutely necessary
npm install next@15.5.2 eslint-config-next@15.5.2
npm install

# Then immediately plan to upgrade properly
```

### Clean Slate
```bash
# Remove all dependencies and caches
rm -rf node_modules package-lock.json .next

# Reinstall everything
npm install

# Rebuild
npm run build
```

---

## 📝 Reporting Commands

### Generate Dependency Report
```bash
# List all dependencies
npm list > npm-list.txt

# List only production dependencies
npm list --prod > npm-prod-list.txt

# List only dev dependencies
npm list --dev > npm-dev-list.txt
```

### Check Package Details
```bash
# Show Next.js package info
npm info next

# Show specific version info
npm info next@15.5.7

# Show all available versions
npm view next versions
```

---

## 🔧 Troubleshooting Commands

### Clear Caches
```bash
# Clear npm cache
npm cache clean --force

# Clear Next.js cache
rm -rf .next

# Clear all caches
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install
```

### Verify Installation
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check installed packages
npm list --depth=0

# Check for duplicate packages
npm dedupe
```

### Fix Common Issues
```bash
# Fix peer dependency issues
npm install --legacy-peer-deps

# Rebuild native modules
npm rebuild

# Fix permissions (Linux/Mac)
sudo chown -R $(whoami) ~/.npm
```

---

## 📋 Complete Fix Workflow

```bash
# 1. Backup current state
git status
git add .
git commit -m "Backup before security update"

# 2. Update Next.js
npm install next@15.5.7 eslint-config-next@15.5.7

# 3. Verify installation
npm list next

# 4. Clear caches
rm -rf .next
npm cache clean --force

# 5. Type check
npm run type-check

# 6. Lint
npm run lint

# 7. Build
npm run build

# 8. Test
npm run test

# 9. Run E2E tests
npm run test:e2e

# 10. Test locally
npm run dev
# Manual testing in browser...

# 11. Commit changes
git add package.json package-lock.json
git commit -m "Security: Update Next.js to 15.5.7 (Fix CVE-2025-55182)"

# 12. Push to production
git push origin main

# 13. Verify deployment
# Check browser console: next.version should be "15.5.7"
```

---

## 🌐 Environment-Specific Commands

### Vercel
```bash
# Deploy to Vercel
vercel deploy

# Deploy to production
vercel --prod

# Check deployment
vercel ls

# View logs
vercel logs
```

### Docker
```bash
# Build Docker image
docker build -t travel-assistant .

# Run container
docker run -p 3000:3000 travel-assistant

# Check logs
docker logs <container-id>
```

### PM2
```bash
# Start with PM2
pm2 start npm --name "travel-assistant" -- start

# Restart
pm2 restart travel-assistant

# Check status
pm2 status

# View logs
pm2 logs travel-assistant
```

---

## 💡 Pro Tips

### Useful Aliases (Add to ~/.bashrc or ~/.zshrc)
```bash
# Quick version check
alias nextver="npm list next | head -2"

# Quick test
alias quicktest="npm run type-check && npm run lint && npm run test"

# Quick security audit
alias secaudit="npm audit && npm outdated"
```

### Watch for Changes
```bash
# Watch tests
npm run test:watch

# Watch build
npm run dev
```

### Performance Profiling
```bash
# Build with profiling
NEXT_TELEMETRY_DISABLED=1 npm run build -- --profile
```

---

## 📚 Help Commands

```bash
# Next.js help
npx next --help

# npm help
npm help install

# Check configuration
cat next.config.ts
cat package.json
cat tsconfig.json
```

---

## ⚡ One-Liner Fix

For quick copy-paste:

```bash
npm install next@15.5.7 eslint-config-next@15.5.7 && npm run build && npm run test && echo "✅ Update complete! Verify with: npm list next"
```

---

**Last Updated:** December 6, 2025  
**Related Documents:**
- `SECURITY_QUICK_START.md` - Quick start guide
- `SECURITY_REMEDIATION_PLAN.md` - Detailed remediation plan
- `SECURITY_FINDINGS_SUMMARY.md` - Security findings
