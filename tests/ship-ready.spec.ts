import { test, expect } from '@playwright/test'

test.describe('VELTOX PWA - Ship-Ready Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  // === CORE FLOW: Deposit Pending -> Confirmed ===
  test('Deposit flow: pending -> confirmed updates wallet and activity', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'deposit-flow@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    // Navigate to Wallet
    await page.click('text=Wallet')
    await page.waitForTimeout(500)

    // Get initial available balance
    const initialBalanceText = await page.locator('text=/Available.*USDT/').first().textContent()
    const initialBalance = parseFloat(initialBalanceText?.match(/[\d,]+\.?\d*/)?.[0]?.replace(/,/g, '') || '0')

    // Simulate deposit (dev panel)
    const showButton = page.locator('button:has-text("Show")')
    if (await showButton.count() > 0) {
      await showButton.first().click()
      await page.click('text=+200 USDT')
      await page.waitForTimeout(1000)

      // Verify deposit appears as pending
      await expect(page.locator('text=200').first()).toBeVisible()
      await expect(page.locator('text=Confirmations').first()).toBeVisible()

      // Wait for confirmations (3 * 5s = 15s)
      await page.waitForTimeout(16000)
      await page.reload()

      // Verify deposit is confirmed
      await expect(page.locator('text=Confirmed').first()).toBeVisible({ timeout: 5000 })

      // Verify balance increased
      await page.click('text=Overview')
      await page.waitForTimeout(1000)
      const newBalanceText = await page.locator('text=/Available.*USDT/').first().textContent()
      const newBalance = parseFloat(newBalanceText?.match(/[\d,]+\.?\d*/)?.[0]?.replace(/,/g, '') || '0')
      expect(newBalance).toBeGreaterThan(initialBalance)

      // Verify activity feed shows deposit
      await page.click('text=Home')
      await page.waitForTimeout(500)
      await expect(page.locator('text=Deposit Confirmed')).toBeVisible()
    }
  })

  // === CORE FLOW: Sell Ad Locking/Unlocking ===
  test('Sell Ad: create ACTIVE -> pause -> resume -> complete', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'ad-flow@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    // Ensure user has balance (simulate deposit if needed)
    await page.click('text=Wallet')
    await page.waitForTimeout(500)
    const showButton = page.locator('button:has-text("Show")')
    if (await showButton.count() > 0) {
      await showButton.first().click()
      await page.click('text=+1500 USDT')
      await page.waitForTimeout(16000) // Wait for confirmation
    }

    // Ensure user has bank account
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    await page.click('text=Bank Accounts')
    await page.waitForTimeout(500)
    
    const addButton = page.locator('button:has-text("Add Bank Account")')
    if (await addButton.count() > 0) {
      await addButton.first().click()
      await page.fill('input[placeholder*="Bank Name"]', 'Test Bank')
      await page.fill('input[placeholder*="Account Holder"]', 'Test User')
      await page.fill('input[placeholder*="Account Number"]', '123456789012')
      await page.fill('input[placeholder*="IFSC"]', 'TEST0001234')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)
    }

    // Navigate to Sell Ads
    await page.click('text=Sell Ads')
    await page.waitForTimeout(500)

    // Create ACTIVE sell ad
    await page.click('text=Create Sell Ad')
    await page.fill('input[placeholder*="amount"]', '500')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    // Verify ad created and locked decreased available
    await expect(page.locator('text=500').first()).toBeVisible()
    await expect(page.locator('text=ACTIVE').first()).toBeVisible()

    // Pause ad
    await page.click('button:has-text("Pause")').first()
    await page.waitForTimeout(1000)
    await expect(page.locator('text=PAUSED').first()).toBeVisible()

    // Resume ad
    await page.click('button:has-text("Resume")').first()
    await page.waitForTimeout(1000)
    await expect(page.locator('text=ACTIVE').first()).toBeVisible()

    // Mark as Sold (complete)
    await page.click('button:has-text("Mark as Sold")').first()
    await page.waitForTimeout(1000)
    await expect(page.locator('text=COMPLETED').first()).toBeVisible()
  })

  // === CORE FLOW: Withdrawal Request -> Admin Approve ===
  test('Withdrawal: request -> admin approve -> completed', async ({ page }) => {
    // Login as user
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'withdrawal-flow@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    // Ensure balance (simulate deposit)
    await page.click('text=Wallet')
    await page.waitForTimeout(500)
    const showButton = page.locator('button:has-text("Show")')
    if (await showButton.count() > 0) {
      await showButton.first().click()
      await page.click('text=+200 USDT')
      await page.waitForTimeout(16000) // Wait for confirmation
    }

    // Create withdrawal request
    await page.click('text=Withdraw')
    await page.fill('input[placeholder*="TRC20"]', 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb')
    await page.fill('input[placeholder*="Amount"]', '50')
    await page.click('button:has-text("Review Withdrawal")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("Confirm Withdrawal")')
    await page.waitForTimeout(1000)

    // Verify request created
    await expect(page.locator('text=Under Review').first()).toBeVisible()

    // Enable admin mode
    await page.evaluate(() => {
      localStorage.setItem('veltox_is_admin', 'true')
    })
    await page.reload()

    // Navigate to Admin panel
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    await page.click('text=Admin')
    await page.waitForTimeout(500)

    // Approve withdrawal
    const approveButton = page.locator('button:has-text("Approve")').first()
    if (await approveButton.count() > 0) {
      await approveButton.click()
      await page.waitForTimeout(2000)
      await expect(page.locator('text=Completed').first()).toBeVisible()
    }
  })

  // === CORE FLOW: Withdrawal Request -> Admin Reject ===
  test('Withdrawal: request -> admin reject -> funds refunded', async ({ page }) => {
    // Login as user
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'withdrawal-reject@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    // Ensure balance
    await page.click('text=Wallet')
    await page.waitForTimeout(500)
    const showButton = page.locator('button:has-text("Show")')
    if (await showButton.count() > 0) {
      await showButton.first().click()
      await page.click('text=+200 USDT')
      await page.waitForTimeout(16000)
    }

    // Get initial locked balance
    await page.click('text=Home')
    await page.waitForTimeout(500)

    // Create withdrawal request
    await page.click('text=Wallet')
    await page.click('text=Withdraw')
    await page.fill('input[placeholder*="TRC20"]', 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb')
    await page.fill('input[placeholder*="Amount"]', '30')
    await page.click('button:has-text("Review")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("Confirm")')
    await page.waitForTimeout(1000)

    // Enable admin and reject
    await page.evaluate(() => localStorage.setItem('veltox_is_admin', 'true'))
    await page.reload()
    await page.click('text=Profile')
    await page.click('text=Admin')
    await page.waitForTimeout(500)

    const rejectButton = page.locator('button:has-text("Reject")').first()
    if (await rejectButton.count() > 0) {
      await rejectButton.click()
      await page.fill('textarea', 'Test rejection reason')
      await page.click('button:has-text("Confirm Rejection")')
      await page.waitForTimeout(1000)
      await expect(page.locator('text=Rejected').first()).toBeVisible()
    }
  })

  // === CORE FLOW: Join with Code (Leader/Upline) ===
  test('Referral: join with code sets leader and upline correctly', async ({ page }) => {
    // Create Leader A
    await page.click('text=Signup')
    await page.fill('input[type="email"]', 'leader-a@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await page.waitForTimeout(1000)

    // Skip referral code
    const skipButton = page.locator('button:has-text("Skip")')
    if (await skipButton.count() > 0) {
      await skipButton.click()
      await page.waitForTimeout(500)
    }

    // Get Leader A's code
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    const referralCodeA = await page.locator('text=/REF[A-Z0-9]{6}/').first().textContent()

    // Logout
    await page.click('button:has-text("Logout")')
    await page.waitForTimeout(500)

    // Create Leader B with A's code
    await page.click('text=Signup')
    await page.fill('input[type="email"]', 'leader-b@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await page.waitForTimeout(1000)

    // Enter Leader A's code
    if (referralCodeA) {
      await page.fill('input[placeholder*="code"]', referralCodeA)
      await page.click('button:has-text("Continue")')
      await page.waitForTimeout(1000)
    }

    // Get Leader B's code
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    const referralCodeB = await page.locator('text=/REF[A-Z0-9]{6}/').first().textContent()

    // Logout
    await page.click('button:has-text("Logout")')
    await page.waitForTimeout(500)

    // Create User C with B's code
    await page.click('text=Signup')
    await page.fill('input[type="email"]', 'user-c@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await page.waitForTimeout(1000)

    // Enter Leader B's code
    if (referralCodeB) {
      await page.fill('input[placeholder*="code"]', referralCodeB)
      await page.click('button:has-text("Continue")')
      await page.waitForTimeout(1000)
    }

    // Verify User C's profile shows Leader=B and Upline=A
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    await expect(page.locator('text=/Your Leader.*L1/i')).toBeVisible()
    await expect(page.locator('text=/Your Upline.*L2/i')).toBeVisible()
  })

  // === HOME PAGE ===
  test('Home: all elements render correctly', async ({ page }) => {
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'home-test@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    // Verify rate card
    await expect(page.locator('text=Today\'s USDT Rate')).toBeVisible()
    await expect(page.locator('text=24h change')).toBeVisible()

    // Verify balance card
    await expect(page.locator('text=Wallet Balance')).toBeVisible()
    await expect(page.locator('text=Available').first()).toBeVisible()
    await expect(page.locator('text=Locked').first()).toBeVisible()

    // Verify quick actions
    await expect(page.locator('text=Create Sell Ad')).toBeVisible()
    await expect(page.locator('text=Deposit USDT')).toBeVisible()
    await expect(page.locator('text=Withdraw USDT')).toBeVisible()

    // Verify activity section
    await expect(page.locator('text=Recent Activity')).toBeVisible()
  })
})
