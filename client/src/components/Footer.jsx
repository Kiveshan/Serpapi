import React from 'react';
import styles from './css/Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        &copy; 2026 Publications
      </div>
    </footer>
  );
};

export default Footer;
