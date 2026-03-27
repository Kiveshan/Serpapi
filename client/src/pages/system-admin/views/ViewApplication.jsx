import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, FileText, X, XCircle } from 'lucide-react';
import NavBar from '../../../components/NavBar';
import Footer from '../../../components/Footer';
import Button from '../../../components/Button';
import ConfirmationModal from '../../../components/ConfirmationModal';
import styles from '../css/ViewApplication.module.css';

const ViewApplication = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const user = useMemo(
    () => ({
      id,
      fullName: 'John Doe',
      email: 'johndoe@email.com',
      role: 'Research Admin',
      institution: 'XYZ University',
      submittedAt: 'Oct 24, 2023 at 10:30 AM',
      documentName: 'John Doe_ID_Verification.pdf',
      documentMeta: '1.2 MB • PDF Document',
    }),
    [id]
  );

  const [status, setStatus] = useState('pending');
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState('success');
  const [toastTitle, setToastTitle] = useState('');

  const showToast = ({ title, variant }) => {
    setToastTitle(title);
    setToastVariant(variant);
    setToastOpen(true);
  };

  const handleApprove = () => {
    setStatus('approved');
    showToast({
      title: 'Approved',
      variant: 'success',
    });
  };

  const handleReject = () => {
    setStatus('rejected');
    showToast({
      title: 'Rejected',
      variant: 'error',
    });
  };

  const isPending = status === 'pending';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

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
              <div className={styles.subtitle}>Submitted on {user.submittedAt}</div>
            </div>
            {isPending && <div className={styles.pendingPill}>Pending</div>}
          </div>

          <div className={`${styles.grid} ${!isPending ? styles.gridSingle : ''}`}>
            <div className={`${styles.leftColumn} ${!isPending ? styles.leftColumnSingle : ''}`}>
              <section className={styles.card}>
                <div className={styles.cardHeader}>Personal Information</div>
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Full Name</div>
                    <div className={styles.infoValue}>{user.fullName}</div>
                  </div>
                  <div className={styles.divider} />
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Email Address</div>
                    <div className={styles.infoValue}>{user.email}</div>
                  </div>
                  <div className={styles.divider} />
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Role</div>
                    <div className={styles.infoValue}>{user.role}</div>
                  </div>
                  <div className={styles.divider} />
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Institution</div>
                    <div className={styles.infoValue}>{user.institution}</div>
                  </div>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeader}>Uploaded Document</div>
                <div className={styles.cardBody}>
                  <div className={styles.documentRow}>
                    <div className={styles.documentIcon}>
                      <FileText size={18} />
                    </div>
                    <div className={styles.documentMeta}>
                      <div className={styles.documentName}>{user.documentName}</div>
                      <div className={styles.documentSub}>{user.documentMeta}</div>
                    </div>
                    <Button className={styles.downloadButton} onClick={() => { }}>
                      <Download size={16} />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              </section>
            </div>

            {isPending && (
              <div className={styles.rightColumn}>
                <section className={styles.decisionCard}>
                  <div className={styles.decisionTitle}>Admin Decision</div>
                  <div className={styles.decisionActions}>
                    <Button className={styles.approveButton} onClick={handleApprove}>
                      <CheckCircle2 size={16} />
                      <span>Approve</span>
                    </Button>
                    <Button className={styles.rejectButton} onClick={handleReject}>
                      <XCircle size={16} />
                      <span>Reject</span>
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