import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { translate } from '../utils/i18n';

/**
 * Translator for static interface copy.
 *
 * Call sites pass the English string, so an entry missing from the French
 * table renders in English rather than as a broken key.
 */
export function useT(): (text: string) => string {
  const { locale } = useApp();
  return useCallback((text: string) => translate(text, locale), [locale]);
}