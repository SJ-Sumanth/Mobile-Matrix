import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for visual tests
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('homepage should match visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic elements that might cause flakiness
    await page.addStyleTag({
      content: `
        .cursor-blink { animation: none !important; }
        .loading-spinner { display: none !important; }
        [data-testid="timestamp"] { visibility: hidden !important; }
      `
    });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('chat interface should match visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Mock chat response to ensure consistent content
    await page.route('/api/chat', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Hello! Which phone brands would you like to compare today?',
          sessionId: 'visual-test-session',
          suggestions: ['Apple', 'Samsung', 'Google', 'OnePlus']
        })
      });
    });
    
    const chatInput = page.getByPlaceholder(/Ask me about phones/i);
    await chatInput.fill('Hello');
    await chatInput.press('Enter');
    
    // Wait for response
    await page.waitForSelector('[data-testid="ai-message"]');
    
    // Take screenshot of chat interface
    const chatContainer = page.locator('[data-testid="chat-container"]');
    await expect(chatContainer).toHaveScreenshot('chat-interface.png', {
      animations: 'disabled',
    });
  });

  test('phone comparison should match visual baseline', async ({ page }) => {
    // Mock comparison API
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
                launchDate: '2023-09-15T00:00:00.000Z',
                availability: 'available',
                specifications: {
                  display: { size: '6.1"', resolution: '2556x1179', type: 'Super Retina XDR' },
                  camera: {
                    rear: [{ megapixels: 48, aperture: 'f/1.6', features: ['Night mode'] }],
                    front: { megapixels: 12, aperture: 'f/1.9', features: [] },
                    features: ['Photographic Styles']
                  },
                  performance: { processor: 'A16 Bionic', ram: ['6GB'], storage: ['128GB', '256GB'] },
                  battery: { capacity: 3349, chargingSpeed: 20 }
                },
                pricing: { mrp: 79900, currentPrice: 79900, currency: 'INR' },
                images: []
              },
              {
                id: '2',
                brand: 'Samsung',
                model: 'Galaxy S24',
                launchDate: '2024-01-17T00:00:00.000Z',
                availability: 'available',
                specifications: {
                  display: { size: '6.2"', resolution: '2340x1080', type: 'Dynamic AMOLED' },
                  camera: {
                    rear: [{ megapixels: 50, aperture: 'f/1.8', features: ['Night mode'] }],
                    front: { megapixels: 12, aperture: 'f/2.2', features: [] },
                    features: ['Pro modes']
                  },
                  performance: { processor: 'Snapdragon 8 Gen 3', ram: ['8GB'], storage: ['128GB', '256GB'] },
                  battery: { capacity: 4000, chargingSpeed: 25 }
                },
                pricing: { mrp: 74999, currentPrice: 74999, currency: 'INR' },
                images: []
              }
            ],
            categories: [
              {
                name: 'Display',
                phone1Score: 8.5,
                phone2Score: 8.0,
                winner: 'phone1',
                details: 'iPhone 15 has better display quality with Super Retina XDR technology'
              },
              {
                name: 'Camera',
                phone1Score: 9.0,
                phone2Score: 8.5,
                winner: 'phone1',
                details: 'iPhone 15 excels in video recording and computational photography'
              },
              {
                name: 'Performance',
                phone1Score: 9.2,
                phone2Score: 9.0,
                winner: 'phone1',
                details: 'A16 Bionic provides slightly better performance than Snapdragon 8 Gen 3'
              },
              {
                name: 'Battery',
                phone1Score: 7.5,
                phone2Score: 8.5,
                winner: 'phone2',
                details: 'Galaxy S24 has larger battery capacity and faster charging'
              }
            ],
            insights: [
              'iPhone 15 excels in camera and display quality',
              'Galaxy S24 offers better battery life and value for money',
              'Both phones provide flagship-level performance'
            ],
            recommendations: [
              'Choose iPhone 15 for iOS ecosystem and camera quality',
              'Choose Galaxy S24 for Android flexibility and battery life'
            ],
            generatedAt: '2024-01-01T12:00:00.000Z'
          }
        })
      });
    });
    
    await page.goto('/comparison?phone1=Apple-iPhone-15&phone2=Samsung-Galaxy-S24');
    
    // Wait for comparison to load
    await page.waitForSelector('[data-testid="comparison-container"]');
    
    // Take screenshot of comparison
    await expect(page).toHaveScreenshot('phone-comparison-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Take screenshot of comparison cards only
    const comparisonGrid = page.locator('[data-testid="comparison-grid"]');
    await expect(comparisonGrid).toHaveScreenshot('comparison-cards.png', {
      animations: 'disabled',
    });
  });

  test('mobile responsive design should match baseline', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('tablet responsive design should match baseline', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('dark mode should match visual baseline', async ({ page }) => {
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('high contrast mode should match baseline', async ({ page }) => {
    // Enable high contrast mode
    await page.emulateMedia({ 
      colorScheme: 'dark',
      forcedColors: 'active'
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-high-contrast.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('loading states should match visual baseline', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/chat', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Response after delay',
            sessionId: 'test-session'
          })
        });
      }, 5000);
    });
    
    await page.goto('/');
    
    const chatInput = page.getByPlaceholder(/Ask me about phones/i);
    await chatInput.fill('Test message');
    await chatInput.press('Enter');
    
    // Wait for loading state to appear
    await page.waitForSelector('[data-testid="loading-indicator"]');
    
    // Take screenshot of loading state
    const chatContainer = page.locator('[data-testid="chat-container"]');
    await expect(chatContainer).toHaveScreenshot('chat-loading-state.png', {
      animations: 'disabled',
    });
  });

  test('error states should match visual baseline', async ({ page }) => {
    // Mock API error
    await page.route('/api/chat', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.goto('/');
    
    const chatInput = page.getByPlaceholder(/Ask me about phones/i);
    await chatInput.fill('Test message');
    await chatInput.press('Enter');
    
    // Wait for error message
    await page.waitForSelector('[data-testid="error-message"]');
    
    // Take screenshot of error state
    const chatContainer = page.locator('[data-testid="chat-container"]');
    await expect(chatContainer).toHaveScreenshot('chat-error-state.png', {
      animations: 'disabled',
    });
  });

  test('suggestion chips should match visual baseline', async ({ page }) => {
    await page.route('/api/chat', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Which phone brand would you like to compare?',
          sessionId: 'test-session',
          suggestions: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Realme']
        })
      });
    });
    
    await page.goto('/');
    
    const chatInput = page.getByPlaceholder(/Ask me about phones/i);
    await chatInput.fill('Hello');
    await chatInput.press('Enter');
    
    // Wait for suggestions to appear
    await page.waitForSelector('[data-testid="suggestion-chips"]');
    
    // Take screenshot of suggestions
    const suggestionsContainer = page.locator('[data-testid="suggestion-chips"]');
    await expect(suggestionsContainer).toHaveScreenshot('suggestion-chips.png', {
      animations: 'disabled',
    });
  });

  test('comparison categories should match visual baseline', async ({ page }) => {
    await page.route('/api/compare', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          comparison: {
            phones: [
              { id: '1', brand: 'Apple', model: 'iPhone 15' },
              { id: '2', brand: 'Samsung', model: 'Galaxy S24' }
            ],
            categories: [
              {
                name: 'Display',
                phone1Score: 8.5,
                phone2Score: 8.0,
                winner: 'phone1',
                details: 'iPhone has better display quality'
              },
              {
                name: 'Camera',
                phone1Score: 7.5,
                phone2Score: 8.5,
                winner: 'phone2',
                details: 'Samsung has better camera features'
              }
            ],
            insights: [],
            recommendations: [],
            generatedAt: new Date().toISOString()
          }
        })
      });
    });
    
    await page.goto('/comparison?phone1=Apple-iPhone-15&phone2=Samsung-Galaxy-S24');
    
    // Wait for categories to load
    await page.waitForSelector('[data-testid="comparison-categories"]');
    
    // Take screenshot of categories
    const categoriesContainer = page.locator('[data-testid="comparison-categories"]');
    await expect(categoriesContainer).toHaveScreenshot('comparison-categories.png', {
      animations: 'disabled',
    });
  });
});