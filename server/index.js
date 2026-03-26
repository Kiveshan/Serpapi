const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to clean text
const cleanText = (text) => {
  return text ? text.replace(/\s+/g, ' ').trim() : '';
};

// Helper function to extract number from citations string
const extractCitations = (text) => {
  const match = text.match(/(\d+(?:,\d+)*)/);
  return match ? parseInt(match[1].replace(/,/g, '')) : 0;
};

// Advanced search query parser
const parseSearchQuery = (query) => {
  const cleanedQuery = cleanText(query);
  const searchTypes = {
    isPaperTitle: false,
    isAuthor: false,
    isInitials: false,
    isSurname: false,
    isFullName: false,
    hasYear: false
  };

  // Extract year from query
  let extractedYear = null;
  const yearMatch = cleanedQuery.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    extractedYear = parseInt(yearMatch[0]);
    searchTypes.hasYear = true;
  }

  // Remove year from cleaned query for further processing
  const queryWithoutYear = extractedYear ? cleanedQuery.replace(/\b(19|20)\d{2}\b/, '').trim() : cleanedQuery;

  // Check if it's a paper title (contains quotes or title-like patterns)
  if (queryWithoutYear.includes('"') || queryWithoutYear.includes("'") || 
      /^(the|a|an|analysis|study|review|survey|investigation|development|design|implementation|approach|method|algorithm|system|framework|model|theory)/i.test(queryWithoutYear)) {
    searchTypes.isPaperTitle = true;
  }

  // Check for initials pattern (e.g., "J K Smith", "A.B. Cooper")
  if (/^[A-Z]\.?[A-Z]\.?\s+[A-Z][a-z]/i.test(queryWithoutYear) || 
      /^[A-Z]\s+[A-Z]\s+[A-Z][a-z]/i.test(queryWithoutYear)) {
    searchTypes.isInitials = true;
    searchTypes.isAuthor = true;
  }
  // Check for surname pattern (single word or two words with last name capitalized)
  else if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/.test(queryWithoutYear) && queryWithoutYear.split(' ').length <= 2) {
    searchTypes.isSurname = true;
    searchTypes.isAuthor = true;
  }
  // Check for full name pattern (First Last or First M. Last)
  else if (/^[A-Z][a-z]+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(queryWithoutYear) ||
           /^[A-Z][a-z]+\s+[A-Z]\.?\s*[A-Z][a-z]+$/.test(queryWithoutYear)) {
    searchTypes.isFullName = true;
    searchTypes.isAuthor = true;
  }
  // Default to general search
  else {
    searchTypes.isPaperTitle = true;
    searchTypes.isAuthor = true;
  }

  return { cleanedQuery: queryWithoutYear, searchTypes, extractedYear };
};

// Build optimized search query based on search type
const buildSearchQuery = (cleanedQuery, searchTypes, extractedYear = null) => {
  let optimizedQuery = cleanedQuery;

  if (searchTypes.isPaperTitle && !searchTypes.isAuthor) {
    // Pure paper title search - add quotes for exact matching
    if (!cleanedQuery.includes('"')) {
      optimizedQuery = `"${cleanedQuery}"`;
    }
  } else if (searchTypes.isAuthor && !searchTypes.isPaperTitle) {
    // Pure author search - optimize for author name
    if (searchTypes.isInitials) {
      // For initials, keep the original format but ensure it's valid
      // Don't modify too much to avoid breaking the search
      optimizedQuery = cleanedQuery;
    } else if (searchTypes.isSurname) {
      // For surname, add "author:" prefix if available
      optimizedQuery = `author:${cleanedQuery}`;
    }
  } else {
    // Mixed search - keep as is but optimize
    optimizedQuery = cleanedQuery;
  }

  // Add year filter if present
  if (extractedYear) {
    optimizedQuery += ` year:${extractedYear}`;
  }

  return optimizedQuery;
};

