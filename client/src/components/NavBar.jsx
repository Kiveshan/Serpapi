import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './css/NavBar.module.css';
import { Layers } from 'lucide-react';
import { authAPI } from '../api/auth/auth';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';

  // Fetch user data if not on landing page
  useEffect(() => {
    if (!isLandingPage) {
      const fetchUserData = async () => {
        try {
          const token = authAPI.getToken();
          if (token) {
            const userData = await authAPI.getProfile(token);
            setUser(userData);
          } else {
            // No token found, ensure user state is null
            setUser(null);
          }
        } catch (err) {
          // If token is invalid, clear it and reset user state
          authAPI.removeToken();
          setUser(null);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    } else {
      setLoading(false);
      setUser(null);
    }
  }, [isLandingPage]);

  const handleLogout = () => {
    // Remove token from localStorage and reset user state
    authAPI.removeToken();
    setUser(null);
    
    // Navigate to landing page
    navigate('/');
  };

  // Get user initial from full name
  const getUserInitial = (fullName) => {
    if (!fullName) return 'U';
    return fullName.charAt(0).toUpperCase();
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
        
        {/* Only show user info if not on landing page and user is logged in */}
        {!isLandingPage && !loading && user && (
          <div className={styles.rightSection}>
            <span className={styles.userName}>{user.fullname || 'User'}</span>
            <div className={styles.userAvatar}>
              <span className={styles.userInitial}>{getUserInitial(user.fullname)}</span>
            </div>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default NavBar;
