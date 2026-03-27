import React from 'react';
import styles from './css/Button.module.css';

const Button = ({
  children,
  className = '',
  type = 'button',
  disabled = false,
  onClick,
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${styles.button} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;