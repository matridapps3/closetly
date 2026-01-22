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

export const WardrobeProvider = ({ children }) => {
  // --- STATE ---
  const [categories, setCategories] = useState(() => {
    // Initialize with realistic distribution to trigger insights
    const cats = [
      createDefaultCategory('1', 'T-Shirts', '👕', 10),
      createDefaultCategory('2', 'Jeans', '👖', 5),
      createDefaultCategory('3', 'Socks', '🧦', 12),
      createDefaultCategory('4', 'Shirts', '👔', 8),
      createDefaultCategory('5', 'Underwear', '🩲', 15),
      createDefaultCategory('6', 'Hoodies', '🧥', 6),
    ];
    
    // Adjust to create realistic state that triggers insights
    return cats.map((cat, index) => {
      // Create imbalance: some categories have more clean items than others
      // Some categories are low on clean items (bottleneck)
      let cleanCount, dirtyCount;
      
      if (index === 0) { // T-Shirts - low clean (bottleneck)
        cleanCount = 1; // Below safety threshold of 2
        dirtyCount = cat.totalOwned - cleanCount;
      } else if (index === 1) { // Jeans - very low clean
        cleanCount = 0; // Critical bottleneck, below safety threshold of 1
        dirtyCount = cat.totalOwned - cleanCount;
      } else if (index === 2) { // Socks - moderate
        cleanCount = 5;
        dirtyCount = cat.totalOwned - cleanCount;
      } else if (index === 3) { // Shirts - high clean (imbalance)
        cleanCount = 7;
        dirtyCount = cat.totalOwned - cleanCount;
      } else if (index === 4) { // Underwear - moderate
        cleanCount = 8;
        dirtyCount = cat.totalOwned - cleanCount;
      } else { // Hoodies - high clean
        cleanCount = 5;
        dirtyCount = cat.totalOwned - cleanCount;
      }
      
      return {
        ...cat,
        cleanCount,
        dirtyCount,
      };
    });
  });
  const [batches, setBatches] = useState([]);
  // Initialize with sample laundry history to trigger routine stability insights
  // Inconsistent intervals (12, 6, 4 days) - range of 8 days triggers "poor" consistency
  const [laundryHistory, setLaundryHistory] = useState(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    return [
      { id: 'HIST_1', completedAt: new Date(now - 22 * oneDay).toISOString(), status: 'completed' },
      { id: 'HIST_2', completedAt: new Date(now - 10 * oneDay).toISOString(), status: 'completed' },
      { id: 'HIST_3', completedAt: new Date(now - 4 * oneDay).toISOString(), status: 'completed' },
    ];
  });
  // Hamper bag state - persists across tab switches
  const [bagContents, setBagContents] = useState({});
  const [bagCount, setBagCount] = useState(0);
  const batchesRef = useRef(batches);
  
  // Keep ref in sync with state
  useEffect(() => {
    batchesRef.current = batches;
  }, [batches]);

  // --- ENGINE ---
  const { flowScore, insights } = useMemo(() => {
    const engine = new WardrobeAnalyticsEngine(categories, batches, laundryHistory);
    return {
      flowScore: engine.calculateFlowScore(),
      insights: engine.generateInsights(),
    };
  }, [categories, batches, laundryHistory]);

  // --- ACTIONS ---
  const dispatchLaundry = (bagContents) => {
    const newBatch = createBatch(`BATCH_${Date.now()}`, bagContents);
    setBatches(prev => [...prev, newBatch]);
    setCategories(prev => processBatchDispatch(prev, bagContents));
    // Clear the bag after dispatching
    setBagContents({});
    setBagCount(0);
  };

  const addToBag = (categoryName, count = 1) => {
    setBagContents((prev) => ({
      ...prev,
      [categoryName]: (prev[categoryName] || 0) + count,
    }));
    setBagCount((prev) => prev + count);
  };

  const clearBag = () => {
    setBagContents({});
    setBagCount(0);
  };

  const completeBatch = (batchId) => {
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
    setCategories(prev => processBatchComplete(prev, batch.contents));
    setLaundryHistory(prev => [...prev, completedBatch]);
  };

  const tossItem = (categoryId, count = 1) => {
    setCategories(prev => processItemToss(prev, categoryId, count));
  };

  const acquireItem = (categoryId, count = 1, price = 0) => {
    setCategories(prev => processItemAcquisition(prev, categoryId, count, price));
  };

  const retireItem = (id, count, reason) => {
    setCategories(prev => processItemRetirement(prev, id, count, reason));
  };

  const updateCategoryHibernation = (categoryId, hibernated) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, hibernated } : cat
    ));
  };

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
    }}>
      {children}
    </WardrobeContext.Provider>
  );
};
export const useWardrobe = () => useContext(WardrobeContext);