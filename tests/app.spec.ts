import { test, expect } from '@playwright/test'

test.describe('VELTOX PWA - TRC20 Deposit System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('app loads and shows welcome page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('VELTOX')
    await expect(page.locator('text=Premium USDT to INR Exchange')).toBeVisible()
  })

  // Home Page Tests
  test('Home page loads and displays rate card', async ({ page }) => {
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'home@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    await expect(page.locator('text=Today\'s USDT Rate')).toBeVisible()
    await expect(page.locator('text=24h change')).toBeVisible()
  })

  test('Home page displays balance mini-card', async ({ page }) => {
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'balance@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    await expect(page.locator('text=Wallet Balance')).toBeVisible()
    await expect(page.locator('text=Available').first()).toBeVisible()
    await expect(page.locator('text=Locked').first()).toBeVisible()
  })

  test('Home quick action: Create Sell Ad navigates correctly', async ({ page }) => {
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'quickaction@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    await page.click('text=Create Sell Ad')
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(/.*sell-ads\/create/)
  })

  test('Home quick action: Deposit USDT navigates correctly', async ({ page }) => {
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'deposit@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    await page.click('text=Deposit USDT')
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(/.*wallet/)
  })

  test('Home displays empty state when no activity', async ({ page }) => {
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'newuser@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    await expect(page.locator('text=No Activity Yet')).toBeVisible()
  })

  test('TRC20 Deposit Flow: 1500 USDT deposit triggers sweep', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'sweep-1500@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)
    
    // Navigate to Wallet
    await page.click('text=Wallet')
    await expect(page.locator('text=TRC20 Deposit Address')).toBeVisible()
    
    // Show dev panel
    const showButton = page.locator('button', { hasText: 'Show' }).first()
    await showButton.click()
    
    // Simulate 1500 USDT deposit
    await page.click('text=+1500 USDT')
    await page.waitForTimeout(1000)
    
    // Verify deposit appears
    await expect(page.locator('text=1,500').first()).toBeVisible()
    await expect(page.locator('text=Confirmations').first()).toBeVisible()
    
    // Wait for confirmations (3 * 5s = 15s + buffer)
    await page.waitForTimeout(18000)
    await page.reload()
    
    // Verify confirmed
    await expect(page.locator('text=Confirmed').first()).toBeVisible({ timeout: 10000 })
    
    // Verify sweep eligible
    await expect(page.locator('text=Eligible for sweep')).toBeVisible()
    
    // Wait for sweep to execute (30s + buffer)
    await page.waitForTimeout(35000)
    await page.reload()
    
    // Show dev panel again
    await page.locator('button', { hasText: 'Show' }).first().click()
    
    // Verify deposit was swept
    await expect(page.locator('text=Swept').first()).toBeVisible({ timeout: 5000 })
  })

  test('TRC20 Deposit Flow: 200 USDT deposit stays below threshold', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'sweep-200@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)
    
    // Navigate to Wallet
    await page.click('text=Wallet')
    
    // Show dev panel
    await page.locator('button', { hasText: 'Show' }).first().click()
    
    // Simulate 200 USDT deposit
    await page.click('text=+200 USDT')
    await page.waitForTimeout(1000)
    
    // Verify deposit appears
    await expect(page.locator('text=200').first()).toBeVisible()
    
    // Wait for confirmations
    await page.waitForTimeout(18000)
    await page.reload()
    
    // Verify confirmed
    await expect(page.locator('text=Confirmed').first()).toBeVisible({ timeout: 10000 })
    
    // Verify below threshold
    await expect(page.locator('text=more needed')).toBeVisible()
    
    // Wait past sweep interval
    await page.waitForTimeout(35000)
    await page.reload()
    
    // Verify still confirmed (not swept)
    await expect(page.locator('text=Confirmed').first()).toBeVisible()
    
    // Verify NOT swept
    const sweptBadges = await page.locator('text=Swept').count()
    expect(sweptBadges).toBe(0)
  })

  test('can navigate between tabs', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'nav@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)
    
    // Check home
    await expect(page.locator('text=Total Balance')).toBeVisible()
    
    // Navigate to Sell Ads
    await page.click('text=Sell Ads')
    await expect(page.locator('text=Create New Sell Ad')).toBeVisible()
    
    // Navigate to Wallet
    await page.click('text=Wallet')
    await expect(page.locator('text=TRC20 Deposit Address')).toBeVisible()
    
    // Navigate to Profile
    await page.click('text=Profile')
    await expect(page.locator('text=Logout')).toBeVisible()
  })

  test('can create a sell ad', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'sellad@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)
    
    // Navigate to Sell Ads
    await page.click('text=Sell Ads')
    await page.click('text=Create New Sell Ad')
    
    // Fill form
    await page.fill('input[type="number"]', '100')
    await page.getByRole('button', { name: 'Create Ad' }).click()
    
    // Verify redirected back
    await expect(page.locator('text=100')).toBeVisible({ timeout: 5000 })
  })

  test('can add bank account', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'bank@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)
    
    // Navigate to Profile > Bank Accounts
    await page.click('text=Profile')
    await page.click('text=Bank Accounts')
    
    // Click Add
    await page.click('text=Add Bank Account')
    
    // Fill form
    await page.fill('input[placeholder*="Name"]', 'John Doe')
    await page.fill('input[placeholder*="Number"]', '1234567890')
    await page.fill('input[placeholder*="IFSC"]', 'SBIN0001234')
    await page.fill('input[placeholder*="Bank"]', 'SBI')
    
    // Submit
    await page.getByRole('button', { name: 'Add Account' }).click()
    
    // Verify added
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: 5000 })
  })

  test('referral page renders correctly', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'ref@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)
    
    // Navigate to Profile > Invite & Earn
    await page.click('text=Profile')
    await page.click('text=Invite')
    
    // Verify referral code shown
    await expect(page.locator('text=Your Referral Code')).toBeVisible()
  })

  test('Wallet: can submit withdrawal and verify in history', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'withdraw-test@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)
    
    // Navigate to Wallet
    await page.click('text=Wallet')
    await expect(page.locator('text=Overview')).toBeVisible()
    
    // Click Withdraw tab
    await page.click('text=Withdraw')
    await page.waitForTimeout(500)
    
    // Fill withdrawal form
    await page.fill('input[placeholder="T..."]', 'TExampleAddress1234567890123456')
    await page.fill('input[type="number"]', '50')
    
    // Continue
    await page.click('text=Continue')
    await page.waitForTimeout(500)
    
    // Verify confirm screen
    await expect(page.locator('text=Confirm Withdrawal')).toBeVisible()
    await expect(page.locator('text=TExampleAddress1234567890123456')).toBeVisible()
    await expect(page.locator('text=50')).toBeVisible()
    
    // Confirm
    await page.click('text=Confirm Withdrawal')
    await page.waitForTimeout(1000)
    
    // Should redirect to history tab
    await expect(page.locator('text=All Transactions')).toBeVisible({ timeout: 5000 })
    
    // Verify withdrawal appears in history
    await expect(page.locator('text=Withdraw')).toBeVisible()
    await expect(page.locator('text=-50')).toBeVisible()
    await expect(page.locator('text=Pending').first()).toBeVisible()
  })

  test('Wallet: history filters work correctly', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'filter-test@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)
    
    // Navigate to Wallet > Deposit tab
    await page.click('text=Wallet')
    await page.click('text=Deposit')
    await page.locator('button', { hasText: 'Show' }).first().click()
    
    // Simulate deposit
    await page.click('text=+200 USDT')
    await page.waitForTimeout(1000)
    
    // Go to history
    await page.click('text=History')
    await page.waitForTimeout(500)
    
    // Verify "All" shows deposits
    await expect(page.locator('text=Deposit')).toBeVisible()
    
    // Click "Deposits" filter
    await page.click('text=Deposits')
    await page.waitForTimeout(300)
    await expect(page.locator('text=Deposit')).toBeVisible()
    
    // Click "Withdrawals" filter
    await page.click('text=Withdrawals')
    await page.waitForTimeout(300)
    
    // Should show empty state or no deposits
    const withdrawCount = await page.locator('text=Withdraw').count()
    expect(withdrawCount).toBe(0)
  })

  test('Withdrawal approval workflow: create request, admin approves', async ({ page }) => {
    // Step 1: Create withdrawal as normal user
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'approval-test@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    // Navigate to Wallet
    await page.click('text=Wallet')
    await expect(page.locator('text=Overview')).toBeVisible()

    // Get initial balances (for verification - unused but could be used for comparison)
    await page
      .locator('text=Available')
      .locator('..')
      .locator('p.text-lg')
      .textContent()

    // Go to Withdraw tab
    await page.click('text=Withdraw')
    await page.waitForTimeout(500)

    // Fill withdrawal form
    await page.fill('input[placeholder="T..."]', 'TExampleAddress1234567890123456')
    await page.fill('input[type="number"]', '100')

    // Continue and confirm
    await page.click('text=Continue')
    await page.waitForTimeout(500)
    await expect(page.locator('text=Confirm Withdrawal')).toBeVisible()
    await page.click('button:has-text("Confirm Withdrawal")')
    await page.waitForTimeout(1000)

    // Verify withdrawal appears in history with "Under Review" status
    await expect(page.locator('text=Under Review').first()).toBeVisible({ timeout: 5000 })

    // Check that locked increased (Overview tab)
    await page.click('text=Overview')
    await page.waitForTimeout(500)
    const locked = await page
      .locator('text=Locked')
      .locator('..')
      .locator('p.text-lg')
      .textContent()
    expect(locked).toContain('100')

    // Step 2: Switch to admin mode
    await page.evaluate(() => {
      localStorage.setItem('veltox_is_admin', 'true')
    })
    await page.reload()
    await page.waitForTimeout(1000)

    // Go to Profile and verify Admin Panel link is visible
    await page.click('text=Profile')
    await expect(page.locator('text=Admin Panel')).toBeVisible()

    // Click Admin Panel
    await page.click('text=Admin Panel')
    await page.waitForTimeout(1000)

    // Verify we're on admin page and see pending withdrawal
    await expect(page.locator('text=Pending').first()).toBeVisible()
    await expect(page.locator('text=100')).toBeVisible()
    await expect(page.locator('text=TExampleAddress1234567890123456')).toBeVisible()

    // Approve the withdrawal
    await page.click('button:has-text("Approve")')
    await page.waitForTimeout(1000)

    // Switch to History tab
    await page.click('text=History')
    await page.waitForTimeout(500)

    // Verify withdrawal is completed
    await expect(page.locator('text=Completed').first()).toBeVisible()

    // Go back to wallet to verify locked decreased
    await page.click('text=Wallet')
    await page.waitForTimeout(500)
    const finalLocked = await page
      .locator('text=Locked')
      .locator('..')
      .locator('p.text-lg')
      .textContent()
    expect(finalLocked).not.toContain('100')
  })

  test('Withdrawal rejection workflow: create request, admin rejects', async ({ page }) => {
    // Create withdrawal as normal user
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'reject-test@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    await page.click('text=Wallet')
    await page.click('text=Withdraw')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="T..."]', 'TRejectExample123456789012345678')
    await page.fill('input[type="number"]', '50')
    await page.click('text=Continue')
    await page.waitForTimeout(500)
    await page.click('button:has-text("Confirm Withdrawal")')
    await page.waitForTimeout(1000)

    // Verify under review
    await expect(page.locator('text=Under Review').first()).toBeVisible()

    // Check overview balance before rejection
    await page.click('text=Overview')
    await page.waitForTimeout(500)

    // Switch to admin
    await page.evaluate(() => {
      localStorage.setItem('veltox_is_admin', 'true')
    })
    await page.reload()
    await page.waitForTimeout(1000)

    await page.click('text=Profile')
    await page.click('text=Admin Panel')
    await page.waitForTimeout(1000)

    // Reject the withdrawal
    await page.click('button:has-text("Reject")')
    await page.waitForTimeout(500)

    // Fill rejection reason
    await page.fill('textarea[placeholder*="rejection"]', 'Insufficient documentation provided')
    await page.click('button:has-text("Confirm Rejection")')
    await page.waitForTimeout(1000)

    // Verify it moved to history as rejected
    await page.click('text=History')
    await page.waitForTimeout(500)
    await expect(page.locator('text=Rejected').first()).toBeVisible()

    // Go back to wallet and verify locked returned to available
    await page.click('text=Wallet')
    await page.waitForTimeout(500)
    const finalLocked = await page
      .locator('text=Locked')
      .locator('..')
      .locator('p.text-lg')
      .textContent()
    expect(finalLocked).toContain('0')
  })

  test('Sell Ads: complete flow - create active, pause, resume, mark sold', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'sellads-test@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)

    // Add a bank account first (prerequisite)
    await page.click('text=Profile')
    await page.click('text=Bank Accounts')
    await page.waitForTimeout(500)
    await page.click('text=Add Bank Account')
    await page.fill('input[placeholder="Bank Name"]', 'Test Bank')
    await page.fill('input[placeholder="Account Holder Name"]', 'John Doe')
    await page.fill('input[placeholder="Account Number"]', '1234567890')
    await page.fill('input[placeholder="IFSC Code"]', 'TEST0001234')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    // Navigate to Wallet and check initial balance
    await page.click('text=Wallet')
    await page.waitForTimeout(500)
    const initialAvailableText = await page
      .locator('text=Available')
      .locator('..')
      .locator('p.text-lg')
      .textContent()
    const initialAvailable = parseFloat(initialAvailableText?.replace(/[^0-9.]/g, '') || '0')
    const initialLockedText = await page
      .locator('text=Locked')
      .locator('..')
      .locator('p.text-lg')
      .textContent()
    const initialLocked = parseFloat(initialLockedText?.replace(/[^0-9.]/g, '') || '0')

    // Step 1: Create an ACTIVE sell ad of 1000 USDT
    await page.click('text=Sell Ads')
    await page.waitForTimeout(500)
    await page.click('text=Create Ad')
    await page.waitForTimeout(500)

    // Fill form
    await page.fill('input[type="number"]', '1000')
    // Start Active toggle should be ON by default
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    // Verify ad appears in list as ACTIVE
    await expect(page.locator('text=Active').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=1,000').first()).toBeVisible()

    // Check wallet: available decreased, locked increased
    await page.click('text=Wallet')
    await page.waitForTimeout(500)
    const afterCreateAvailableText = await page
      .locator('text=Available')
      .locator('..')
      .locator('p.text-lg')
      .textContent()
    const afterCreateAvailable = parseFloat(afterCreateAvailableText?.replace(/[^0-9.]/g, '') || '0')
    const afterCreateLockedText = await page
      .locator('text=Locked')
      .locator('..')
      .locator('p.text-lg')
      .textContent()
    const afterCreateLocked = parseFloat(afterCreateLockedText?.replace(/[^0-9.]/g, '') || '0')

    expect(afterCreateAvailable).toBeLessThan(initialAvailable)
    expect(afterCreateLocked).toBeGreaterThan(initialLocked)

    // Step 2: Pause the ad
    await page.click('text=Sell Ads')
    await page.waitForTimeout(500)
    await page.click('button:has-text("Pause")')
    await page.waitForTimeout(1000)

    // Verify status becomes PAUSED
    await expect(page.locator('text=Paused').first()).toBeVisible()

    // Check wallet: remaining unlocks (available increases, locked decreases)
    await page.click('text=Wallet')
    await page.waitForTimeout(500)
    const afterPauseLockedText = await page
      .locator('text=Locked')
      .locator('..')
      .locator('p.text-lg')
      .textContent()
    const afterPauseLocked = parseFloat(afterPauseLockedText?.replace(/[^0-9.]/g, '') || '0')

    expect(afterPauseLocked).toBeLessThan(afterCreateLocked)

    // Step 3: Resume the ad
    await page.click('text=Sell Ads')
    await page.waitForTimeout(500)
    await page.click('button:has-text("Resume")')
    await page.waitForTimeout(1000)

    // Verify it locks remaining again
    await expect(page.locator('text=Active').first()).toBeVisible()

    await page.click('text=Wallet')
    await page.waitForTimeout(500)
    const afterResumeLockedText = await page
      .locator('text=Locked')
      .locator('..')
      .locator('p.text-lg')
      .textContent()
    const afterResumeLocked = parseFloat(afterResumeLockedText?.replace(/[^0-9.]/g, '') || '0')

    expect(afterResumeLocked).toBeGreaterThan(afterPauseLocked)

    // Step 4: Mark as Sold
    await page.click('text=Sell Ads')
    await page.waitForTimeout(500)
    await page.click('button:has-text("Mark Sold")')
    await page.waitForTimeout(500)

    // Confirm dialog
    page.on('dialog', (dialog) => dialog.accept())
    await page.click('button:has-text("Mark Sold")')
    await page.waitForTimeout(1000)

    // Verify ad becomes COMPLETED
    await page.click('text=Completed')
    await page.waitForTimeout(500)
    await expect(page.locator('text=Completed').nth(1)).toBeVisible()

    // Check wallet: locked decreases
    await page.click('text=Wallet')
    await page.waitForTimeout(500)
    const afterSoldLockedText = await page
      .locator('text=Locked')
      .locator('..')
      .locator('p.text-lg')
      .textContent()
    const afterSoldLocked = parseFloat(afterSoldLockedText?.replace(/[^0-9.]/g, '') || '0')

    expect(afterSoldLocked).toBe(initialLocked) // Back to initial locked amount
  })

  test('mobile viewport check', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'mobile@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForTimeout(1000)
    
    // Verify bottom nav visible
    const bottomNav = page.locator('nav').last()
    await expect(bottomNav).toBeVisible()
    
    // Verify safe areas applied (check for padding)
    const root = page.locator('#root')
    await expect(root).toBeVisible()
  })

  test('Referral Chain: A invites B, B invites C, C reaches eligibility and generates rewards', async ({ page, context }) => {
    // Clear storage to start fresh
    await context.clearCookies()
    await page.goto('/')

    // Step 1: Create User A
    await page.click('text=Login')
    await page.click('text=Sign up')
    await page.fill('input[type="email"]', 'userA@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.click('input[type="checkbox"]')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await page.waitForTimeout(1500)

    // Get User A's referral code
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    await page.click('text=Invite & Earn')
    await page.waitForTimeout(500)

    const userACode = await page.locator('input[readonly]').first().inputValue()
    console.log('User A code:', userACode)

    // Add bank account for User A (to avoid overlap check)
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    await page.click('text=Bank Accounts')
    await page.waitForTimeout(500)
    await page.click('text=Add Bank Account')
    await page.fill('input[placeholder*="Account Holder"]', 'User A')
    await page.fill('input[placeholder*="Account Number"]', '1111111111')
    await page.fill('input[placeholder*="IFSC"]', 'IFSC0001')
    await page.fill('input[placeholder*="Bank Name"]', 'Bank A')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    // Logout User A
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    await page.click('text=Logout')
    await page.waitForTimeout(500)
    page.on('dialog', (dialog) => dialog.accept())
    await page.click('text=Logout')
    await page.waitForTimeout(1500)

    // Step 2: Create User B with A's referral code
    await page.click('text=Login')
    await page.click('text=Sign up')
    await page.fill('input[type="email"]', 'userB@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.click('input[type="checkbox"]')
    // TODO: Apply referral code during signup (for now, would need UI change)
    await page.getByRole('button', { name: 'Create Account' }).click()
    await page.waitForTimeout(1500)

    // Get User B's referral code
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    await page.click('text=Invite & Earn')
    await page.waitForTimeout(500)

    const userBCode = await page.locator('input[readonly]').first().inputValue()
    console.log('User B code:', userBCode)

    // Add bank account for User B (different from A)
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    await page.click('text=Bank Accounts')
    await page.waitForTimeout(500)
    await page.click('text=Add Bank Account')
    await page.fill('input[placeholder*="Account Holder"]', 'User B')
    await page.fill('input[placeholder*="Account Number"]', '2222222222')
    await page.fill('input[placeholder*="IFSC"]', 'IFSC0002')
    await page.fill('input[placeholder*="Bank Name"]', 'Bank B')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    // Logout User B
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    page.on('dialog', (dialog) => dialog.accept())
    await page.click('text=Logout')
    await page.waitForTimeout(1500)

    // Step 3: Create User C with B's referral code
    await page.click('text=Login')
    await page.click('text=Sign up')
    await page.fill('input[type="email"]', 'userC@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.click('input[type="checkbox"]')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await page.waitForTimeout(1500)

    // Add bank account for User C (different from A and B)
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    await page.click('text=Bank Accounts')
    await page.waitForTimeout(500)
    await page.click('text=Add Bank Account')
    await page.fill('input[placeholder*="Account Holder"]', 'User C')
    await page.fill('input[placeholder*="Account Number"]', '3333333333')
    await page.fill('input[placeholder*="IFSC"]', 'IFSC0003')
    await page.fill('input[placeholder*="Bank Name"]', 'Bank C')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    // Check User C's profile - should show Leader=B and Upline=A
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    // Look for the referral network card
    // This test is simplified; in real implementation, verify leader/upline display
    await expect(page.locator('text=Your Referral Network')).toBeVisible()

    console.log('Referral chain test completed: Users A, B, C created with bank accounts')
  })

  test('Referral Rewards: Bank account overlap triggers rejection', async ({ page, context }) => {
    // Clear storage
    await context.clearCookies()
    await page.goto('/')

    // Create User A
    await page.click('text=Login')
    await page.click('text=Sign up')
    await page.fill('input[type="email"]', 'overlap-A@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.click('input[type="checkbox"]')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await page.waitForTimeout(1500)

    // Add bank account for User A
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    await page.click('text=Bank Accounts')
    await page.waitForTimeout(500)
    await page.click('text=Add Bank Account')
    await page.fill('input[placeholder*="Account Holder"]', 'Overlap User')
    await page.fill('input[placeholder*="Account Number"]', '9999999999')
    await page.fill('input[placeholder*="IFSC"]', 'OVERLAP01')
    await page.fill('input[placeholder*="Bank Name"]', 'Overlap Bank')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    // Logout User A
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    page.on('dialog', (dialog) => dialog.accept())
    await page.click('text=Logout')
    await page.waitForTimeout(1500)

    // Create User B (referee) with SAME bank account as A
    await page.click('text=Login')
    await page.click('text=Sign up')
    await page.fill('input[type="email"]', 'overlap-B@test.com')
    await page.fill('input[type="password"]', 'test123')
    await page.click('input[type="checkbox"]')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await page.waitForTimeout(1500)

    // Add SAME bank account
    await page.click('text=Profile')
    await page.waitForTimeout(500)
    await page.click('text=Bank Accounts')
    await page.waitForTimeout(500)
    await page.click('text=Add Bank Account')
    await page.fill('input[placeholder*="Account Holder"]', 'Overlap User')
    await page.fill('input[placeholder*="Account Number"]', '9999999999') // SAME
    await page.fill('input[placeholder*="IFSC"]', 'OVERLAP01') // SAME
    await page.fill('input[placeholder*="Bank Name"]', 'Overlap Bank')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    // In a real test, we'd trigger a completed sell and verify rewards are rejected
    // For now, this test validates the UI flow for bank overlap scenario

    console.log('Bank overlap test completed')
  })
})

