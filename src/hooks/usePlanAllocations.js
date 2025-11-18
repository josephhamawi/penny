import { useState, useEffect } from 'react';
import { subscribeToPlans } from '../services/planService';
import { processIncomeAllocations, getAllocationSummary } from '../services/planAllocationService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for Plan allocations
 * Manages real-time plan updates and automatic allocation processing
 *
 * Returns:
 * - plans: Array of plan objects
 * - loading: Boolean
 * - error: Error object or null
 * - processAllocations: Function to trigger allocation processing
 * - allocationSummary: Summary statistics
 */
export const usePlanAllocations = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allocationSummary, setAllocationSummary] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    console.log('[usePlanAllocations] Setting up subscription for user:', user.uid);
    setLoading(true);
    setError(null);

    // Subscribe to real-time plan updates
    const unsubscribe = subscribeToPlans(user.uid, (updatedPlans) => {
      console.log('[usePlanAllocations] Received plans update:', updatedPlans.length);
      setPlans(updatedPlans);
      setLoading(false);

      // Load allocation summary
      loadAllocationSummary();
    });

    // Initial allocation processing
    handleProcessAllocations();

    return () => {
      console.log('[usePlanAllocations] Cleaning up subscription');
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const loadAllocationSummary = async () => {
    try {
      if (!user || !user.uid) return;

      const summary = await getAllocationSummary(user.uid);
      setAllocationSummary(summary);
    } catch (err) {
      console.error('[usePlanAllocations] Error loading allocation summary:', err);
    }
  };

  const handleProcessAllocations = async () => {
    try {
      if (!user || !user.uid) return;
      if (processing) return; // Prevent duplicate processing

      setProcessing(true);
      console.log('[usePlanAllocations] Processing income allocations...');

      const result = await processIncomeAllocations(user.uid);
      console.log('[usePlanAllocations] Processing complete:', result);

      // Reload summary after processing
      await loadAllocationSummary();

      setProcessing(false);
      return result;
    } catch (err) {
      console.error('[usePlanAllocations] Error processing allocations:', err);
      setError(err);
      setProcessing(false);
      throw err;
    }
  };

  return {
    plans,
    loading,
    error,
    processAllocations: handleProcessAllocations,
    allocationSummary,
    processing
  };
};

export default usePlanAllocations;
