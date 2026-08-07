import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  value?: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  value,
  subtext,
  icon,
  children,
  className = '',
}) => {
  return (
    <div className={`${styles.card} ${className}`}>
      {title && (
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          {icon && <span className={styles.icon}>{icon}</span>}
        </div>
      )}
      {value !== undefined && <div className={styles.value}>{value}</div>}
      {subtext && <div className={styles.subtext}>{subtext}</div>}
      {children}
    </div>
  );
};
