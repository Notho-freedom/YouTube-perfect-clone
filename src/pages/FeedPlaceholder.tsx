import React from 'react';
import { EmptyState, type EmptyArt } from '../components/ui/EmptyState';

interface FeedPlaceholderProps {
  title: string;
  description?: string;
  art?: EmptyArt;
}

/**
 * Page-level empty surface. Everything routes through EmptyState so that every
 * dead end in the app — a missing channel, an unloadable list, an exhausted
 * quota — looks the way YouTube's own does, instead of each page inventing its
 * own wording and layout.
 */
export function FeedPlaceholder({ title, description, art = 'error' }: FeedPlaceholderProps) {
  return <EmptyState art={art} title={title} description={description} />;
}