const { Pool } = require('pg');

// Database configuration
const DB_CONFIG = {
  database: 'serpapi-app',
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
};

const pool = new Pool(DB_CONFIG);

// Load DHET journals from database (dhet_embedding table)
const loadDhetJournalsFromDB = async () => {
  try {
    const query = `
      SELECT DISTINCT LOWER(TRIM(title)) as title
      FROM public.dhet_embedding
      WHERE title IS NOT NULL AND title != ''
    `;
    const result = await pool.query(query);
    
    const dhetJournals = new Set(result.rows.map(row => row.title));
    
    console.log(`Loaded ${dhetJournals.size} DHET accredited journals from database`);
    return dhetJournals;
    
  } catch (error) {
    console.error('Error loading DHET journals from database:', error.message);
    return new Set(); // Return empty set on error
  }
};

// Check if publication is DHET accredited (using dhet_embedding table from DB)
const checkDhetAccreditation = (publication, dhetJournals) => {
  const pubTitle = (publication.title || '').toLowerCase().trim();
  const pubVenue = (publication.venue || '').toLowerCase().trim();
  
  for (const dhetJournal of dhetJournals) {
    if (pubTitle === dhetJournal || pubVenue === dhetJournal) {
      return true;
    }
    
    if (pubTitle.includes(dhetJournal) || dhetJournal.includes(pubTitle) ||
        pubVenue.includes(dhetJournal) || dhetJournal.includes(pubVenue)) {
      return true;
    }
  }
  
  return false;
};

// Caching DHET journals to avoid reloading
let dhetJournalsCache = null;
let dhetLastLoaded = null;
const CACHE_DURATION = 3600000; // An hour

// Getting DHET journals with caching (from database)
const getDhetJournals = async () => {
  // Check cache
  if (dhetJournalsCache && dhetLastLoaded && 
      (Date.now() - dhetLastLoaded) < CACHE_DURATION) {
    return dhetJournalsCache;
  }
  
  // Load fresh data from database
  dhetJournalsCache = await loadDhetJournalsFromDB();
  dhetLastLoaded = Date.now();
  
  return dhetJournalsCache;
};

// Add DHET accreditation info to publications
const addDhetAccreditationToPublications = async (publications) => {
  const dhetJournals = await getDhetJournals();
  
  return publications.map(pub => ({
    ...pub,
    dhetAccredited: checkDhetAccreditation(pub, dhetJournals)
  }));
};

module.exports = {
  loadDhetJournalsFromDB,
  checkDhetAccreditation,
  getDhetJournals,
  addDhetAccreditationToPublications
};
