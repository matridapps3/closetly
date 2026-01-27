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
    
    // Remove bag contents for categories that no longer exist
    const categoryNames = new Set(categories.map(cat => cat.name));
    const cleanedBagContents = {};
    let cleanedBagCount = 0;
    
    Object.keys(bagContents).forEach(categoryName => {
      if (categoryNames.has(categoryName)) {
        cleanedBagContents[categoryName] = bagContents[categoryName];
        cleanedBagCount += bagContents[categoryName] || 0;
      }
    });
    
    // Only update if there were orphaned items
    if (Object.keys(cleanedBagContents).length !== Object.keys(bagContents).length) {
      setBagContents(cleanedBagContents);
      setBagCount(cleanedBagCount);
    }
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

  const dispatchLaundry = (bagContents) => {
    markUserChanged();
    
    // Validate and adjust bag contents
    // Note: Items in bag were already removed from cleanCount when tossed,
    // so we can dispatch all items in bag (they're already accounted for)
    const validatedBagContents = {};
    let totalValidated = 0;
    
    Object.keys(bagContents).forEach(categoryName => {
      const countInBag = bagContents[categoryName] || 0;
      if (countInBag === 0) return;
      
      const category = categories.find(cat => cat.name === categoryName);
      if (!category) return;
      
      // Items in bag are already removed from cleanCount, so we can dispatch them
      // Just validate that we don't exceed totalOwned
      const toDispatch = Math.min(countInBag, category.totalOwned);
      if (toDispatch > 0) {
        validatedBagContents[categoryName] = toDispatch;
        totalValidated += toDispatch;
      }
    });
    
    if (totalValidated === 0) {
      // No valid items to dispatch
      return;
    }
    
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
    
    // Find the category to validate available clean items
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) return;
    
    // cleanCount already reflects items available in closet (items in bag are already removed)
    // So we can directly use cleanCount to check availability
    const availableClean = category.cleanCount;
    
    // Only add what's available
    const toAdd = Math.max(0, Math.min(count, availableClean));
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

  const addCategory = (name, emoji, initialCount = 1) => {
    markUserChanged();
    const newId = String(Date.now());
    const newCategory = createDefaultCategory(newId, name, emoji, initialCount);
    setCategories(prev => {
      const updated = [...prev, newCategory];
      // Only filter out categories with 0 items if initialCount is explicitly 0 (user created empty category)
      // Otherwise, allow categories to exist even if they have 0 items (user might add items later)
      if (initialCount === 0) {
        return updated.filter(cat => cat.totalOwned > 0);
      }
      return updated;
    });
  };

  const removeCategory = (categoryId) => {
    markUserChanged();
    const categoryToRemove = categories.find(cat => cat.id === categoryId);
    
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    
    // Clean up bag contents if this category had items in bag
    if (categoryToRemove && bagContents[categoryToRemove.name]) {
      const itemsInBag = bagContents[categoryToRemove.name] || 0;
      setBagContents(prev => {
        const updated = { ...prev };
        delete updated[categoryToRemove.name];
        return updated;
      });
      setBagCount(prev => Math.max(0, prev - itemsInBag));
    }
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