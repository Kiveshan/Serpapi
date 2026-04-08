import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, FileText, X, XCircle } from 'lucide-react';
import NavBar from '../../../components/NavBar';
import Footer from '../../../components/Footer';
import Button from '../../../components/Button';
import ConfirmationModal from '../../../components/ConfirmationModal';
import styles from '../css/ViewApplication.module.css';
import { authAPI } from '../../../api/auth/auth';
import { applicationsAPI } from '../../../api/systemadmin/applications';

const ViewApplication = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState('success');
  const [toastTitle, setToastTitle] = useState('');

  // Check authentication and fetch user data
  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        const token = authAPI.getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        const currentUser = await authAPI.getProfile(token);
        
        // Check if user is System Admin (roleid = 1)
        if (currentUser.roleid !== 1) {
          navigate('/search');
          return;
        }

        // Fetch user application details
        const userData = await applicationsAPI.getApplicationById(id);
        setUser(userData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load user details. Please try again.');
        setLoading(false);
      }
    };

    checkAuthAndFetchUser();
  }, [id, navigate]);

  const showToast = ({ title, variant }) => {
    setToastTitle(title);
    setToastVariant(variant);
    setToastOpen(true);
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await applicationsAPI.updateApplicationStatus(id, 'approved', true);
      
      // Update local state
      setUser(prev => ({ ...prev, status: 'approved', enabled: true }));
      
      showToast({
        title: 'Application Approved',
        variant: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Failed to Approve',
        variant: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await applicationsAPI.updateApplicationStatus(id, 'rejected', false);
      
      // Update local state
      setUser(prev => ({ ...prev, status: 'rejected', enabled: false }));
      
      showToast({
        title: 'Application Rejected',
        variant: 'error',
      });
    } catch (err) {
      showToast({
        title: 'Failed to Reject',
        variant: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const isPending = user?.status === 'pending';
  const isApproved = user?.status === 'approved';
  const isRejected = user?.status === 'rejected';

  // Extract filename from certificate link
  const getFileNameFromUrl = (url) => {
    if (!url) return 'Document';
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    return fileName || 'Document';
  };

  // Handle document download
  const handleDownloadDocument = async () => {
    if (user?.certificatelink) {
      try {
        const { signedUrl } = await applicationsAPI.getDocumentUrl(user.userid);
        window.open(signedUrl, '_blank');
      } catch (error) {
        console.error('Failed to get document URL:', error);
        // Fallback to direct link if signed URL fails
        window.open(user.certificatelink, '_blank');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className={styles.page}>
        <NavBar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.loadingCard}>
              <div className={styles.loadingText}>Loading user details...</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.page}>
        <NavBar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.errorCard}>
              <div className={styles.errorText}>{error}</div>
              <Button className={styles.retryButton} onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <NavBar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.topBar}>
            <Button className={styles.backButton} onClick={() => navigate('/system-admin/registrations')}>
              <ArrowLeft size={16} />
              <span>Back to list</span>
            </Button>
          </div>

          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>User Details</h1>
              <div className={styles.subtitle}>Submitted on {formatDate(user.dateentered)}</div>
            </div>
            {isPending && <div className={styles.pendingPill}>Pending</div>}
            {isApproved && <div className={styles.approvedPill}>Approved</div>}
            {isRejected && <div className={styles.rejectedPill}>Rejected</div>}
          </div>

          <div className={`${styles.grid} ${!isPending ? styles.gridSingle : ''}`}>
            <div className={`${styles.leftColumn} ${!isPending ? styles.leftColumnSingle : ''}`}>
              <section className={styles.card}>
                <div className={styles.cardHeader}>Personal Information</div>
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Full Name</div>
                    <div className={styles.infoValue}>{user.fullname}</div>
                  </div>
                  <div className={styles.divider} />
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Email Address</div>
                    <div className={styles.infoValue}>{user.institutionemail}</div>
                  </div>
                  <div className={styles.divider} />
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Role</div>
                    <div className={styles.infoValue}>{user.rolename}</div>
                  </div>
                  <div className={styles.divider} />
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Institution</div>
                    <div className={styles.infoValue}>{user.institution || user.otherinstitution || 'Not specified'}</div>
                  </div>
                  <div className={styles.divider} />
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Account Status</div>
                    <div className={styles.infoValue}>
                      <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                  <div className={styles.divider} />
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Account Enabled</div>
                    <div className={styles.infoValue}>
                      <span className={`${styles.enabledBadge} ${styles[user.enabled ? 'enabled' : 'disabled']}`}>
                        {user.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeader}>Uploaded Document</div>
                <div className={styles.cardBody}>
                  {user?.certificatelink ? (
                    <div className={styles.documentRow}>
                      <div className={styles.documentIcon}>
                        <FileText size={18} />
                      </div>
                      <div className={styles.documentMeta}>
                        <div className={styles.documentName}>Certification Document</div>
                        <div className={styles.documentSub}>{getFileNameFromUrl(user.certificatelink)}</div>
                      </div>
                      <Button 
                        className={styles.downloadButton} 
                        onClick={handleDownloadDocument}
                      >
                        <Download size={16} />
                        <span>View</span>
                      </Button>
                    </div>
                  ) : (
                    <div className={styles.documentRow}>
                      <div className={styles.documentIcon}>
                        <FileText size={18} />
                      </div>
                      <div className={styles.documentMeta}>
                        <div className={styles.documentName}>No Document Uploaded</div>
                        <div className={styles.documentSub}>User has not uploaded any certificate</div>
                      </div>
                      <Button className={styles.downloadButton} disabled>
                        <Download size={16} />
                        <span>No Document</span>
                      </Button>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {isPending && (
              <div className={styles.rightColumn}>
                <section className={styles.decisionCard}>
                  <div className={styles.decisionTitle}>Admin Decision</div>
                  <div className={styles.decisionActions}>
                    <Button 
                      className={styles.approveButton} 
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 size={16} />
                      <span>{actionLoading ? 'Approving...' : 'Approve'}</span>
                    </Button>
                    <Button 
                      className={styles.rejectButton} 
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      <XCircle size={16} />
                      <span>{actionLoading ? 'Rejecting...' : 'Reject'}</span>
                    </Button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <ConfirmationModal
        isOpen={toastOpen}
        title={toastTitle}
        variant={toastVariant}
        durationMs={2600}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
};

export default ViewApplication;