import { test, expect } from '@playwright/test'

test.describe('Travel Assistant E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up environment variables for testing
    await page.addInitScript(() => {
      window.localStorage.clear()
    })
  })

  test.describe('Complete Travel Flow', () => {
    test('should complete the full travel planning flow', async ({ page }) => {
      // Navigate to home page
      await page.goto('/')
      
      // Verify home page loads
      await expect(page.getByText('Travel Assistant')).toBeVisible()
      await expect(page.getByText('Where are you headed?')).toBeVisible()
      
      // Fill out trip form
      const destinationInput = page.getByPlaceholder(/Search for your destination/)
      await destinationInput.fill('Tokyo')
      
      // Wait for search results and select Tokyo
      await page.waitForSelector('[role="button"]:has-text("Tokyo")', { timeout: 10000 })
      await page.click('[role="button"]:has-text("Tokyo")')
      
      // Select duration
      await page.selectOption('select:has-text("Select duration")', '7')
      
      // Select trip type
      await page.selectOption('select:has-text("Select trip type")', 'leisure')
      
      // Submit form
      await page.click('button:has-text("Create My Packing List")')
      
      // Should navigate to packing list page
      await expect(page).toHaveURL('/packing-list')
      
      // Verify packing list page loads
      await expect(page.getByText('Your Packing List')).toBeVisible()
      
      // Wait for packing list to load (either AI-generated or fallback)
      await page.waitForSelector('[data-testid="packing-item"], .fallback-list', { timeout: 15000 })
      
      // Verify essential items are highlighted
      const essentialItems = page.locator('.text-orange-500, .bg-orange-50')
      await expect(essentialItems.first()).toBeVisible()
      
      // Test packing functionality
      const firstCheckbox = page.locator('input[type="checkbox"]').first()
      await firstCheckbox.check()
      
      // Verify progress bar updates
      const progressBar = page.locator('[role="progressbar"], .progress-bar')
      await expect(progressBar).toBeVisible()
      
      // Test adding custom item
      const addItemButton = page.getByText('Add Custom Item')
      if (await addItemButton.isVisible()) {
        await addItemButton.click()
        
        await page.fill('input[placeholder*="item name"], input[placeholder*="Item name"]', 'Custom Test Item')
        await page.selectOption('select:has-text("Category")', 'miscellaneous')
        await page.click('button:has-text("Add Item")')
        
        // Verify custom item appears
        await expect(page.getByText('Custom Test Item')).toBeVisible()
      }
    })

    test('should handle errors gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('/api/cities*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        })
      })
      
      await page.goto('/')
      
      const destinationInput = page.getByPlaceholder(/Search for your destination/)
      await destinationInput.fill('Tokyo')
      
      // Should handle error gracefully without crashing
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('/')
    })

    test('should work without API key (fallback mode)', async ({ page }) => {
      // Mock packing list API to simulate missing API key
      await page.route('/api/generate-packing-list', route => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Service configuration error',
            code: 'SERVICE_UNAVAILABLE'
          })
        })
      })
      
      await page.goto('/')
      
      // Fill out trip form
      const destinationInput = page.getByPlaceholder(/Search for your destination/)
      await destinationInput.fill('Tokyo')
      
      // Mock cities API to return results
      await page.route('/api/cities*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            cities: [{
              id: '1',
              name: 'Tokyo',
              country: 'Japan',
              displayName: 'Tokyo, Tokyo, Japan',
              latitude: 35.6895,
              longitude: 139.69171
            }]
          })
        })
      })
      
      await page.waitForSelector('[role="button"]:has-text("Tokyo")')
      await page.click('[role="button"]:has-text("Tokyo")')
      
      await page.selectOption('select:has-text("Select duration")', '7')
      await page.selectOption('select:has-text("Select trip type")', 'leisure')
      
      await page.click('button:has-text("Create My Packing List")')
      
      // Should still navigate to packing list with fallback items
      await expect(page).toHaveURL('/packing-list')
      await expect(page.getByText('Your Packing List')).toBeVisible()
      
      // Should show fallback warning
      await expect(page.getByText(/basic packing list|fallback/i)).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/')
      
      // Verify mobile layout
      await expect(page.getByText('Travel Assistant')).toBeVisible()
      
      // Test mobile form interaction
      const destinationInput = page.getByPlaceholder(/Search for your destination/)
      await destinationInput.fill('Paris')
      
      // Mock API response
      await page.route('/api/cities*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            cities: [{
              id: '1',
              name: 'Paris',
              country: 'France',
              displayName: 'Paris, Île-de-France, France',
              latitude: 48.8566,
              longitude: 2.3522
            }]
          })
        })
      })
      
      await page.waitForSelector('[role="button"]:has-text("Paris")')
      await page.click('[role="button"]:has-text("Paris")')
      
      // Verify dropdown closes after selection on mobile
      await expect(page.locator('[role="button"]:has-text("Paris")')).not.toBeVisible()
      
      await page.selectOption('select:has-text("Select duration")', '3')
      await page.selectOption('select:has-text("Select trip type")', 'city')
      
      // Button should be full width on mobile
      const submitButton = page.getByText('Create My Packing List')
      await expect(submitButton).toHaveClass(/w-full/)
    })

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await page.goto('/')
      
      // Test tablet-specific interactions
      await expect(page.getByText('Travel Assistant')).toBeVisible()
      
      // Form should still be centered and readable
      const form = page.locator('form')
      await expect(form).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should be accessible with keyboard navigation', async ({ page }) => {
      await page.goto('/')
      
      // Tab through form elements
      await page.keyboard.press('Tab')
      await expect(page.getByPlaceholder(/Search for your destination/)).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.locator('select').first()).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.locator('select').nth(1)).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByText('Create My Packing List')).toBeFocused()
    })

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto('/')
      
      // Check for proper form labels
      const destinationInput = page.getByPlaceholder(/Search for your destination/)
      await expect(destinationInput).toHaveAttribute('type', 'text')
      
      // Check for proper button roles
      const submitButton = page.getByText('Create My Packing List')
      await expect(submitButton).toHaveAttribute('type', 'submit')
      
      // Navigate to packing list to test more accessibility features
      await page.route('/api/**', route => {
        if (route.request().url().includes('/cities')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              cities: [{
                id: '1',
                name: 'London',
                country: 'United Kingdom',
                displayName: 'London, England, United Kingdom',
                latitude: 51.5074,
                longitude: -0.1278
              }]
            })
          })
        } else if (route.request().url().includes('/generate-packing-list')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              packingList: [
                {
                  id: '1',
                  name: 'Passport',
                  category: 'travel_documents',
                  essential: true,
                  packed: false,
                  custom: false
                }
              ]
            })
          })
        } else {
          route.continue()
        }
      })
      
      await destinationInput.fill('London')
      await page.waitForSelector('[role="button"]:has-text("London")')
      await page.click('[role="button"]:has-text("London")')
      
      await page.selectOption('select:has-text("Select duration")', '5')
      await page.selectOption('select:has-text("Select trip type")', 'business')
      
      await page.click('button:has-text("Create My Packing List")')
      
      // Check accessibility on packing list page
      await expect(page).toHaveURL('/packing-list')
      
      // Checkboxes should have proper labels
      const checkbox = page.locator('input[type="checkbox"]').first()
      await expect(checkbox).toBeVisible()
      
      // Progress bar should have proper role
      const progressBar = page.locator('[role="progressbar"]')
      if (await progressBar.isVisible()) {
        await expect(progressBar).toHaveAttribute('role', 'progressbar')
      }
    })
  })

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/')
      
      await expect(page.getByText('Travel Assistant')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    test('should handle large packing lists efficiently', async ({ page }) => {
      // Mock a large packing list
      const largePackingList = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        category: 'miscellaneous',
        essential: i < 10,
        packed: false,
        custom: false
      }))
      
      await page.route('/api/generate-packing-list', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ packingList: largePackingList })
        })
      })
      
      await page.route('/api/cities*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            cities: [{
              id: '1',
              name: 'New York',
              country: 'United States',
              displayName: 'New York, New York, United States',
              latitude: 40.7128,
              longitude: -74.0060
            }]
          })
        })
      })
      
      await page.goto('/')
      
      const destinationInput = page.getByPlaceholder(/Search for your destination/)
      await destinationInput.fill('New York')
      
      await page.waitForSelector('[role="button"]:has-text("New York")')
      await page.click('[role="button"]:has-text("New York")')
      
      await page.selectOption('select:has-text("Select duration")', '14')
      await page.selectOption('select:has-text("Select trip type")', 'leisure')
      
      await page.click('button:has-text("Create My Packing List")')
      
      // Should handle large list without performance issues
      await expect(page).toHaveURL('/packing-list')
      await expect(page.getByText('Item 0')).toBeVisible()
      await expect(page.getByText('Item 99')).toBeVisible()
      
      // Test scrolling performance
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      
      await page.evaluate(() => {
        window.scrollTo(0, 0)
      })
      
      // Should still be responsive
      const firstCheckbox = page.locator('input[type="checkbox"]').first()
      await firstCheckbox.check()
      
      // Progress should update quickly
      const progressText = page.locator('text=/1.*100|1.*of.*100/')
      await expect(progressText).toBeVisible()
    })
  })

  test.describe('Data Persistence', () => {
    test('should persist trip data across page refreshes', async ({ page }) => {
      await page.route('/api/cities*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            cities: [{
              id: '1',
              name: 'Berlin',
              country: 'Germany',
              displayName: 'Berlin, Berlin, Germany',
              latitude: 52.5200,
              longitude: 13.4050
            }]
          })
        })
      })
      
      await page.goto('/')
      
      const destinationInput = page.getByPlaceholder(/Search for your destination/)
      await destinationInput.fill('Berlin')
      
      await page.waitForSelector('[role="button"]:has-text("Berlin")')
      await page.click('[role="button"]:has-text("Berlin")')
      
      await page.selectOption('select:has-text("Select duration")', '10')
      await page.selectOption('select:has-text("Select trip type")', 'city')
      
      await page.click('button:has-text("Create My Packing List")')
      
      await expect(page).toHaveURL('/packing-list')
      
      // Refresh the page
      await page.reload()
      
      // Should still be on packing list page with same data
      await expect(page).toHaveURL('/packing-list')
      await expect(page.getByText('Berlin')).toBeVisible()
    })

    test('should persist packing list state', async ({ page }) => {
      // Set up initial state
      await page.goto('/packing-list')
      
      // Mock packing list data
      await page.addInitScript(() => {
        localStorage.setItem('currentTrip', JSON.stringify({
          destinationCountry: 'Italy',
          destinationCity: 'Rome',
          destinationDisplayName: 'Rome, Lazio, Italy',
          duration: 7,
          tripType: 'leisure'
        }))
        
        localStorage.setItem('currentPackingList', JSON.stringify([
          {
            id: '1',
            name: 'Passport',
            category: 'travel_documents',
            essential: true,
            packed: false,
            custom: false
          },
          {
            id: '2',
            name: 'Camera',
            category: 'electronics',
            essential: false,
            packed: true,
            custom: false
          }
        ]))
      })
      
      await page.reload()
      
      // Should load with persisted data
      await expect(page.getByText('Rome')).toBeVisible()
      
      const packedItem = page.locator('input[type="checkbox"]:checked')
      await expect(packedItem).toBeVisible()
      
      // Progress should reflect packed items
      const progressText = page.locator('text=/50%|1.*2/')
      await expect(progressText).toBeVisible()
    })
  })
})