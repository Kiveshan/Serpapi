import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowLeft } from 'lucide-react';
import NavBar from '../../../components/NavBar';
import Footer from '../../../components/Footer';
import styles from '../css/register.module.css';

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [institutionEmail, setInstitutionEmail] = useState('');
  const [role, setRole] = useState('Research Admin');
  const [password, setPassword] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      <NavBar />

      <main className={styles.main}>
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <div className={styles.topBar} />

            <div className={styles.content}>
              <h1 className={styles.title}>Register</h1>
              <div className={styles.subtitle}>Submit your details to request access to the Publications platform.</div>

              <form onSubmit={onSubmit} className={styles.form}>
                <div className={styles.grid}>
                  <div>
                    <label className={styles.label}>Full name *</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane"
                      required
                      className={styles.input}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Institution *</label>
                    <input
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. Stanford University"
                      required
                      className={styles.input}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Institution Email *</label>
                    <input
                      value={institutionEmail}
                      onChange={(e) => setInstitutionEmail(e.target.value)}
                      placeholder="jane.smith@university.edu"
                      type="email"
                      required
                      className={styles.input}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Role *</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} required className={styles.select}>
                      <option value="Research Admin">Research Admin</option>
                      <option value="Researcher">Researcher</option>
                      <option value="Librarian">Librarian</option>
                    </select>
                  </div>

                  <div>
                    <label className={styles.label}>Password *</label>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      required
                      className={styles.input}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Certificate</label>
                    <div className={styles.upload}>
                      <Upload size={16} color="#9CA3AF" />
                      <div className={styles.uploadText}>
                        <div className={styles.uploadTitle}>Click to upload or drag and drop</div>
                        <div className={styles.uploadHint}>PDF (max. 100MB)</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className={styles.primaryButton}>
                  Submit registration
                </button>

                <div className={styles.backRow}>
                  <button type="button" onClick={() => navigate('/login')} className={styles.backButton}>
                    <ArrowLeft size={16} /> Back to login
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;