// Test the enhanced year-based search functionality
const axios = require('axios');

const baseURL = 'http://localhost:5001/api';

async function testYearBasedSearch() {
  try {
    console.log('=== Testing Year-Based Search API ===\n');
    
    // Test 1: Search with year (Nalen Naicker 2023)
    console.log('1. Testing search with year: "Nalen Naicker 2023"');
    try {
      const yearResponse = await axios.get(`${baseURL}/search/Nalen%20Naicker%202023`);
      console.log(`Results: ${yearResponse.data.length} publications found`);
      if (yearResponse.data.length > 0) {
        console.log('First result:', yearResponse.data[0].title);
        console.log('Year:', yearResponse.data[0].year);
      }
    } catch (error) {
      console.log('❌ Year search failed:', error.response?.data?.error || error.message);
    }
    console.log('');
    
    // Test 2: Search with different year (John Smith 2021)
    console.log('2. Testing search with different year: "John Smith 2021"');
    try {
      const yearResponse2 = await axios.get(`${baseURL}/search/John%20Smith%202021`);
      console.log(`Results: ${yearResponse2.data.length} publications found`);
      if (yearResponse2.data.length > 0) {
        console.log('First result:', yearResponse2.data[0].title);
        console.log('Year:', yearResponse2.data[0].year);
      }
    } catch (error) {
      console.log('❌ Year search failed:', error.response?.data?.error || error.message);
    }
    console.log('');
    
    // Test 3: Search with paper title and year
    console.log('3. Testing paper title with year: "Machine Learning 2022"');
    try {
      const titleYearResponse = await axios.get(`${baseURL}/search/Machine%20Learning%202022`);
      console.log(`Results: ${titleYearResponse.data.length} publications found`);
      if (titleYearResponse.data.length > 0) {
        console.log('First result:', titleYearResponse.data[0].title);
        console.log('Year:', titleYearResponse.data[0].year);
      }
    } catch (error) {
      console.log('❌ Title+year search failed:', error.response?.data?.error || error.message);
    }
    console.log('');
    
    // Test 4: Advanced search with year parameter
    console.log('4. Testing advanced search with year parameter');
    try {
      const advancedResponse = await axios.get(`${baseURL}/advanced-search?author=Smith&year=2023`);
      console.log(`Results: ${advancedResponse.data.length} publications found`);
      if (advancedResponse.data.length > 0) {
        console.log('First result:', advancedResponse.data[0].title);
        console.log('Year:', advancedResponse.data[0].year);
      }
    } catch (error) {
      console.log('❌ Advanced year search failed:', error.response?.data?.error || error.message);
    }
    console.log('');
    
    // Test 5: Search without year (should still work)
    console.log('5. Testing search without year: "John Smith"');
    try {
      const noYearResponse = await axios.get(`${baseURL}/search/John%20Smith`);
      console.log(`Results: ${noYearResponse.data.length} publications found`);
      if (noYearResponse.data.length > 0) {
        console.log('First result:', noYearResponse.data[0].title);
        console.log('Year:', noYearResponse.data[0].year || 'N/A');
      }
    } catch (error) {
      console.log('❌ No-year search failed:', error.response?.data?.error || error.message);
    }
    console.log('');
    
    console.log('✅ Year-based search tests completed!');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

// Run tests
testYearBasedSearch();
