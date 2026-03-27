import React from 'react';
import Button from './Button';
import styles from './css/Table.module.css';

const Table = ({
  headers,
  data,
  onAction,
  actionLabel = 'View',
  showEnableToggle = false,
  onToggleEnabled,
}) => {

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return styles.approved;
      case 'rejected':
        return styles.rejected;
      case 'pending':
      default:
        return styles.pending;
    }
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>

            {headers.map((header, index) => (
              <th key={index} className={styles.headerCell}>
                {header}
              </th>
            ))}
            {showEnableToggle && (
              <th key="enable-toggle" className={styles.headerCell}>
                Enable/Disable
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={styles.row}>
              <td className={styles.cell}>{row.fullName}</td>
              <td className={styles.cell}>{row.role}</td>
              <td className={styles.cell}>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(row.status)}`}>
                  {row.status}
                </span>
              </td>
              <td className={styles.cell}>
                <button
                  className={styles.action}
                  onClick={() => onAction?.(row.id)}
                >
                  {actionLabel}
                </button>
              </td>
              {showEnableToggle && row.status.toLowerCase() !== 'pending' && (
                <td className={styles.cell}>
                  <Button
                    className={row.enabled ? styles.disableButton : styles.enableButton}
                    onClick={() => onToggleEnabled?.(row.id)}
                    disabled={row.status.toLowerCase() === 'pending'}
                  >
                    {row.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              )}
              {showEnableToggle && row.status.toLowerCase() === 'pending' && (
                <td className={styles.cell}></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;