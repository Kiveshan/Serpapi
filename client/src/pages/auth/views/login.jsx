import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Eye, ArrowRight } from 'lucide-react';
import NavBar from '../../../components/NavBar';
import Footer from '../../../components/Footer';
import styles from '../css/login.module.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    navigate('/search');
  };

  return (
    <div className={styles.page}>
      <NavBar />

      <main className={styles.main}>
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <div className={styles.topBar} />

            <div className={styles.content}>
              <h1 className={styles.title}>Welcome to Publications</h1>

              <form onSubmit={onSubmit} className={styles.form}>
                <label className={styles.label}>Email address</label>
                <div className={styles.field}>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                    required
                    className={`${styles.input} ${styles.inputWithLeftIcon}`}
                  />
                  <Mail size={16} className={styles.leftIcon} />
                </div>

                <div className={styles.spacer} />

                <label className={styles.label}>Password</label>
                <div className={styles.field}>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`${styles.input} ${styles.inputWithRightIcon}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className={styles.iconButton}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Eye size={16} color="#9CA3AF" />
                  </button>
                </div>

                <button type="submit" className={styles.primaryButton}>
                  Login <ArrowRight size={16} />
                </button>

                <div className={styles.kicker}>NEW TO PUBLICATIONS?</div>

                <button type="button" onClick={() => navigate('/register')} className={styles.secondaryButton}>
                  Register
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;