// Filter and rank search results based on query type
const filterAndRankResults = (publications, searchTypes, originalQuery, extractedYear = null) => {
  if (!publications.length) return publications;

  const scoredResults = publications.map(pub => {
    let score = 0;
    const titleLower = (pub.title || '').toLowerCase();
    const authorsLower = (pub.authors || []).join(' ').toLowerCase();
    const queryLower = originalQuery.toLowerCase();

    // Year filtering and scoring
    if (extractedYear) {
      const pubYear = parseInt(pub.year);
      if (pubYear === extractedYear) {
        score += 100; // Exact year match gets highest bonus
      } else if (pubYear && Math.abs(pubYear - extractedYear) <= 2) {
        score += 50; // Close year gets bonus
      } else if (pubYear && Math.abs(pubYear - extractedYear) > 5) {
        score -= 30; // Distant years get penalty
      }
    }

    // Title matching
    if (searchTypes.isPaperTitle) {
      if (titleLower.includes(queryLower)) {
        score += titleLower === queryLower ? 100 : 50;
      }
      // Exact phrase match bonus
      if (titleLower === queryLower) score += 50;
    }

    // Author matching
    if (searchTypes.isAuthor) {
      const authorWords = queryLower.split(' ');
      let authorMatchCount = 0;
      
      authorWords.forEach(word => {
        if (authorsLower.includes(word)) {
          authorMatchCount++;
        }
      });
      
      if (authorMatchCount === authorWords.length) {
        score += 80;
      } else if (authorMatchCount > 0) {
        score += authorMatchCount * 20;
      }

      // Special scoring for initials
      if (searchTypes.isInitials) {
        const initials = originalQuery.split(' ').filter(w => /^[A-Z]\.?$/.test(w)).join('');
        const authorInitials = (pub.authors || []).map(a => {
          if (typeof a === 'string') {
            return a.split(' ').map(n => n[0]).join('');
          }
          return '';
        }).join(' ');
        
        if (authorInitials.toLowerCase().includes(initials.toLowerCase())) {
          score += 60;
        }
      }
    }

    // Citation count bonus (higher citations = higher relevance)
    score += Math.min((pub.citations || 0) / 10, 20);

    // Recency bonus for recent papers (if no specific year filter)
    if (!extractedYear) {
      const year = parseInt(pub.year);
      if (year && year >= 2020) {
        score += 10;
      }
    }

    return { ...pub, relevanceScore: score };
  });

  // Sort by relevance score and filter out low-scoring results
  return scoredResults
    .filter(result => result.relevanceScore > 10)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map(({ relevanceScore, ...result }) => result);
};

// Enhanced search publications with flexible query support
app.get('/api/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    // Parse and analyze the search query
    const { cleanedQuery, searchTypes, extractedYear } = parseSearchQuery(query);
    const optimizedQuery = buildSearchQuery(cleanedQuery, searchTypes, extractedYear);
    
    console.log(`Original query: "${query}"`);
    console.log(`Optimized query: "${optimizedQuery}"`);
    console.log(`Search types:`, Object.keys(searchTypes).filter(key => searchTypes[key]));
    if (extractedYear) {
      console.log(`Extracted year: ${extractedYear}`);
    }
    
    // Option 1: SerpApi Google Scholar (requires API key) - PRIMARY CHOICE
    const scholarApiUrl = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(optimizedQuery)}&api_key=633a1be5a47bd119f41d60ff0674c0fe89195bee82ecc3b8a7da12cd541710ad`;
    
    // Option 2: Semantic Scholar API (free and official) - FALLBACK
    const semanticScholarUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(optimizedQuery)}&fields=title,authors,year,venue,abstract,citationCount,url,openAccessPdf&limit=20`;
    
    // Option 3: Fallback to web scraping if APIs fail
    const fallbackUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(optimizedQuery)}&hl=en&as_sdt=0%2C5`;
    
    let publications = [];
    
    try {
      // Try SerpApi Google Scholar first (now active with API key)
      console.log('Trying SerpApi Google Scholar...');
      const serpResponse = await axios.get(scholarApiUrl, {
        timeout: 15000
      });
      
      if (serpResponse.data && serpResponse.data.organic_results) {
        publications = serpResponse.data.organic_results.map((result, index) => {
          // Extract authors from publication info
          const authors = result.publication_info?.authors ? 
            result.publication_info.authors.map(author => author.name || author).filter(Boolean) : [];
          
          // Extract year from publication info or snippet
          let year = '';
          const yearMatch = (result.snippet || '').match(/\b(19|20)\d{2}\b/);
          if (yearMatch) {
            year = yearMatch[0];
          } else if (result.publication_info?.year) {
            year = result.publication_info.year.toString();
          }
          
          // Extract venue/journal
          const venue = result.publication_info?.name || '';
          
          // Extract citations
          const citations = result.inline_links?.cited_by?.total || 0;
          
          return {
            id: `serp_${index}`,
            title: result.title || '',
            authors: authors,
            year: year,
            venue: venue,
            abstract: result.snippet || '',
            url: result.link || '',
            pdfUrl: result.inline_links?.pdf?.link || '',
            citations: citations,
            snippets: result.snippet ? [result.snippet] : []
          };
        });
      }
      
      console.log(`Found ${publications.length} publications via SerpApi`);
      
    } catch (serpError) {
      console.log('SerpApi failed, trying Semantic Scholar API...');
      
      try {
        // Try Semantic Scholar API as second option
        const semanticResponse = await axios.get(semanticScholarUrl, {
          headers: {
            'User-Agent': 'Google-Scholar-Scraper/1.0'
          },
          timeout: 10000
        });
        
        if (semanticResponse.data && semanticResponse.data.data) {
          publications = semanticResponse.data.data.map((paper, index) => ({
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
        
        console.log(`Found ${publications.length} publications via Semantic Scholar`);
        
      } catch (semanticError) {
        console.log('Semantic Scholar API failed, trying web scraping fallback...');
        
        // Fallback to web scraping
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
        
        // Parse search results (same as before)
        $('.gs_r.gs_or.gs_scl').each((index, element) => {
          try {
            const $element = $(element);
            const $title = $element.find('.gs_rt a');
            const $authors = $element.find('.gs_a');
            const $snippet = $element.find('.gs_rs');
            const $citations = $element.find('.gs_fl a:contains("Cited by")');
            
            // Extract title and URL
            const title = cleanText($title.text());
            const url = $title.attr('href') || '';
            
            // Extract authors and year
            const authorText = cleanText($authors.text());
            const authors = authorText.split(' - ')[0]?.split(',').map(a => a.trim()).filter(a => a) || [];
            
            // Extract year from author text
            const yearMatch = authorText.match(/\b(19|20)\d{2}\b/);
            const year = yearMatch ? yearMatch[0] : '';
            
            // Extract venue/journal
            const venue = authorText.split(' - ')[1]?.split(',')[0]?.trim() || '';
            
            // Extract snippet/abstract
            const snippet = cleanText($snippet.text());
            
            // Extract citations count
            const citationsText = $citations.text();
            const citations = extractCitations(citationsText);
            
            // Look for PDF link
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
        
        console.log(`Found ${publications.length} publications via web scraping`);
      }
    }
    
    // Apply intelligent filtering and ranking based on search types
    publications = filterAndRankResults(publications, searchTypes, query, extractedYear);
    console.log(`After filtering/ranking: ${publications.length} relevant publications`);
    
    // Add delay before sending response
    await new Promise(resolve => setTimeout(resolve, 500));
    
    res.json(publications);
    
  } catch (error) {
    console.error('Error searching publications:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: 'Request timeout. Please try again.' });
    } else if (error.response && error.response.status === 429) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch publications. The service might be temporarily unavailable.' 
      });
    }
  }
});

// Advanced search endpoint with query parameters
app.get('/api/advanced-search', async (req, res) => {
  try {
    const { q, type, author, title, year } = req.query;
    
    if (!q && !author && !title) {
      return res.status(400).json({ 
        error: 'At least one search parameter (q, author, or title) is required' 
      });
    }
    
    // Build search query based on parameters
    let searchQuery = '';
    if (author) searchQuery += `author:${author} `;
    if (title) searchQuery += `"${title}" `;
    if (q) searchQuery += q;
    if (year) searchQuery += ` year:${year}`;
    
    searchQuery = searchQuery.trim();
    
    console.log(`Advanced search query: "${searchQuery}"`);
    
    // Parse and analyze the search query
    const { cleanedQuery, searchTypes, extractedYear } = parseSearchQuery(searchQuery);
    const optimizedQuery = buildSearchQuery(cleanedQuery, searchTypes, extractedYear);
    
    if (extractedYear) {
      console.log(`Extracted year: ${extractedYear}`);
    }
    
    // Use the same search logic as the regular endpoint
    const scholarApiUrl = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(optimizedQuery)}&api_key=633a1be5a47bd119f41d60ff0674c0fe89195bee82ecc3b8a7da12cd541710ad`;
    
    let publications = [];
    
    try {
      const serpResponse = await axios.get(scholarApiUrl, { timeout: 15000 });
      
      if (serpResponse.data && serpResponse.data.organic_results) {
        publications = serpResponse.data.organic_results.map((result, index) => {
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
            id: `advanced_${index}`,
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
      
      // Apply filtering and ranking
      publications = filterAndRankResults(publications, searchTypes, searchQuery, extractedYear);
      
      res.json(publications);
      
    } catch (error) {
      console.error('Advanced search error:', error.message);
      res.status(500).json({ error: 'Advanced search failed' });
    }
    
  } catch (error) {
    console.error('Error in advanced search:', error.message);
    res.status(500).json({ error: 'Failed to process advanced search' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('\n=== ENHANCED SEARCH API ===');
  console.log('✅ Flexible search like Google Scholar!');
  console.log('🔍 Search by:');
  console.log('   • Full name: "John Smith"');
  console.log('   • Initials: "J K Smith" or "A.B. Cooper"');
  console.log('   • Surname: "Smith"');
  console.log('   • Paper title: "Machine Learning Analysis"');
  console.log('   • Mixed queries: "John Smith machine learning"');
  console.log('   • With year: "Nalen Naicker 2023"');
  console.log('\n=== API ENDPOINTS ===');
  console.log(`1. Flexible Search: GET /api/search/:query`);
  console.log(`2. Advanced Search: GET /api/advanced-search?q=...&author=...&title=...&year=...`);
  console.log(`3. Health Check: GET /api/health`);
  console.log('\n=== SEARCH SOURCES ===');
  console.log('1. SerpApi Google Scholar (with API key) - PRIMARY');
  console.log('2. Semantic Scholar API (free) - FALLBACK');
  console.log('3. Web scraping fallback - LAST RESORT');
  console.log('\n✅ SerpApi is configured and active!');
  console.log('🔄 Will fallback to Semantic Scholar if SerpApi fails');
  console.log('🔄 Will fallback to web scraping if both APIs fail');
  console.log('🎯 Results are automatically filtered and ranked by relevance');
  console.log('📅 Year-based filtering now supported!');
});
