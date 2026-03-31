import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import NavBar from '../../../components/NavBar';
import Footer from '../../../components/Footer';
import styles from '../css/register.module.css';
import { registerAPI } from '../../../api/register/register';

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [otherInstitution, setOtherInstitution] = useState('');
  const [institutionEmail, setInstitutionEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [password, setPassword] = useState('');
  const [certificateFile, setCertificateFile] = useState(null);

  // Data from API
  const [institutions, setInstitutions] = useState([]);
  const [roles, setRoles] = useState([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch institutions and roles on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [institutionsData, rolesData] = await Promise.all([
          registerAPI.getInstitutions(),
          registerAPI.getRoles()
        ]);
        setInstitutions(institutionsData);
        setRoles(rolesData);

        // Set default role to first available role (excluding System Admin)
        const availableRoles = rolesData.filter(role => role.roleid !== 1);
        if (availableRoles.length > 0) {
          setRoleId(availableRoles[0].roleid);
        }
      } catch (err) {
        setError('Failed to load form data. Please refresh the page.');
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate certificate file is required
    if (!certificateFile) {
      setError('Certificate file is required for registration');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add form fields
      formData.append('fullname', fullName);
      formData.append('institutionemail', institutionEmail);
      formData.append('password', password);
      formData.append('roleid', roleId);
      
      // Set institution based on selection
      if (institutionId === 'other') {
        formData.append('otherinstitution', otherInstitution);
      } else {
        formData.append('institutionid', institutionId);
      }
      
      // Add certificate file
      formData.append('certificate', certificateFile);

      const response = await registerAPI.register(formData);

      setSuccess('Registration successful!');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

              {/* Error and Success Messages */}
              {error && (
                <div className={styles.errorMessage}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              {success && (
                <div className={styles.successMessage}>
                  <CheckCircle size={16} />
                  {success}
                </div>
              )}

              <form onSubmit={onSubmit} className={styles.form}>
                <div className={styles.grid}>
                  <div>
                    <label className={styles.label}>Full name *</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Smith"
                      required
                      className={styles.input}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Institution *</label>
                    <select 
                      value={institutionId} 
                      onChange={(e) => setInstitutionId(e.target.value)} 
                      required 
                      className={styles.select}
                      disabled={loading}
                    >
                      <option value="">Select an institution</option>
                      {institutions.map((institution) => (
                        <option key={institution.instid} value={institution.instid}>
                          {institution.institution}
                        </option>
                      ))}
                      <option value="other">Other (specify below)</option>
                    </select>
                  </div>

                  {institutionId === 'other' && (
                    <div>
                      <label className={styles.label}>Other Institution *</label>
                      <input
                        value={otherInstitution}
                        onChange={(e) => setOtherInstitution(e.target.value)}
                        placeholder="Enter your institution name"
                        required
                        className={styles.input}
                        disabled={loading}
                      />
                    </div>
                  )}

                  <div>
                    <label className={styles.label}>Institution Email *</label>
                    <input
                      value={institutionEmail}
                      onChange={(e) => setInstitutionEmail(e.target.value)}
                      placeholder="jane.smith@university.edu"
                      type="email"
                      required
                      className={styles.input}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Role *</label>
                    <select 
                      value={roleId} 
                      onChange={(e) => setRoleId(e.target.value)} 
                      required 
                      className={styles.select}
                      disabled={loading}
                    >
                      <option value="">Select a role</option>
                      {roles.filter(role => role.roleid !== 1).map((role) => (
                        <option key={role.roleid} value={role.roleid}>
                          {role.rolename}
                        </option>
                      ))}
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
                      disabled={loading}
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Certificate *</label>
                    <input
                      className={styles.hiddenFileInput}
                      id="certificate"
                      type="file"
                      accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                        setCertificateFile(file);
                      }}
                      disabled={loading}
                    />
                    <label className={styles.upload} htmlFor="certificate">
                      <Upload size={16} className={styles.uploadIcon} />
                      <div className={styles.uploadText}>
                        <div className={styles.uploadTitle}>Click to upload or drag and drop</div>
                        <div className={styles.uploadHint}>PDF or Word document (max. 100MB)</div>
                        {certificateFile ? <div className={styles.fileName}>{certificateFile.name}</div> : null}
                      </div>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={styles.primaryButton}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit registration'}
                </button>

                <div className={styles.backRow}>
                  <button 
                    type="button" 
                    onClick={() => navigate('/login')} 
                    className={styles.backButton}
                    disabled={loading}
                  >
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