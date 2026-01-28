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
  validateAndFixCategoryConsistency,
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
  const categoriesRef = useRef([]);
  const hasUserMadeChanges = useRef(false); // Track if user has made any changes
  
  // Keep refs in sync with state
  useEffect(() => {
    batchesRef.current = batches;
  }, [batches]);
  
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

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
          try {
            const parsed = JSON.parse(storedCategories);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Validate and fix data consistency issues
              const validatedCategories = validateAndFixCategoryConsistency(parsed);
              setCategories(validatedCategories);
            }
          } catch (error) {
            console.error('Error parsing stored categories:', error);
            // Continue loading other data even if categories fail
          }
        }

        if (storedBatches) {
          try {
            const parsed = JSON.parse(storedBatches);
            if (Array.isArray(parsed)) {
              setBatches(parsed);
            }
          } catch (error) {
            console.error('Error parsing stored batches:', error);
            // Continue loading other data even if batches fail
          }
        }

        if (storedLaundryHistory) {
          try {
            const parsed = JSON.parse(storedLaundryHistory);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setLaundryHistory(parsed);
            }
          } catch (error) {
            console.error('Error parsing stored laundry history:', error);
            // Continue loading other data even if history fails
          }
        }

        if (storedBagContents) {
          try {
            const parsed = JSON.parse(storedBagContents);
            if (parsed && typeof parsed === 'object') {
              // Clean up orphaned bag contents (categories that no longer exist)
              // This will be done after categories are loaded, so we'll handle it in a separate effect
              setBagContents(parsed);
              // Recalculate bagCount from bagContents to ensure synchronization
              const calculatedCount = Object.values(parsed).reduce((sum, count) => sum + (Number(count) || 0), 0);
              setBagCount(calculatedCount);
            }
          } catch (error) {
            console.error('Error parsing stored bag contents:', error);
            // Continue loading other data even if bag contents fail
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

  // Clean up orphaned bag contents when categories change
  useEffect(() => {
    if (isLoading) return;
    if (!categories || !Array.isArray(categories)) return;
    if (!bagContents || typeof bagContents !== 'object') return;
    
    // Remove bag contents for categories that no longer exist
    const categoryNames = new Set(categories.map(cat => cat && cat.name ? cat.name : null).filter(Boolean));
    const cleanedBagContents = {};
    let cleanedBagCount = 0;
    
    Object.keys(bagContents).forEach(categoryName => {
      if (categoryNames.has(categoryName)) {
        cleanedBagContents[categoryName] = bagContents[categoryName] || 0;
        cleanedBagCount += bagContents[categoryName] || 0;
      }
    });
    
    // Only update if there were orphaned items
    // Note: bagContents is intentionally not in deps to avoid infinite loop
    // This effect should only run when categories change
    const currentBagKeys = Object.keys(bagContents || {});
    if (Object.keys(cleanedBagContents).length !== currentBagKeys.length) {
      setBagContents(cleanedBagContents);
      setBagCount(cleanedBagCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, isLoading]);

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

  const dispatchLaundry = (bagContentsToDispatch) => {
    markUserChanged();
    
    // Validate input
    if (!bagContentsToDispatch || typeof bagContentsToDispatch !== 'object') {
      return;
    }
    
    // Use ref to get current categories to avoid stale closures
    // Validate and adjust bag contents against current categories
    // Note: Items in bag are already dirty (marked when tossed to hamper)
    // They're part of dirtyCount, so we validate against dirtyCount
    const currentCategories = categoriesRef.current || [];
    const validatedBagContents = {};
    let totalValidated = 0;
    
    Object.keys(bagContentsToDispatch).forEach(categoryName => {
      const countInBag = Number(bagContentsToDispatch[categoryName]) || 0;
      if (countInBag <= 0) return;
      
      const category = currentCategories.find(cat => cat && cat.name === categoryName);
      if (!category) return;
      
      // Items in bag are dirty items waiting to be washed
      // Validate: can't dispatch more than what's actually dirty
      // Items in bag should be <= dirtyCount (they're part of dirtyCount)
      const toDispatch = Math.min(countInBag, category.dirtyCount || 0);
      if (toDispatch > 0) {
        validatedBagContents[categoryName] = toDispatch;
        totalValidated += toDispatch;
      }
    });
    
    if (totalValidated === 0) {
      // No valid items to dispatch
      return;
    }
    
    // Create batch and update states
    // React will batch these updates automatically
    const newBatch = createBatch(`BATCH_${Date.now()}`, validatedBagContents);
    setBatches(prev => [...prev, newBatch]);
    setCategories(prev => {
      const updated = processBatchDispatch(prev, validatedBagContents);
      // Automatically remove categories with 0 items
      return updated.filter(cat => cat.totalOwned > 0);
    });
    
    // Clear the bag after dispatching
    setBagContents({});
    setBagCount(0);
  };

  const addToBag = (categoryName, count = 1) => {
    markUserChanged();
    
    // Validate input
    if (!categoryName || typeof categoryName !== 'string') return;
    
    // Use ref to get current categories to avoid stale closures
    const currentCategories = categoriesRef.current || [];
    const category = currentCategories.find(cat => cat && cat.name === categoryName);
    if (!category) return;
    
    // Note: When called from tossItem, items are already marked as dirty
    // The bag contains dirty items waiting to be sent to laundry
    // Since React batches state updates, we read the current state here
    const toAdd = Math.max(0, Number(count) || 0);
    if (toAdd === 0) return;
    
    setBagContents((prev) => ({
      ...prev,
      [categoryName]: (prev[categoryName] || 0) + toAdd,
    }));
    setBagCount((prev) => prev + toAdd);
  };

  const clearBag = () => {
    markUserChanged();
    setBagContents({});
    setBagCount(0);
  };

  const completeBatch = (batchId) => {
    markUserChanged();
    
    // Validate input
    if (!batchId) return;
    
    // Get the current batch from ref to avoid stale closure
    const currentBatches = batchesRef.current || [];
    const batch = currentBatches.find(b => b && b.id === batchId);
    if (!batch || !batch.contents) return;

    const completedBatch = {
      ...batch,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    // Update all states (React will batch these updates automatically)
    setBatches(prev => (prev || []).map(b => b && b.id === batchId ? completedBatch : b));
    setCategories(prev => {
      const updated = processBatchComplete(prev || [], batch.contents || {});
      // Automatically remove categories with 0 items
      return updated.filter(cat => cat && cat.totalOwned > 0);
    });
    setLaundryHistory(prev => [...(prev || []), completedBatch]);
  };

  const tossItem = (categoryId, count = 1) => {
    markUserChanged();
    if (!categoryId) return;
    setCategories(prev => {
      const updated = processItemToss(prev || [], categoryId, Number(count) || 1);
      // Automatically remove categories with 0 items
      return updated.filter(cat => cat && cat.totalOwned > 0);
    });
  };

  const acquireItem = (categoryId, count = 1, price = 0) => {
    markUserChanged();
    if (!categoryId) return;
    setCategories(prev => {
      const updated = processItemAcquisition(prev || [], categoryId, Number(count) || 1, Number(price) || 0);
      // Automatically remove categories with 0 items (shouldn't happen here, but safety check)
      return updated.filter(cat => cat && cat.totalOwned > 0);
    });
  };

  const retireItem = (id, count, reason) => {
    markUserChanged();
    if (!id) return;
    setCategories(prev => {
      const updated = processItemRetirement(prev || [], id, Number(count) || 1, reason || 'worn_out');
      // Automatically remove categories with 0 items
      return updated.filter(cat => cat && cat.totalOwned > 0);
    });
  };

  const updateCategoryHibernation = (categoryId, hibernated) => {
    markUserChanged();
    if (!categoryId) return;
    setCategories(prev => (prev || []).map(cat => 
      cat && cat.id === categoryId ? { ...cat, hibernated: Boolean(hibernated) } : cat
    ));
  };

  const addCategory = (name, emoji, initialCount = 1) => {
    markUserChanged();
    if (!name || typeof name !== 'string' || !name.trim()) return;
    const newId = String(Date.now());
    const newCategory = createDefaultCategory(newId, name.trim(), emoji || '👕', Number(initialCount) || 1);
    setCategories(prev => {
      const updated = [...(prev || []), newCategory];
      // Only filter out categories with 0 items if initialCount is explicitly 0 (user created empty category)
      // Otherwise, allow categories to exist even if they have 0 items (user might add items later)
      if (initialCount === 0) {
        return updated.filter(cat => cat && cat.totalOwned > 0);
      }
      return updated;
    });
  };

  const removeCategory = (categoryId) => {
    markUserChanged();
    if (!categoryId) return;
    
    // Use refs to get current state to avoid stale closures
    const currentCategories = categoriesRef.current || [];
    const categoryToRemove = currentCategories.find(cat => cat && cat.id === categoryId);
    
    setCategories(prev => (prev || []).filter(cat => cat && cat.id !== categoryId));
    
    // Clean up bag contents if this category had items in bag
    // Use functional update to get current bagContents
    setBagContents(prev => {
      const currentBagContents = prev || {};
      if (categoryToRemove && categoryToRemove.name && currentBagContents[categoryToRemove.name]) {
        const itemsInBag = Number(currentBagContents[categoryToRemove.name]) || 0;
        setBagCount(currentBagCount => Math.max(0, (currentBagCount || 0) - itemsInBag));
        const updated = { ...currentBagContents };
        delete updated[categoryToRemove.name];
        return updated;
      }
      return currentBagContents;
    });
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