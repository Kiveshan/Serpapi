// Test the enhanced search functionality
const axios = require('axios');

const baseURL = 'http://localhost:5001/api';

async function testSearch() {
  try {
    console.log('=== Testing Enhanced Search API ===\n');
    
    // Test 1: Full name search
    console.log('1. Testing full name search: "John Smith"');
    const fullNameResponse = await axios.get(`${baseURL}/search/John%20Smith`);
    console.log(`Results: ${fullNameResponse.data.length} publications found`);
    if (fullNameResponse.data.length > 0) {
      console.log('First result:', fullNameResponse.data[0].title);
    }
    console.log('');
    
    // Test 2: Initials search
    console.log('2. Testing initials search: "J K Smith"');
    const initialsResponse = await axios.get(`${baseURL}/search/J%20K%20Smith`);
    console.log(`Results: ${initialsResponse.data.length} publications found`);
    if (initialsResponse.data.length > 0) {
      console.log('First result:', initialsResponse.data[0].title);
    }
    console.log('');
    
    // Test 3: Paper title search
    console.log('3. Testing paper title search: "Machine Learning"');
    const titleResponse = await axios.get(`${baseURL}/search/Machine%20Learning`);
    console.log(`Results: ${titleResponse.data.length} publications found`);
    if (titleResponse.data.length > 0) {
      console.log('First result:', titleResponse.data[0].title);
    }
    console.log('');
    
    // Test 4: Advanced search
    console.log('4. Testing advanced search with author and title');
    const advancedResponse = await axios.get(`${baseURL}/advanced-search?author=Smith&title=Machine%20Learning`);
    console.log(`Results: ${advancedResponse.data.length} publications found`);
    if (advancedResponse.data.length > 0) {
      console.log('First result:', advancedResponse.data[0].title);
    }
    console.log('');
    
    // Test 5: Surname search
    console.log('5. Testing surname search: "Smith"');
    const surnameResponse = await axios.get(`${baseURL}/search/Smith`);
    console.log(`Results: ${surnameResponse.data.length} publications found`);
    if (surnameResponse.data.length > 0) {
      console.log('First result:', surnameResponse.data[0].title);
    }
    console.log('');
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
testSearch();
