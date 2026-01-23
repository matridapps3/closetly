import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createBatch,
  createDefaultCategory,
  processBatchComplete,
  processBatchDispatch,
  processItemAcquisition,
  processItemRetirement,
  processItemToss,
  WardrobeAnalyticsEngine
} from './WardrobeEngine';

const WardrobeContext = createContext();

// Storage keys
const STORAGE_KEYS = {
  CATEGORIES: '@wardrobe_categories',
  BATCHES: '@wardrobe_batches',
  LAUNDRY_HISTORY: '@wardrobe_laundry_history',
  BAG_CONTENTS: '@wardrobe_bag_contents',
  BAG_COUNT: '@wardrobe_bag_count',
};

// Helper functions kept for potential future use (e.g., reset to defaults feature)
// But new users start with empty state

export const WardrobeProvider = ({ children }) => {
  // --- STATE ---
  // Start with empty state for new users
  const [categories, setCategories] = useState([]);
  const [batches, setBatches] = useState([]);
  const [laundryHistory, setLaundryHistory] = useState([]);
  const [bagContents, setBagContents] = useState({});
  const [bagCount, setBagCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const batchesRef = useRef(batches);
  const hasUserMadeChanges = useRef(false); // Track if user has made any changes
  
  // Keep ref in sync with state
  useEffect(() => {
    batchesRef.current = batches;
  }, [batches]);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedCategories, storedBatches, storedLaundryHistory, storedBagContents, storedBagCount] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES),
          AsyncStorage.getItem(STORAGE_KEYS.BATCHES),
          AsyncStorage.getItem(STORAGE_KEYS.LAUNDRY_HISTORY),
          AsyncStorage.getItem(STORAGE_KEYS.BAG_CONTENTS),
          AsyncStorage.getItem(STORAGE_KEYS.BAG_COUNT),
        ]);

        // Check if user has existing data (not a new user)
        const hasExistingData = storedCategories || storedBatches || storedLaundryHistory;
        
        if (hasExistingData) {
          // User has existing data, mark that changes have been made (so we save future changes)
          hasUserMadeChanges.current = true;
        }

        if (storedCategories) {
          const parsed = JSON.parse(storedCategories);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCategories(parsed);
          }
        }

        if (storedBatches) {
          const parsed = JSON.parse(storedBatches);
          if (Array.isArray(parsed)) {
            setBatches(parsed);
          }
        }

        if (storedLaundryHistory) {
          const parsed = JSON.parse(storedLaundryHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLaundryHistory(parsed);
          }
        }

        if (storedBagContents) {
          const parsed = JSON.parse(storedBagContents);
          if (parsed && typeof parsed === 'object') {
            setBagContents(parsed);
            // Recalculate bagCount from bagContents to ensure synchronization
            const calculatedCount = Object.values(parsed).reduce((sum, count) => sum + (Number(count) || 0), 0);
            setBagCount(calculatedCount);
          }
        } else if (storedBagCount) {
          // If bagContents doesn't exist but bagCount does, reset bagCount to 0
          // (this shouldn't happen, but ensures consistency)
          setBagCount(0);
        }

        // New users start with completely empty state (no default categories)
        // Users can add categories manually when they're ready
      } catch (error) {
        console.error('Error loading data from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save data to storage whenever it changes (but only after user has made changes)
  useEffect(() => {
    // Don't save during initial load
    if (isLoading) {
      return;
    }

    // Only save if user has made changes (not just loading existing data)
    if (!hasUserMadeChanges.current) {
      return;
    }

    const saveData = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)),
          AsyncStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches)),
          AsyncStorage.setItem(STORAGE_KEYS.LAUNDRY_HISTORY, JSON.stringify(laundryHistory)),
          AsyncStorage.setItem(STORAGE_KEYS.BAG_CONTENTS, JSON.stringify(bagContents)),
          AsyncStorage.setItem(STORAGE_KEYS.BAG_COUNT, String(bagCount)),
        ]);
      } catch (error) {
        console.error('Error saving data to storage:', error);
      }
    };

    saveData();
  }, [categories, batches, laundryHistory, bagContents, bagCount, isLoading]);

  // --- ENGINE ---
  const { flowScore, insights } = useMemo(() => {
    const engine = new WardrobeAnalyticsEngine(categories, batches, laundryHistory);
    return {
      flowScore: engine.calculateFlowScore(),
      insights: engine.generateInsights(),
    };
  }, [categories, batches, laundryHistory]);

  // --- ACTIONS ---
  // Helper to mark that user has made changes (triggers saving)
  const markUserChanged = () => {
    if (!isLoading) {
      hasUserMadeChanges.current = true;
    }
  };

  const dispatchLaundry = (bagContents) => {
    markUserChanged();
    const newBatch = createBatch(`BATCH_${Date.now()}`, bagContents);
    setBatches(prev => [...prev, newBatch]);
    setCategories(prev => {
      const updated = processBatchDispatch(prev, bagContents);
      // Automatically remove categories with 0 items
      return updated.filter(cat => cat.totalOwned > 0);
    });
    // Clear the bag after dispatching
    setBagContents({});
    setBagCount(0);
  };

  const addToBag = (categoryName, count = 1) => {
    markUserChanged();
    setBagContents((prev) => ({
      ...prev,
      [categoryName]: (prev[categoryName] || 0) + count,
    }));
    setBagCount((prev) => prev + count);
  };

  const clearBag = () => {
    markUserChanged();
    setBagContents({});
    setBagCount(0);
  };

  const completeBatch = (batchId) => {
    markUserChanged();
    // Get the current batch from ref to avoid stale closure
    const batch = batchesRef.current.find(b => b.id === batchId);
    if (!batch) return;

    const completedBatch = {
      ...batch,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    // Update all states (React will batch these updates automatically)
    setBatches(prev => prev.map(b => b.id === batchId ? completedBatch : b));
    setCategories(prev => {
      const updated = processBatchComplete(prev, batch.contents);
      // Automatically remove categories with 0 items
      return updated.filter(cat => cat.totalOwned > 0);
    });
    setLaundryHistory(prev => [...prev, completedBatch]);
  };

  const tossItem = (categoryId, count = 1) => {
    markUserChanged();
    setCategories(prev => {
      const updated = processItemToss(prev, categoryId, count);
      // Automatically remove categories with 0 items
      return updated.filter(cat => cat.totalOwned > 0);
    });
  };

  const acquireItem = (categoryId, count = 1, price = 0) => {
    markUserChanged();
    setCategories(prev => {
      const updated = processItemAcquisition(prev, categoryId, count, price);
      // Automatically remove categories with 0 items (shouldn't happen here, but safety check)
      return updated.filter(cat => cat.totalOwned > 0);
    });
  };

  const retireItem = (id, count, reason) => {
    markUserChanged();
    setCategories(prev => {
      const updated = processItemRetirement(prev, id, count, reason);
      // Automatically remove categories with 0 items
      return updated.filter(cat => cat.totalOwned > 0);
    });
  };

  const updateCategoryHibernation = (categoryId, hibernated) => {
    markUserChanged();
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, hibernated } : cat
    ));
  };

  const addCategory = (name, emoji, initialCount = 0) => {
    markUserChanged();
    const newId = String(Date.now());
    const newCategory = createDefaultCategory(newId, name, emoji, initialCount);
    setCategories(prev => {
      const updated = [...prev, newCategory];
      // Only filter out categories with 0 items if initialCount is 0 (user explicitly created empty category)
      // Otherwise, allow categories to exist even if they have 0 items (user might add items later)
      if (initialCount === 0) {
        return updated.filter(cat => cat.totalOwned > 0);
      }
      return updated;
    });
  };

  const removeCategory = (categoryId) => {
    markUserChanged();
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  // Don't render children until data is loaded
  if (isLoading) {
    return null; // Or you can return a loading spinner component
  }

  return (
    <WardrobeContext.Provider value={{ 
      categories, 
      batches, 
      laundryHistory,
      bagContents,
      bagCount,
      flowScore, 
      insights, 
      dispatchLaundry, 
      completeBatch,
      retireItem,
      tossItem,
      acquireItem,
      addToBag,
      clearBag,
      updateCategoryHibernation,
      addCategory,
      removeCategory,
    }}>
      {children}
    </WardrobeContext.Provider>
  );
};
export const useWardrobe = () => useContext(WardrobeContext);