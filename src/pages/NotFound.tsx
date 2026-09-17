import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';

/**
 * YouTube's 404 keeps the whole app around it — masthead, guide, everything —
 * and only replaces the content column. It is not a bare error page, which is
 * why this renders inside the normal shell like any other route.
 */
export function NotFound() {
  return (
    <EmptyState
      art="lost"
      title="This page isn't available. Sorry about that."
      description="Try searching for something else."
      action={
      <Link
        to="/"
        className="flex h-9 items-center rounded-full bg-yt-inverse px-4 text-[14px] font-medium leading-none text-yt-inverseText transition-opacity duration-150 hover:opacity-90">
        
          Go to home
        </Link>
      } />);


}