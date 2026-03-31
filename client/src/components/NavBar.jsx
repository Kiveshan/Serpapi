import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './css/NavBar.module.css';
import { Layers } from 'lucide-react';
import { authAPI } from '../api/auth/auth';

const NavBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove token from localStorage
    authAPI.removeToken();
    
    // Navigate to landing page
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <div className={styles.logo}>
            <Layers size={16} color="#ffffff" />
          </div>
          <div className={styles.brand}>RESMA Publications</div>
        </div>
        
        <div className={styles.rightSection}>
          <span className={styles.userName}>Admin</span>
          <div className={styles.userAvatar}>
            <span className={styles.userInitial}>A</span>
          </div>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
