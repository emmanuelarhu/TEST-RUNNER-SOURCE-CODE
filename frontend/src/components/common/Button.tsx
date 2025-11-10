import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

const Button = ({ variant = 'primary', children, className = '', ...props }: ButtonProps) => {
  const variantClass = { primary: styles.btnPrimary, secondary: styles.btnSecondary, danger: styles.btnDanger }[variant];
  return <button className={`${styles.btn} ${variantClass} ${className}`} {...props}>{children}</button>;
};

export default Button;
