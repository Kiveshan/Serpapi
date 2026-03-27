import React, { useEffect } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import styles from './css/ConfirmationModal.module.css';

const ConfirmationModal = ({
  isOpen,
  title,
  variant = 'success',
  durationMs = 2600,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      onClose?.();
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [durationMs, isOpen, onClose]);

  if (!isOpen) return null;

  const Icon = variant === 'error' ? XCircle : CheckCircle2;

  return (
    <div className={styles.toastOverlay} role="presentation">
      <div
        className={`${styles.toast} ${variant === 'error' ? styles.toastError : styles.toastSuccess}`}
        style={{ '--toast-duration': `${durationMs}ms` }}
        role="status"
        aria-live="polite"
      >
        <div className={styles.toastLeft}>
          <div className={styles.toastIcon}>
            <Icon size={18} />
          </div>
          <div className={styles.toastContent}>
            {title && <div className={styles.toastTitle}>{title}</div>}
          </div>
        </div>

        <button className={styles.toastClose} onClick={onClose} type="button" aria-label="Close">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ConfirmationModal;