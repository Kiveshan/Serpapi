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

// Search publications by author name using APIs
app.get('/api/search/:authorName', async (req, res) => {
  try {
    const { authorName } = req.params;
    
    console.log(`Searching for: ${authorName}`);
    
    // Option 1: Semantic Scholar API (free and official) - PRIMARY CHOICE
    const semanticScholarUrl = `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(authorName)}&fields=name,papers.title,papers.authors,papers.year,papers.venue,papers.abstract,papers.citationCount,papers.url,papers.openAccessPdf`;
    
    // Option 2: SerpApi Google Scholar (requires API key) - PAID OPTION
    const scholarApiUrl = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(authorName)}&api_key=633a1be5a47bd119f41d60ff0674c0fe89195bee82ecc3b8a7da12cd541710ad`;
    
    // Option 3: Fallback to web scraping if APIs fail
    const fallbackUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(authorName)}&hl=en&as_sdt=0%2C5`;
    
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
          publications = semanticResponse.data.data.map((author, index) => {
            return author.papers.map((paper, paperIndex) => ({
              id: `semantic_${index}_${paperIndex}`,
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
          }).flat();
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
  console.log('\n=== API OPTIONS ===');
  console.log('1. SerpApi Google Scholar (with API key) - ACTIVE');
  console.log('2. Semantic Scholar API (free) - FALLBACK');
  console.log('3. Web scraping fallback - LAST RESORT');
  console.log('\n✅ SerpApi is configured and active!');
  console.log('🔄 Will fallback to Semantic Scholar if SerpApi fails');
  console.log('🔄 Will fallback to web scraping if both APIs fail');
});
