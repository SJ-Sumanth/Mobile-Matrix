import { test, expect } from '@playwright/test';

test.describe('Homepage E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage with chat interface', async ({ page }) => {
    // Check main heading
    await expect(page.getByText('MobileMatrix')).toBeVisible();
    
    // Check chat interface is present
    await expect(page.getByPlaceholder(/Ask me about phones/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
  });

  test('should handle user chat interaction', async ({ page }) => {
    const chatInput = page.getByPlaceholder(/Ask me about phones/i);
    const sendButton = page.getByRole('button', { name: /send/i });
    
    // Type a message
    await chatInput.fill('Compare iPhone 15 and Samsung Galaxy S24');
    await sendButton.click();
    
    // Check that input is cleared
    await expect(chatInput).toHaveValue('');
    
    // Check for loading state
    await expect(page.getByText(/thinking/i)).toBeVisible();
    
    // Wait for AI response (with timeout)
    await expect(page.getByText(/which phone brands/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display brand showcase', async ({ page }) => {
    await expect(page.getByText(/Popular Brands/i)).toBeVisible();
    
    // Check for brand logos/names
    await expect(page.getByText('Apple')).toBeVisible();
    await expect(page.getByText('Samsung')).toBeVisible();
    await expect(page.getByText('Google')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that elements are still visible and properly arranged
    await expect(page.getByText('MobileMatrix')).toBeVisible();
    await expect(page.getByPlaceholder(/Ask me about phones/i)).toBeVisible();
    
    // Check that chat interface is mobile-friendly
    const chatContainer = page.locator('[data-testid="chat-container"]');
    await expect(chatContainer).toHaveCSS('width', /100%|375px/);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    const chatInput = page.getByPlaceholder(/Ask me about phones/i);
    
    // Focus on input
    await chatInput.focus();
    await expect(chatInput).toBeFocused();
    
    // Type message and press Enter
    await chatInput.fill('Hello');
    await chatInput.press('Enter');
    
    // Check that message was sent
    await expect(chatInput).toHaveValue('');
  });

  test('should display error state gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('/api/chat', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    const chatInput = page.getByPlaceholder(/Ask me about phones/i);
    const sendButton = page.getByRole('button', { name: /send/i });
    
    await chatInput.fill('Test message');
    await sendButton.click();
    
    // Check for error message
    await expect(page.getByText(/something went wrong/i)).toBeVisible();
  });

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow network
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
      }, 3000);
    });
    
    const chatInput = page.getByPlaceholder(/Ask me about phones/i);
    const sendButton = page.getByRole('button', { name: /send/i });
    
    await chatInput.fill('Test message');
    await sendButton.click();
    
    // Check loading state persists
    await expect(page.getByText(/thinking/i)).toBeVisible();
    
    // Wait for response
    await expect(page.getByText('Response after delay')).toBeVisible({ timeout: 5000 });
  });

  test('should support accessibility features', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /message/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder(/Ask me about phones/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /send/i })).toBeFocused();
  });

  test('should persist chat history on page refresh', async ({ page }) => {
    // Send a message
    const chatInput = page.getByPlaceholder(/Ask me about phones/i);
    await chatInput.fill('Hello');
    await chatInput.press('Enter');
    
    // Wait for response
    await expect(page.getByText(/which phone brands/i)).toBeVisible({ timeout: 10000 });
    
    // Refresh page
    await page.reload();
    
    // Check that chat history is restored
    await expect(page.getByText('Hello')).toBeVisible();
    await expect(page.getByText(/which phone brands/i)).toBeVisible();
  });
});