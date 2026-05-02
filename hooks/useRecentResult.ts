/**
 * useRecentResult — hook for reading and persisting the most recent AnalysisResult.
 *
 * Requirements: 5.11, 1.5
 */

import { saveRecentResult } from '../lib/storage';
import { AnalysisResult } from '../types';
import { useAppContext } from './useAppContext';

interface UseRecentResultResult {
  /** The most recent analysis result, or null if none has been saved. */
  result: AnalysisResult | null;
  /**
   * Persists the result to AsyncStorage and updates the context.
   */
  saveResult: (result: AnalysisResult) => Promise<void>;
}

/**
 * Hook for reading and persisting the most recent AnalysisResult.
 *
 * Must be used inside an `AppContextProvider`.
 */
export function useRecentResult(): UseRecentResultResult {
  const { recentResult, setRecentResult } = useAppContext();

  async function saveResult(result: AnalysisResult): Promise<void> {
    await saveRecentResult(result);
    setRecentResult(result);
  }

  return {
    result: recentResult,
    saveResult,
  };
}
