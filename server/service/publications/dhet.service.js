const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');

const normalizeHeader = (h) => {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
};

const findDhetJournalColumn = (headers) => {
  const normalizedHeaders = headers.map(normalizeHeader);
  
  const candidates = [
    'journal_title_previous_title_if_applicable',
    'journal_title',
    'journaltitle',
    'journal',
    'title'
  ];
  
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const norm = normalizedHeaders[i];
    if (candidates.some(candidate => norm.includes(candidate))) {
      return i; // Return column index
    }
  }
  return -1;
};

const loadDhetJournals = async (dhetFilePath) => {
  try {
    // Checking if file exists
    await fs.access(dhetFilePath);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(dhetFilePath);
    
    const worksheet = workbook.getWorksheet(1);
    const dhetJournals = new Set();
    
    let headerRow = true;
    let journalColumnIndex = -1;
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // Finding the journal title column
        const headers = row.values.slice(1); // Remove first null element
        journalColumnIndex = findDhetJournalColumn(headers);
        return;
      }
      
      if (journalColumnIndex >= 0) {
        const journalTitle = row.getCell(journalColumnIndex + 1).value;
        if (journalTitle && typeof journalTitle === 'string') {
          dhetJournals.add(journalTitle.trim().toLowerCase());
        }
      }
    });
    
    console.log(`Loaded ${dhetJournals.size} DHET accredited journals from ${dhetFilePath}`);
    return dhetJournals;
    
  } catch (error) {
    console.error('Error loading DHET journals:', error.message);
    return new Set(); // Return empty set on error
  }
};

// Checking if publication is DHET accredited
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

// Getting DHET journals with caching
const getDhetJournals = async () => {
  const dhetFilePath = process.env.DHET_FILE_PATH || path.join(__dirname, '../../../consolidated_publications_no_duplicates2.xlsx');
  
  // Check cache
  if (dhetJournalsCache && dhetLastLoaded && 
      (Date.now() - dhetLastLoaded) < CACHE_DURATION) {
    return dhetJournalsCache;
  }
  
  // Load fresh data
  dhetJournalsCache = await loadDhetJournals(dhetFilePath);
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
  loadDhetJournals,
  checkDhetAccreditation,
  getDhetJournals,
  addDhetAccreditationToPublications
};
