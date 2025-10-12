import { test, expect } from '@playwright/test';

test('Stock update functionality', async ({ page }) => {
  // Navigate to the inventory page
  await page.goto('http://localhost:8082/admin/inventory');
  
  // Wait for the page to load
  await page.waitForSelector('table');
  
  // Click the first "Update Stock" button
  await page.click('button:has-text("Update Stock"):first');
  
  // Wait for the modal to appear
  await page.waitForSelector('form');
  
  // Fill in the quantity
  await page.fill('input[type="number"]:not([readonly])', '5');
  
  // Click the Update Stock button in the modal
  await page.click('button[type="submit"]');
  
  // Wait for the success message or page reload
  await page.waitForTimeout(2000);
  
  // Check if there's a success message or if the stock was updated
  const hasSuccessMessage = await page.isVisible('text=Stock updated successfully');
  console.log('Success message visible:', hasSuccessMessage);
});
