const axios = require('axios');
require('dotenv').config();

// Helper function to clean text
const cleanText = (text) => {
  return text ? text.replace(/\s+/g, ' ').trim() : '';
};

// Helper function to extract number from citations string
const extractCitations = (text) => {
  const match = text.match(/(\d+(?:,\d+)*)/);
  return match ? parseInt(match[1].replace(/,/g, '')) : 0;
};

// Helper function to extract year from various sources
const extractYear = (result) => {
  // Try publication_info.year first (most reliable)
  if (result.publication_info?.year) {
    return result.publication_info.year.toString();
  }
  
  // Try to extract from snippet
  const snippetYearMatch = (result.snippet || '').match(/\b(19|20)\d{2}\b/);
  if (snippetYearMatch) {
    return snippetYearMatch[0];
  }
  
  // Try to extract from publication_info.summary
  if (result.publication_info?.summary) {
    const summaryYearMatch = result.publication_info.summary.match(/\b(19|20)\d{2}\b/);
    if (summaryYearMatch) {
      return summaryYearMatch[0];
    }
  }
  
  return '';
};

// Helper function to extract publication type from venue and other sources
const extractPublicationType = (result) => {
  const venue = (result.publication_info?.name || '').toLowerCase();
  const summary = (result.publication_info?.summary || '').toLowerCase();
  const snippet = (result.snippet || '').toLowerCase();
  
  // Combine all text sources for type detection
  const allText = `${venue} ${summary} ${snippet}`;
  
  // Check for journal indicators (expanded patterns)
  if (allText.includes('journal') || allText.includes('j.') || 
      allText.includes('vol.') || allText.includes('volume') ||
      allText.includes('issue') || allText.includes('iss.') ||
      allText.includes('pp.') || allText.includes('pages') ||
      allText.includes('article') || allText.includes('paper') ||
      allText.includes('review') || allText.includes('editorial')) {
    return 'journal';
  }
  
  // Check for conference indicators (expanded patterns)
  if (allText.includes('conference') || allText.includes('proceedings') ||
      allText.includes('proc.') || allText.includes('workshop') ||
      allText.includes('symposium') || allText.includes('int.') ||
      allText.includes('international') || allText.includes('meeting') ||
      allText.includes('conf.') || allText.includes('icml') ||
      allText.includes('neurips') || allText.includes('iccv') ||
      allText.includes('cvpr') || allText.includes('eccv')) {
    return 'conference';
  }
  
  // Check for thesis indicators (expanded patterns)
  if (allText.includes('thesis') || allText.includes('dissertation') ||
      allText.includes('phd') || allText.includes('master') ||
      allText.includes('university') || allText.includes('dept.') ||
      allText.includes('department') || allText.includes('graduate') ||
      allText.includes('doctoral') || allText.includes('masters')) {
    return 'thesis';
  }
  
  // Check for book indicators (expanded patterns)
  if (allText.includes('book') || allText.includes('edition') ||
      allText.includes('publisher') || allText.includes('press') ||
      allText.includes('isbn') || allText.includes('chapter') ||
      allText.includes('editor') || allText.includes('cambridge') ||
      allText.includes('oxford') || allText.includes('springer') ||
      allText.includes('wiley') || allText.includes('elsevier')) {
    return 'book';
  }
  
  // Check for preprint/arxiv indicators
  if (allText.includes('arxiv') || allText.includes('preprint') ||
      allText.includes('biorxiv') || allText.includes('medrxiv')) {
    return 'preprint';
  }
  
  // Check for technical report
  if (allText.includes('technical report') || allText.includes('tech report') ||
      allText.includes('tr-') || allText.includes('memo')) {
    return 'report';
  }
  
  // Log for debugging purposes
  if (allText.length > 0) {
    console.log(`Type detection - Venue: "${venue}", Summary: "${summary.substring(0, 100)}...", Snippet: "${snippet.substring(0, 100)}..."`);
  }
  
  return 'all';
};

// Search publications using SerpApi Google Scholar with pagination
const searchWithSerpApi = async (query) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('SerpApi API_KEY is missing from environment variables');
    throw new Error('SerpApi API_KEY not configured');
  }

  const maxResultsPerRequest = 20;
  let allResults = [];
  let start = 0;
  let hasMoreResults = true;
  
  console.log(`[SerpApi] Starting search for query: "${query}"`);
  
  while (hasMoreResults) {
    const scholarApiUrl = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(query)}&api_key=${apiKey}&start=${start}&num=${maxResultsPerRequest}`;
    console.log(`[SerpApi] Requesting URL (start=${start}): ${scholarApiUrl.replace(/api_key=[^&]+/, 'api_key=REDACTED')}`);
    
    try {
      const response = await axios.get(scholarApiUrl, { timeout: 15000 });
      console.log(`[SerpApi] Response status: ${response.status}, data keys: ${Object.keys(response.data || {})}`);
      
      if (response.data && response.data.organic_results) {
        const pageResults = response.data.organic_results.map((result, index) => {
          const authors = result.publication_info?.authors ? 
            result.publication_info.authors.map(author => author.name || author).filter(Boolean) : [];
          
          const year = extractYear(result);
          const publicationType = extractPublicationType(result);
          
          return {
            id: `serp_${start + index}`,
            title: result.title || '',
            authors: authors,
            year: year,
            venue: result.publication_info?.name || '',
            publicationType: publicationType,
            abstract: result.snippet || '',
            url: result.link || '',
            pdfUrl: result.inline_links?.pdf?.link || '',
            citations: result.inline_links?.cited_by?.total || 0,
            snippets: result.snippet ? [result.snippet] : []
          };
        });
        
        allResults = allResults.concat(pageResults);
        console.log(`Fetched ${pageResults.length} results (total: ${allResults.length})`);
        
        // Check if there are more results
        // If fewer results than requested, we've reached the end
        if (pageResults.length < maxResultsPerRequest) {
          hasMoreResults = false;
          console.log('Reached end of results');
        } else {
          start += maxResultsPerRequest;
          // A small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        hasMoreResults = false;
        console.log('No organic_results found in response');
      }
    } catch (error) {
      console.error(`[SerpApi] Error fetching page at start=${start}:`, error.message);
      if (error.response) {
        console.error(`[SerpApi] Response status: ${error.response.status}`);
        console.error(`[SerpApi] Response data:`, error.response.data);
      }
      hasMoreResults = false;
    }
  }
  
  console.log(`Total results fetched: ${allResults.length}`);
  return allResults;
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