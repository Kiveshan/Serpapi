import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import styles from './css/Search.module.css';

const Search = ({ placeholder = 'Search...', onSearch, className = '' }) => {
  const [value, setValue] = useState('');

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSearch?.(newValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(value);
  };

  return (
    <form className={`${styles.searchContainer} ${className}`} onSubmit={handleSubmit}>
      <div className={styles.searchInput}>
        <SearchIcon size={20} className={styles.searchIcon} />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className={styles.input}
        />
      </div>
    </form>
  );
};

export default Search;