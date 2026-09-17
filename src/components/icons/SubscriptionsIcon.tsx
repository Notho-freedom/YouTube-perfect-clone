import React from 'react';

interface SubscriptionsIconProps {
  className?: string;
}

export function SubscriptionsIcon({ className = 'h-6 w-6' }: SubscriptionsIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M10 18v-6l5 3-5 3zm7-15H7v1h10V3zm3 3H4v1h16V6zm2 3H2v12h20V9zm-1 11H3V10h18v10z" />
    </svg>);

}