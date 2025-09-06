/**
 * Example usage of PhoneService
 * This file demonstrates how to use the PhoneService in your application
 */

import { phoneService } from '../phone.js';

async function exampleUsage() {
  try {
    console.log('=== PhoneService Example Usage ===\n');

    // 1. Search for phones
    console.log('1. Searching for phones with "iPhone":');
    const searchResults = await phoneService.searchPhones('iPhone');
    console.log(`Found ${searchResults.length} phones`);
    if (searchResults.length > 0) {
      console.log(`First result: ${searchResults[0].brand} ${searchResults[0].model}`);
    }
    console.log();

    // 2. Get all brands
    console.log('2. Getting all brands:');
    const brands = await phoneService.getAllBrands();
    console.log(`Found ${brands.length} brands`);
    brands.slice(0, 5).forEach(brand => {
      console.log(`- ${brand.name} (ID: ${brand.id})`);
    });
    console.log();

    // 3. Get phone by brand and model
    if (brands.length > 0) {
      console.log('3. Getting phone by brand and model:');
      const phone = await phoneService.getPhoneByModel(brands[0].name, 'iPhone 15');
      if (phone) {
        console.log(`Found: ${phone.brand} ${phone.model}`);
        console.log(`Price: ₹${phone.pricing.currentPrice}`);
        console.log(`Display: ${phone.specifications.display.size}`);
      } else {
        console.log('Phone not found');
      }
      console.log();
    }

    // 4. Get models by brand
    if (brands.length > 0) {
      console.log('4. Getting models for first brand:');
      const models = await phoneService.getModelsByBrand(brands[0].id);
      console.log(`Found ${models.length} models for ${brands[0].name}`);
      models.slice(0, 3).forEach(model => {
        console.log(`- ${model.name} (${model.launchYear})`);
      });
      console.log();
    }

    // 5. Get phones by brand
    if (brands.length > 0) {
      console.log('5. Getting phones by brand:');
      const phonesByBrand = await phoneService.getPhonesByBrand(brands[0].name);
      console.log(`Found ${phonesByBrand.length} phones for ${brands[0].name}`);
      phonesByBrand.slice(0, 3).forEach(phone => {
        console.log(`- ${phone.model} (₹${phone.pricing.currentPrice})`);
      });
      console.log();
    }

    // 6. Get similar phones
    if (searchResults.length > 0) {
      console.log('6. Getting similar phones:');
      const similarPhones = await phoneService.getSimilarPhones(searchResults[0], 3);
      console.log(`Found ${similarPhones.length} similar phones`);
      similarPhones.forEach(phone => {
        console.log(`- ${phone.brand} ${phone.model} (₹${phone.pricing.currentPrice})`);
      });
      console.log();
    }

    // 7. Get phone by ID
    if (searchResults.length > 0) {
      console.log('7. Getting phone by ID:');
      const phoneById = await phoneService.getPhoneById(searchResults[0].id);
      if (phoneById) {
        console.log(`Found: ${phoneById.brand} ${phoneById.model}`);
        console.log(`Availability: ${phoneById.availability}`);
      }
      console.log();
    }

    console.log('=== Example completed successfully ===');

  } catch (error) {
    console.error('Error in example usage:', error);
  }
}

// Export the example function for use in other files
export { exampleUsage };

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage();
}