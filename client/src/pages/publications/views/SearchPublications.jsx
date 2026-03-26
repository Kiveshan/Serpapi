import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Download, Filter, Link as LinkIcon, Search, X } from 'lucide-react';
import styles from '../css/SearchPublications.module.css';

const API_BASE_URL = 'http://localhost:5001';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'journal', label: 'Journal Article' },
  { value: 'conference', label: 'Conference Paper' },
  { value: 'book', label: 'Book' },
  { value: 'thesis', label: 'Thesis' },
];

const PAGE_SIZE = 5;

const TYPE_LABEL_BY_VALUE = {
  all: 'Other',
  journal: 'Journal Article',
  conference: 'Conference Paper',
  book: 'Book',
  thesis: 'Thesis',
};

const normalizeType = (venue = '') => {
  const v = venue.toLowerCase();
  if (v.includes('journal')) return 'journal';
  if (v.includes('conference') || v.includes('proceedings')) return 'conference';
  if (v.includes('thesis') || v.includes('dissertation')) return 'thesis';
  if (v.includes('book')) return 'book';
  return 'all';
};

const getYearNumber = (year) => {
  const n = parseInt(String(year || ''), 10);
  return Number.isFinite(n) ? n : null;
};

const exportToCsv = (rows) => {
  const header = ['Title', 'Authors', 'Year', 'Venue', 'URL', 'PDF URL', 'Citations'];
  const escape = (value) => {
    const s = String(value ?? '');
    const needsQuotes = /[\n\r",]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const lines = [header.map(escape).join(',')];
  rows.forEach((r) => {
    lines.push(
      [
        r.title,
        Array.isArray(r.authors) ? r.authors.join(', ') : '',
        r.year,
        r.venue,
        r.url,
        r.pdfUrl || '',
        r.citations,
      ]
        .map(escape)
        .join(',')
    );
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'publications.csv';
  a.click();
  URL.revokeObjectURL(url);
};

const SearchPublications = () => {
  const navigate = useNavigate();
  const [serverQuery, setServerQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterText, setFilterText] = useState('');
  const [serverResults, setServerResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);

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

      const inferredType = normalizeType(pub.venue || '');
      const matchesType = type === 'all' ? true : inferredType === type;

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <button type="button" className={styles.headerButton} onClick={() => navigate(-1)}>
              Back
            </button>
          </div>

          <div className={styles.headerCenter}>Publications</div>

          <div className={styles.headerRight}>
            <button type="button" className={`${styles.headerButton} ${styles.logoutButton}`} onClick={() => navigate('/login')}>
              Logout
            </button>
          </div>
        </div>
      </header>

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

            <button type="submit" className={styles.primaryButton} disabled={isLoading}>
              Search
            </button>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => exportToCsv(filtered)}
              disabled={filtered.length === 0}
            >
              <Download size={16} /> Export to CSV
            </button>
          </form>

          <div className={styles.searchField}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={serverQuery ? 'Filter within results...' : 'Filter within results...'}
              disabled={serverResults.length === 0}
            />
          </div>

          {isLoading && <div className={styles.loading}>Loading...</div>}
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.list}>
            {currentRows.map((pub) => (
              <div className={styles.item} key={pub.id}>
                <h3 className={styles.itemTitle}>
                  {pub.title}
                  <span className={styles.badge}>{TYPE_LABEL_BY_VALUE[normalizeType(pub.venue || '')] || 'Other'}</span>
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
            <div className={styles.pagination}>
              <button type="button" className={styles.pageButton} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: pageCount }).slice(0, 11).map((_, idx) => {
                const p = idx + 1;
                const isActive = p === currentPage;
                return (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.pageButton} ${isActive ? styles.pageButtonActive : ''}`}
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                type="button"
                className={styles.pageButton}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === pageCount}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          ) : null}
        </main>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>&copy; 2026 Publications</div>
      </footer>
    </div>
  );
};

export default SearchPublications;