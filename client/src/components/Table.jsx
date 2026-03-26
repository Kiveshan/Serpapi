import React from 'react';
import styles from './css/Table.module.css';

const Table = ({ headers, data, onAction, actionLabel = 'View' }) => {
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

  const getActionClass = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'rejected':
        return styles.disabledAction;
      default:
        return styles.action;
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
                  className={getActionClass(row.status)}
                  onClick={() => onAction?.(row.id)}
                  disabled={row.status.toLowerCase() !== 'pending'}
                >
                  {actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;