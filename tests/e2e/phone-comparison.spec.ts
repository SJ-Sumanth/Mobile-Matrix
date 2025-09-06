import { test, expect } from '@playwright/test';

test.describe('Phone Comparison E2E Tests', () => {
  test('should complete full phone comparison flow', async ({ page }) => {
    await page.goto('/');
    
    const chatInput = page.getByPlaceholder(/Ask me about phones/i);
    
    // Step 1: Start conversation
    await chatInput.fill('I want to compare phones');
    await chatInput.press('Enter');
    
    // Wait for brand selection prompt
    await expect(page.getByText(/which phone brands/i)).toBeVisible({ timeout: 10000 });
    
    // Step 2: Select first brand
    await chatInput.fill('Apple');
    await chatInput.press('Enter');
    
    // Wait for model selection
    await expect(page.getByText(/which iPhone model/i)).toBeVisible({ timeout: 10000 });
    
    // Step 3: Select first phone model
    await chatInput.fill('iPhone 15');
    await chatInput.press('Enter');
    
    // Wait for second brand prompt
    await expect(page.getByText(/second phone brand/i)).toBeVisible({ timeout: 10000 });
    
    // Step 4: Select second brand
    await chatInput.fill('Samsung');
    await chatInput.press('Enter');
    
    // Wait for second model selection
    await expect(page.getByText(/which Samsung model/i)).toBeVisible({ timeout: 10000 });
    
    // Step 5: Select second phone model
    await chatInput.fill('Galaxy S24');
    await chatInput.press('Enter');
    
    // Wait for comparison to be generated and displayed
    await expect(page.getByText('iPhone 15')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Galaxy S24')).toBeVisible();
    
    // Check comparison elements
    await expect(page.getByText(/Display/i)).toBeVisible();
    await expect(page.getByText(/Camera/i)).toBeVisible();
    await expect(page.getByText(/Performance/i)).toBeVisible();
    await expect(page.getByText(/Battery/i)).toBeVisible();
  });

  test('should handle phone suggestions', async ({ page }) => {
    await page.goto('/');
    
    const chatInput = page.getByPlaceholder(/Ask me about phones/i);
    
    // Start conversation
    await chatInput.fill('Compare phones');
    await chatInput.press('Enter');
    
    // Wait for suggestions to appear
    await expect(page.getByText(/which phone brands/i)).toBeVisible({ timeout: 10000 });
    
    // Check if suggestion chips are displayed
    const appleSuggestion = page.getByText('Apple').first();
    const samsungSuggestion = page.getByText('Samsung').first();
    
    await expect(appleSuggestion).toBeVisible();
    await expect(samsungSuggestion).toBeVisible();
    
    // Click on a suggestion
    await appleSuggestion.click();
    
    // Check that the suggestion was processed
    await expect(page.getByText(/which iPhone model/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display detailed phone specifications', async ({ page }) => {
    // Mock API to return comparison data
    await page.route('/api/compare', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          comparison: {
            phones: [
              {
                id: '1',
                brand: 'Apple',
                model: 'iPhone 15',
                specifications: {
                  display: { size: '6.1"', resolution: '2556x1179', type: 'Super Retina XDR' },
                  camera: { rear: [{ megapixels: 48 }], front: { megapixels: 12 } },
                  performance: { processor: 'A16 Bionic', ram: ['6GB'] },
                  battery: { capacity: 3349, chargingSpeed: 20 }
                },
                pricing: { currentPrice: 79900, currency: 'INR' }
              },
              {
                id: '2',
                brand: 'Samsung',
                model: 'Galaxy S24',
                specifications: {
                  display: { size: '6.2"', resolution: '2340x1080', type: 'Dynamic AMOLED' },
                  camera: { rear: [{ megapixels: 50 }], front: { megapixels: 12 } },
                  performance: { processor: 'Snapdragon 8 Gen 3', ram: ['8GB'] },
                  battery: { capacity: 4000, chargingSpeed: 25 }
                },
                pricing: { currentPrice: 74999, currency: 'INR' }
              }
            ],
            categories: [
              {
                name: 'Display',
                phone1Score: 8.5,
                phone2Score: 8.0,
                winner: 'phone1',
                details: 'iPhone has better display quality'
              }
            ],
            insights: ['Both phones offer excellent performance'],
            recommendations: ['Choose based on ecosystem preference'],
            generatedAt: new Date().toISOString()
          }
        })
      });
    });
    
    await page.goto('/comparison?phone1=Apple-iPhone-15&phone2=Samsung-Galaxy-S24');
    
    // Check phone names
    await expect(page.getByText('iPhone 15')).toBeVisible();
    await expect(page.getByText('Galaxy S24')).toBeVisible();
    
    // Check specifications
    await expect(page.getByText('6.1"')).toBeVisible();
    await expect(page.getByText('6.2"')).toBeVisible();
    await expect(page.getByText('A16 Bionic')).toBeVisible();
    await expect(page.getByText('Snapdragon 8 Gen 3')).toBeVisible();
    
    // Check pricing
    await expect(page.getByText('₹79,900')).toBeVisible();
    await expect(page.getByText('₹74,999')).toBeVisible();
    
    // Check comparison insights
    await expect(page.getByText('Both phones offer excellent performance')).toBeVisible();
  });

  test('should handle comparison sharing', async ({ page }) => {
    await page.goto('/comparison?phone1=Apple-iPhone-15&phone2=Samsung-Galaxy-S24');
    
    // Wait for comparison to load
    await expect(page.getByText('iPhone 15')).toBeVisible();
    
    // Click share button
    const shareButton = page.getByRole('button', { name: /share/i });
    await shareButton.click();
    
    // Check share options
    await expect(page.getByText(/Share Comparison/i)).toBeVisible();
    await expect(page.getByText(/Copy Link/i)).toBeVisible();
    
    // Test copy link functionality
    const copyLinkButton = page.getByText(/Copy Link/i);
    await copyLinkButton.click();
    
    // Check for success message
    await expect(page.getByText(/Link copied/i)).toBeVisible();
  });

  test('should handle phone not found error', async ({ page }) => {
    // Mock API to return 404
    await page.route('/api/compare', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Phone not found: Apple iPhone 99' })
      });
    });
    
    await page.goto('/comparison?phone1=Apple-iPhone-99&phone2=Samsung-Galaxy-S24');
    
    // Check error message
    await expect(page.getByText(/Phone not found/i)).toBeVisible();
    await expect(page.getByText(/iPhone 99/i)).toBeVisible();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    await page.goto('/comparison?phone1=Apple-iPhone-15&phone2=Samsung-Galaxy-S24');
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByText('iPhone 15')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('iPhone 15')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('iPhone 15')).toBeVisible();
    
    // Check that comparison cards stack vertically on mobile
    const comparisonContainer = page.locator('[data-testid="comparison-grid"]');
    await expect(comparisonContainer).toHaveCSS('flex-direction', 'column');
  });

  test('should handle new comparison from existing comparison page', async ({ page }) => {
    await page.goto('/comparison?phone1=Apple-iPhone-15&phone2=Samsung-Galaxy-S24');
    
    // Wait for comparison to load
    await expect(page.getByText('iPhone 15')).toBeVisible();
    
    // Click new comparison button
    const newComparisonButton = page.getByRole('button', { name: /new comparison/i });
    await newComparisonButton.click();
    
    // Should navigate back to homepage
    await expect(page).toHaveURL('/');
    await expect(page.getByPlaceholder(/Ask me about phones/i)).toBeVisible();
  });

  test('should display loading state during comparison generation', async ({ page }) => {
    // Mock API with delay
    await page.route('/api/compare', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            comparison: {
              phones: [],
              categories: [],
              insights: [],
              recommendations: [],
              generatedAt: new Date().toISOString()
            }
          })
        });
      }, 2000);
    });
    
    await page.goto('/comparison?phone1=Apple-iPhone-15&phone2=Samsung-Galaxy-S24');
    
    // Check loading state
    await expect(page.getByText(/Generating comparison/i)).toBeVisible();
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Wait for comparison to load
    await expect(page.getByText(/Generating comparison/i)).not.toBeVisible({ timeout: 5000 });
  });
});