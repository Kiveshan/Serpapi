import React from 'react';
import styles from './css/Pagination.module.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getVisiblePages = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;
    
    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) {
      onPageChange?.(page);
    }
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={styles.pagination}>
      <button
        className={`${styles.pageButton} ${styles.arrowButton} ${currentPage === 1 ? styles.disabled : ''}`}
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      {visiblePages.map((page, index) => (
        <button
          key={index}
          className={`${styles.pageButton} ${page === currentPage ? styles.active : ''} ${page === '...' ? styles.ellipsis : ''}`}
          onClick={() => handlePageClick(page)}
          disabled={page === '...'}
          aria-label={page === '...' ? 'More pages' : `Go to page ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      <button
        className={`${styles.pageButton} ${styles.arrowButton} ${currentPage === totalPages ? styles.disabled : ''}`}
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  );
};

export default Pagination;