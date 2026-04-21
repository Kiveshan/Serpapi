import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Download, Filter, Link as LinkIcon, Loader2, Search, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../css/SearchPublications.module.css';
import NavBar from '../../../components/NavBar';
import Footer from '../../../components/Footer';
import Pagination from '../../../components/Pagination';
import { authAPI } from '../../../api/auth/auth';

const API_BASE_URL = 'http://localhost:5001';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'journal', label: 'Journal Article' },
  { value: 'conference', label: 'Conference Paper' },
  { value: 'book', label: 'Book' },
  { value: 'thesis', label: 'Thesis' },
  { value: 'preprint', label: 'Preprint' },
  { value: 'report', label: 'Technical Report' },
  { value: 'other', label: 'Other' },
];

const PAGE_SIZE = 3;

const TYPE_LABEL_BY_VALUE = {
  all: 'Other',
  journal: 'Journal Article',
  conference: 'Conference Paper',
  book: 'Book',
  thesis: 'Thesis',
  preprint: 'Preprint',
  report: 'Technical Report',
};

const getYearNumber = (year) => {
  const n = parseInt(String(year || ''), 10);
  return Number.isFinite(n) ? n : null;
};

const exportToExcel = (rows) => {
  if (!rows || rows.length === 0) {
    return;
  }

  const formatAuthors = (authors) => {
    if (!authors || !Array.isArray(authors) || authors.length === 0) {
      return '';
    }

    return authors
      .filter(author => author && typeof author === 'string')
      .map(author => author.trim())
      .filter(author => author.length > 0)
      .join('; ');
  };

  const formatUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    return url.trim();
  };

  const header = [
    'Title',
    'Authors',
    'Year',
    'Publication Type',
    'Journal/Conference/Book',
    'Citations',
    'URL',
    'PDF Link',
    'DHET Approved',
    'DHET Title Similarity',
    'DHET Venue Similarity',
    'DHET Author Similarity',
    'DHET Overall Score',
    'DHET Author Match',
    'DHET Venue Match'
  ];

  const dataRows = rows.map((row) => [
    row.title || '',
    formatAuthors(row.authors),
    row.year || '',
    TYPE_LABEL_BY_VALUE[row.publicationType] || 'Other',
    row.venue || '',
    row.citations || 0,
    formatUrl(row.url),
    formatUrl(row.pdfUrl),
    row.dhetApproved ? 'Yes' : 'No',
    row.dhetSimilarity ? row.dhetSimilarity.toFixed(3) : '0',
    row.dhetVenueSimilarity ? row.dhetVenueSimilarity.toFixed(3) : '0',
    row.dhetAuthorSimilarity ? row.dhetAuthorSimilarity.toFixed(3) : '0',
    ((row.dhetSimilarity * 0.4) + (row.dhetAuthorSimilarity * 0.3) + (row.dhetVenueSimilarity * 0.3)).toFixed(3),
    row.dhetAuthorMatch || '',
    row.dhetVenueMatch || ''
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...dataRows]);

  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: dataRows.length, c: header.length - 1 }
    })
  };

  const colWidths = [
    { wch: 60 },
    { wch: 35 },
    { wch: 8 },
    { wch: 18 },
    { wch: 28 },
    { wch: 10 },
    { wch: 45 },
    { wch: 45 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 40 },
    { wch: 30 },
    { wch: 30 }
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Publications');

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const filename = `publications_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
};

const SearchPublications = () => {
  const navigate = useNavigate();
  const [serverQuery, setServerQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterText, setFilterText] = useState('');
  const [serverResults, setServerResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authAPI.getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        const userData = await authAPI.getProfile(token);
        setUser(userData);
        setAuthLoading(false);
      } catch (err) {
        authAPI.removeToken();
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchPublications = async (q) => {
    const trimmed = String(q || '').trim();
    if (!trimmed) {
      setServerResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search/${encodeURIComponent(trimmed)}`);
      setServerResults(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      setServerResults([]);
      setError('Failed to fetch publications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setServerResults([]);
  }, []);

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    const yf = getYearNumber(yearFrom);
    const yt = getYearNumber(yearTo);
    return serverResults.filter((pub) => {
      const title = String(pub.title || '').toLowerCase();
      const venue = String(pub.venue || '').toLowerCase();
      const authors = Array.isArray(pub.authors) ? pub.authors.join(' ').toLowerCase() : '';

      const matchesQuery = q
        ? title.includes(q) || venue.includes(q) || authors.includes(q)
        : true;

      const y = getYearNumber(pub.year);
      const matchesYearFrom = yf != null ? (y != null ? y >= yf : false) : true;
      const matchesYearTo = yt != null ? (y != null ? y <= yt : false) : true;

      const matchesType = type === 'all' ? true : (type === 'other' ? (pub.publicationType || 'all') === 'all' : (pub.publicationType || 'all') === type);

      return matchesQuery && matchesYearFrom && matchesYearTo && matchesType;
    });
  }, [serverResults, filterText, yearFrom, yearTo, type]);

  useEffect(() => {
    setPage(1);
  }, [filterText, yearFrom, yearTo, type, serverResults.length]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setServerQuery(q);
    setFilterText('');
    fetchPublications(q);
  };

  const clearFilters = () => {
    setYearFrom('');
    setYearTo('');
    setType('all');
  };

  const goToPage = (p) => {
    const safe = Math.max(1, Math.min(pageCount, p));
    setPage(safe);
  };

  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <NavBar />

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitleRow}>
            <Filter size={14} /> Filters
          </div>

          <div className={styles.resultsCount}>{filtered.length} results</div>

          <div className={styles.filters}>
            <div>
              <div className={styles.filterLabel}>Year From</div>
              <div className={styles.yearRow}>
                <input
                  className={styles.input}
                  value={yearFrom}
                  onChange={(e) => setYearFrom(e.target.value)}
                  placeholder="Year From"
                  inputMode="numeric"
                />
                <input
                  className={styles.input}
                  value={yearTo}
                  onChange={(e) => setYearTo(e.target.value)}
                  placeholder="Year To"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div>
              <div className={styles.filterLabel}>Type</div>
              <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.clearRow}>
              <button type="button" className={styles.clearButton} onClick={clearFilters}>
                <X size={14} /> Clear
              </button>
            </div>
          </div>
        </aside>

        <main className={styles.main}>
          <form className={styles.topControls} onSubmit={onSearchSubmit}>
            <div className={styles.searchField}>
              <Search size={16} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search publications..."
              />
            </div>

            <button type="submit" className={styles.primaryButton} disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => exportToExcel(filtered)}
              disabled={filtered.length === 0 || isLoading}
            >
              <Download size={16} /> Export to Excel
            </button>
          </form>

          {serverResults.length > 0 && (
            <div className={styles.filterWithinResults}>
              <div className={styles.searchField}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder={serverQuery ? 'Filter within results...' : 'Filter within results...'}
                />
              </div>
            </div>
          )}

          {isLoading && (
            <div className={styles.loadingContainer}>
              <Loader2 size={24} className={styles.loadingSpinner} />
              <span>Searching publications...</span>
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.list}>
            {currentRows.map((pub) => (
              <div className={styles.item} key={pub.id}>
                <h3 className={styles.itemTitle}>
                  {pub.title}
                  <span className={styles.badge}>{TYPE_LABEL_BY_VALUE[pub.publicationType || 'all'] || 'Other'}</span>
                </h3>

                <div className={styles.meta}>
                  {(pub.authors || []).join(', ')} {pub.year ? `— ${pub.year}` : ''}
                  <br />
                  {pub.venue}
                </div>

                {pub.abstract ? <div className={styles.abstract}>{pub.abstract}</div> : null}

                <div className={styles.itemActions}>
                  {pub.pdfUrl ? (
                    <button type="button" className={styles.actionLink} onClick={() => window.open(pub.pdfUrl, '_blank')}>
                      PDF
                    </button>
                  ) : null}
                  {pub.url ? (
                    <button type="button" className={styles.actionLink} onClick={() => window.open(pub.url, '_blank')}>
                      <LinkIcon size={14} /> Link
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {filtered.length > 0 ? (
            <Pagination
              currentPage={currentPage}
              totalPages={pageCount}
              onPageChange={goToPage}
            />
          ) : null}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default SearchPublications;