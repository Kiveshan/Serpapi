const { searchPublications, cleanText } = require('../../service/publications/publications.service');
const { addDhetAccreditationToPublications } = require('../../service/publications/dhet.service');

const parseSearchQuery = (query) => {
  const cleanedQuery = cleanText(query);
  const searchTypes = {
    isPaperTitle: false,
    isAuthor: false,
    isInitials: false,
    isSurname: false,
    isFullName: false,
    isORCID: false,
    hasYear: false
  };

  // Extract year
  let extractedYear = null;
  const yearMatch = cleanedQuery.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    extractedYear = parseInt(yearMatch[0]);
    searchTypes.hasYear = true;
  }

  const queryWithoutYear = extractedYear
    ? cleanedQuery.replace(/\b(19|20)\d{2}\b/, '').trim()
    : cleanedQuery;

  // ORCID detection
  const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{4}$/;
  if (orcidPattern.test(queryWithoutYear.replace(/\s/g, ''))) {
    searchTypes.isORCID = true;
    searchTypes.isAuthor = true;
  }

  // Paper title patterns
  if (queryWithoutYear.includes('"') || queryWithoutYear.includes("'") ||
    /^(the|a|an|analysis|study|review|survey|investigation|development|design|implementation|approach|method|algorithm|system|framework|model|theory)/i.test(queryWithoutYear)) {
    searchTypes.isPaperTitle = true;
  }

  // Author patterns - FIXED for "N Naicker", "J. Smith", etc.
  if (/^[A-Z]\.?\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/i.test(queryWithoutYear)) {
    searchTypes.isInitials = true;   // single initial + surname
    searchTypes.isAuthor = true;
  }
  else if (/^[A-Z]\.?[A-Z]\.?\s+[A-Z][a-z]/i.test(queryWithoutYear) ||
    /^[A-Z]\s+[A-Z]\s+[A-Z][a-z]/i.test(queryWithoutYear)) {
    searchTypes.isInitials = true;
    searchTypes.isAuthor = true;
  }
  else if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/.test(queryWithoutYear) && queryWithoutYear.split(' ').length <= 2) {
    searchTypes.isSurname = true;
    searchTypes.isAuthor = true;
  }
  else if (/^[A-Z][a-z]+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(queryWithoutYear) ||
    /^[A-Z][a-z]+\s+[A-Z]\.?\s*[A-Z][a-z]+$/.test(queryWithoutYear)) {
    searchTypes.isFullName = true;
    searchTypes.isAuthor = true;
  }
  else if (!searchTypes.isPaperTitle) {
    // Default fallback
    searchTypes.isAuthor = true;
  }

  return { cleanedQuery: queryWithoutYear, searchTypes, extractedYear };
};

// Build optimized search query based on search type
const buildSearchQuery = (cleanedQuery, searchTypes) => {
  let optimizedQuery = cleanedQuery;

  if (searchTypes.isORCID) {
    optimizedQuery = cleanedQuery; // just the ORCID number
  }
  else if (searchTypes.isPaperTitle && !searchTypes.isAuthor) {
    optimizedQuery = cleanedQuery;
  }
  else if (searchTypes.isAuthor && !searchTypes.isPaperTitle) {
    optimizedQuery = cleanedQuery;
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
        score += 100;
      } else if (pubYear && Math.abs(pubYear - extractedYear) <= 2) {
        score += 50;
      } else if (pubYear && Math.abs(pubYear - extractedYear) > 5) {
        score -= 30;
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

  // Sort by relevance score but keep all results (no filtering)
  return scoredResults
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map(({ relevanceScore, ...result }) => result);
};

// Search publications with flexible query support
const searchPublicationsController = async (req, res) => {
  try {
    const { query } = req.params;

    // Parse and analyze the search query
    const { cleanedQuery, searchTypes, extractedYear } = parseSearchQuery(query);
    const optimizedQuery = buildSearchQuery(cleanedQuery, searchTypes);
    const searchOptions = extractedYear ? { year: extractedYear } : {};

    console.log(`Original: "${query}" | Optimized: "${optimizedQuery}" | Year filter: ${extractedYear || 'none'}`);
    console.log(`Optimized query: "${optimizedQuery}"`);
    console.log(`Search types:`, Object.keys(searchTypes).filter(key => searchTypes[key]));
    if (extractedYear) {
      console.log(`Extracted year: ${extractedYear}`);
    }

    let publications = await searchPublications(optimizedQuery, searchOptions);

    publications = filterAndRankResults(publications, searchTypes, query, extractedYear);
    console.log(`After filtering/ranking: ${publications.length} relevant publications`);

    // Add DHET accreditation info
    publications = await addDhetAccreditationToPublications(publications);
    console.log(`After DHET accreditation check: ${publications.filter(p => p.dhetAccredited).length} accredited publications`);

    // Add delay before sending response (increased for pagination)
    //await new Promise(resolve => setTimeout(resolve, 1000));

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
};

// Advanced search endpoint with query parameters
const advancedSearchController = async (req, res) => {
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

    searchQuery = searchQuery.trim();

    console.log(`Advanced search query: "${searchQuery}"`);

    // Parse and analyze the search query
    const { cleanedQuery, searchTypes, extractedYear } = parseSearchQuery(searchQuery);
    const optimizedQuery = buildSearchQuery(cleanedQuery, searchTypes);
    const effectiveYear = year ? parseInt(year, 10) : extractedYear;
    const searchOptions = effectiveYear ? { year: effectiveYear } : {};

    if (extractedYear) {
      console.log(`Extracted year: ${extractedYear}`);
    }

    let publications = await searchPublications(optimizedQuery, searchOptions);

    // Apply filtering and ranking
    publications = filterAndRankResults(publications, searchTypes, searchQuery, effectiveYear);

    // Add DHET accreditation info
    publications = await addDhetAccreditationToPublications(publications);
    console.log(`After DHET accreditation check: ${publications.filter(p => p.dhetAccredited).length} accredited publications`);

    res.json(publications);

  } catch (error) {
    console.error('Advanced search error:', error.message);
    res.status(500).json({ error: 'Advanced search failed' });
  }
};

// Health check controller
const healthCheckController = (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
};

module.exports = {
  searchPublicationsController,
  advancedSearchController,
  healthCheckController
};