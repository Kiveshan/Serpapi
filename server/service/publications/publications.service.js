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
  const summary = result.publication_info?.summary || '';
  const snippet = result.snippet || '';
  const summaryYearMatches = summary.match(/\b(19|20)\d{2}\b/g);
  if (summaryYearMatches && summaryYearMatches.length > 0) {
    return summaryYearMatches[summaryYearMatches.length - 1];
  }

  const snippetYearMatches = snippet.match(/\b(19|20)\d{2}\b/g);
  if (snippetYearMatches && snippetYearMatches.length > 0) {
    const years = snippetYearMatches
      .map(y => parseInt(y, 10))
      .filter(y => Number.isFinite(y) && y >= 1900 && y <= (new Date().getFullYear() + 1));

    if (years.length > 0) {
      const maxYear = Math.max(...years);
      return String(maxYear);
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
const searchWithSerpApi = async (query, options = {}) => {
  const apiKey = process.env.API_KEY;
  const maxResultsPerRequest = 20;
  let allResults = [];
  let start = 0;
  let hasMoreResults = true;

  console.log(`SerpApi search: "${query}" ${options.year ? `(year=${options.year})` : ''}`);

  while (hasMoreResults) {
    let scholarApiUrl = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(query)}&api_key=${apiKey}&start=${start}&num=${maxResultsPerRequest}`;

    if (options.year) {
      scholarApiUrl += `&as_ylo=${options.year}&as_yhi=${options.year}`;
    } else if (options.yearFrom || options.yearTo) {
      const from = options.yearFrom ? parseInt(options.yearFrom, 10) : null;
      const to = options.yearTo ? parseInt(options.yearTo, 10) : null;

      if (Number.isFinite(from)) {
        scholarApiUrl += `&as_ylo=${from}`;
      }
      if (Number.isFinite(to)) {
        scholarApiUrl += `&as_yhi=${to}`;
      }
    }

    try {
      const response = await axios.get(scholarApiUrl);

      if (response.data?.organic_results) {
        const pageResults = response.data.organic_results.map((result, index) => {
          const authors = result.publication_info?.authors
            ? result.publication_info.authors.map(a => a.name || a).filter(Boolean)
            : [];

          const year = extractYear(result);
          const publicationType = extractPublicationType(result);

          return {
            id: `serp_${start + index}`,
            title: result.title || '',
            authors,
            year,
            venue: result.publication_info?.summary?.split(' - ')[1]?.split(',')[0]?.trim() || result.publication_info?.summary || '',
            publicationType,
            abstract: result.snippet || '',
            url: result.link || '',
            pdfUrl: result.inline_links?.pdf?.link || result.resources?.[0]?.link || '',
            citations: result.inline_links?.cited_by?.total || 0,
            snippets: result.snippet ? [result.snippet] : []
          };
        });

        allResults = allResults.concat(pageResults);
        console.log(`Fetched ${pageResults.length} results (total: ${allResults.length})`);

        if (pageResults.length < maxResultsPerRequest) {
          hasMoreResults = false;
        } else {
          start += maxResultsPerRequest;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        hasMoreResults = false;
      }
    } catch (error) {
      console.error(`SerpApi page error (start=${start}):`, error.message);
      hasMoreResults = false;
    }
  }

  return allResults;
};

// Main search function using only SerpApi
const searchPublications = async (query, options = {}) => {
  console.log('Searching with SerpApi Google Scholar...');
  const publications = await searchWithSerpApi(query, options);
  console.log(`Found ${publications.length} publications via SerpApi`);
  return publications;
};

module.exports = {
  searchPublications,
  cleanText,
  extractCitations
};