import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import NavBar from '../../../components/NavBar';
import Footer from '../../../components/Footer';
import styles from '../css/landingPage.module.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <NavBar />

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.kicker}>
            Introducing Publications
          </div>

          <h1 className={styles.title}>
            Refine Your
            <br />
            <span className={styles.titleAccent}>Publications</span>
          </h1>

          <p className={styles.description}>
            Publications management is the process of organizing, tracking, and accessing all research outputs within an institution.
            It enables users to efficiently search for publications using filters such as author, title, keywords, institution, or
            publication date.
          </p>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className={styles.cta}
          >
            Log in <ArrowRight size={16} />
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;