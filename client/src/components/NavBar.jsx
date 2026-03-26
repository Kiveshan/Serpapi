import React from 'react';
import { BookOpen } from 'lucide-react';
import styles from './css/NavBar.module.css';

const NavBar = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <div className={styles.logo}>
            <BookOpen size={16} color="#ffffff" />
          </div>
          <div className={styles.brand}>Publications</div>
        </div>
        
        <div className={styles.rightSection}>
          <span className={styles.userName}>Admin</span>
          <div className={styles.userAvatar}>
            <span className={styles.userInitial}>A</span>
          </div>
          <button className={styles.logoutButton}>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
