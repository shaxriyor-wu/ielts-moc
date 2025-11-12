import { test, expect } from '@playwright/test'

test.describe('Test Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'student@demo.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
  })

  test('should start a test', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Click on a test card
    await page.click('text=Start Test')
    await expect(page).toHaveURL(/\/test\/demo-1/)
    
    // Should see test interface
    await expect(page.locator('text=Full IELTS Mock Test')).toBeVisible()
    await expect(page.locator('text=Listening')).toBeVisible()
  })

  test('should navigate between sections', async ({ page }) => {
    await page.goto('/test/demo-1')
    
    // Navigate to Reading section
    await page.click('button:has-text("Reading")')
    await expect(page.locator('text=Passage 1')).toBeVisible()
    
    // Navigate to Writing section
    await page.click('button:has-text("Writing")')
    await expect(page.locator('text=Writing Task 1')).toBeVisible()
  })

  test('should save answers', async ({ page }) => {
    await page.goto('/test/demo-1')
    
    // Answer a question
    const firstInput = page.locator('input[type="text"]').first()
    await firstInput.fill('Test answer')
    
    // Check for autosave indicator
    await expect(page.locator('text=/Saved|Saving/i')).toBeVisible()
  })
})

