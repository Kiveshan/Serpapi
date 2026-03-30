const axios = require('axios');

// Helper function to clean text
const cleanText = (text) => {
  return text ? text.replace(/\s+/g, ' ').trim() : '';
};

// Helper function to extract number from citations string
const extractCitations = (text) => {
  const match = text.match(/(\d+(?:,\d+)*)/);
  return match ? parseInt(match[1].replace(/,/g, '')) : 0;
};

// Search publications using SerpApi Google Scholar
const searchWithSerpApi = async (query) => {
  const scholarApiUrl = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(query)}&api_key=633a1be5a47bd119f41d60ff0674c0fe89195bee82ecc3b8a7da12cd541710ad`;
  
  const response = await axios.get(scholarApiUrl, { timeout: 15000 });
  
  if (response.data && response.data.organic_results) {
    return response.data.organic_results.map((result, index) => {
      const authors = result.publication_info?.authors ? 
        result.publication_info.authors.map(author => author.name || author).filter(Boolean) : [];
      
      let year = '';
      const yearMatch = (result.snippet || '').match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        year = yearMatch[0];
      } else if (result.publication_info?.year) {
        year = result.publication_info.year.toString();
      }
      
      return {
        id: `serp_${index}`,
        title: result.title || '',
        authors: authors,
        year: year,
        venue: result.publication_info?.name || '',
        abstract: result.snippet || '',
        url: result.link || '',
        pdfUrl: result.inline_links?.pdf?.link || '',
        citations: result.inline_links?.cited_by?.total || 0,
        snippets: result.snippet ? [result.snippet] : []
      };
    });
  }
  
  return [];
};

// Search publications using Semantic Scholar API
const searchWithSemanticScholar = async (query) => {
  const semanticScholarUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=title,authors,year,venue,abstract,citationCount,url,openAccessPdf&limit=20`;
  
  const response = await axios.get(semanticScholarUrl, {
    headers: {
      'User-Agent': 'Google-Scholar-Scraper/1.0'
    },
    timeout: 10000
  });
  
  if (response.data && response.data.data) {
    return response.data.data.map((paper, index) => ({
      id: `semantic_${index}`,
      title: paper.title || '',
      authors: paper.authors ? paper.authors.map(a => a.name) : [],
      year: paper.year ? paper.year.toString() : '',
      venue: paper.venue || '',
      abstract: paper.abstract || '',
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      pdfUrl: paper.openAccessPdf ? paper.openAccessPdf.url : '',
      citations: paper.citationCount || 0,
      snippets: paper.abstract ? [paper.abstract.substring(0, 200) + '...'] : []
    }));
  }
  
  return [];
};

// Search publications using web scraping fallback
const searchWithWebScraping = async (query) => {
  const fallbackUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}&hl=en&as_sdt=0%2C5`;
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  const response = await axios.get(fallbackUrl, { headers, timeout: 10000 });
  const cheerio = require('cheerio');
  const $ = cheerio.load(response.data);
  
  const publications = [];
  
  $('.gs_r.gs_or.gs_scl').each((index, element) => {
    try {
      const $element = $(element);
      const $title = $element.find('.gs_rt a');
      const $authors = $element.find('.gs_a');
      const $snippet = $element.find('.gs_rs');
      const $citations = $element.find('.gs_fl a:contains("Cited by")');
      
      const title = cleanText($title.text());
      const url = $title.attr('href') || '';
      
      const authorText = cleanText($authors.text());
      const authors = authorText.split(' - ')[0]?.split(',').map(a => a.trim()).filter(a => a) || [];
      
      const yearMatch = authorText.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? yearMatch[0] : '';
      
      const venue = authorText.split(' - ')[1]?.split(',')[0]?.trim() || '';
      const snippet = cleanText($snippet.text());
      const citationsText = $citations.text();
      const citations = extractCitations(citationsText);
      
      const $pdfLink = $element.find('.gs_or_gg a[href*=".pdf"]');
      const pdfUrl = $pdfLink.attr('href') || '';
      
      if (title && url) {
        publications.push({
          id: `scraped_${index}`,
          title,
          authors,
          year,
          venue,
          abstract: snippet,
          url,
          pdfUrl,
          citations,
          snippets: snippet ? [snippet] : []
        });
      }
    } catch (error) {
      console.error('Error parsing publication:', error);
    }
  });
  
  return publications;
};

// Main search function with fallback strategy
const searchPublications = async (query) => {
  try {
    // Try SerpApi Google Scholar first
    console.log('Trying SerpApi Google Scholar...');
    let publications = await searchWithSerpApi(query);
    
    if (publications.length > 0) {
      console.log(`Found ${publications.length} publications via SerpApi`);
      return publications;
    }
    
    throw new Error('No results from SerpApi');
    
  } catch (serpError) {
    console.log('SerpApi failed, trying Semantic Scholar API...');
    
    try {
      const publications = await searchWithSemanticScholar(query);
      console.log(`Found ${publications.length} publications via Semantic Scholar`);
      return publications;
      
    } catch (semanticError) {
      console.log('Semantic Scholar API failed, trying web scraping fallback...');
      
      const publications = await searchWithWebScraping(query);
      console.log(`Found ${publications.length} publications via web scraping`);
      return publications;
    }
  }
};

module.exports = {
  searchPublications,
  cleanText,
  extractCitations
};