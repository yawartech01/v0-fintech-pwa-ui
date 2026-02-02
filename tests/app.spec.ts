import { test, expect } from '@playwright/test'

test.describe('VELTOX PWA', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('VELTOX')
  })

  test('can navigate through tabs after login', async ({ page }) => {
    await page.goto('/')
    
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for navigation
    await page.waitForURL('/')
    
    // Check we're on home
    await expect(page.locator('text=Today\'s USDT Rate')).toBeVisible()
    
    // Navigate to Sell Ads
    await page.click('text=Sell Ads')
    await expect(page.locator('text=Create New Sell Ad')).toBeVisible()
    
    // Navigate to Wallet
    await page.click('text=Wallet')
    await expect(page.locator('text=Total Balance')).toBeVisible()
    
    // Navigate to Profile
    await page.click('text=Profile')
    await expect(page.locator('text=Logout')).toBeVisible()
  })

  test('can create a sell ad', async ({ page }) => {
    await page.goto('/')
    
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    
    // Go to create ad page
    await page.click('text=Sell Ads')
    await page.click('text=Create New Sell Ad')
    
    // Fill form
    await page.fill('input[type="number"]', '100')
    await page.click('button[type="submit"]')
    
    // Should redirect to sell ads page
    await expect(page.locator('text=Sell Ad #')).toBeVisible()
  })

  test('can add bank account', async ({ page }) => {
    await page.goto('/')
    
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    
    // Navigate to profile
    await page.click('text=Profile')
    
    // Go to bank accounts
    await page.click('text=Bank Accounts')
    
    // Open dialog
    await page.click('text=Add Bank Account')
    
    // Fill form
    await page.fill('#holder-name', 'John Doe')
    await page.fill('#account-number', '1234567890')
    await page.fill('#ifsc', 'HDFC0001234')
    await page.fill('#bank-name', 'HDFC Bank')
    await page.click('button[type="submit"]')
    
    // Should show the account
    await expect(page.locator('text=HDFC Bank')).toBeVisible()
  })

  test('referral page renders correctly', async ({ page }) => {
    await page.goto('/')
    
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    
    // Navigate to profile
    await page.click('text=Profile')
    
    // Go to referral page
    await page.click('text=Invite & Earn')
    
    // Check referral elements
    await expect(page.locator('text=Your Referral Code')).toBeVisible()
    await expect(page.locator('text=Total Referrals')).toBeVisible()
    await expect(page.locator('text=Total Earned')).toBeVisible()
  })

  test('has proper mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check meta viewport
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]')
      return meta?.getAttribute('content')
    })
    
    expect(viewport).toContain('viewport-fit=cover')
  })
})
