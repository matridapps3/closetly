/**
 * WardrobeFlow Backend Algorithm Engine
 * 
 * Production-ready statistical inference system for wardrobe management.
 * Treats clothing inventory as a production system with flow analysis,
 * stockout prediction, and dead stock detection.
 */

// ============================================================================
// CORE DATA MODELS
// ============================================================================

export const createDefaultCategory = (id, name, emoji, totalOwned = 0) => ({
  id,
  name,
  emoji,
  totalOwned,
  cleanCount: totalOwned,
  dirtyCount: 0,
  inLaundryCount: 0,
  safetyThreshold: Math.ceil(totalOwned * 0.2) || 2,
  hibernated: false,
  wearHistory: [],
  purchaseHistory: [],
  retirementHistory: [],
  lastWornDate: null,
  avgWearFrequency: 0,
  maxBatchSize: Math.ceil(totalOwned * 0.4) || 2,
});

export const createBatch = (id, contents) => ({
  id,
  timestamp: new Date().toISOString(),
  contents: { ...contents },
  totalItems: Object.values(contents).reduce((a, b) => a + b, 0),
  status: 'in_progress', // 'in_progress' | 'completed'
  completedAt: null,
});

// ============================================================================
// STATISTICAL ANALYSIS ENGINE
// ============================================================================

export class WardrobeAnalyticsEngine {
  constructor(categories, batches, laundryHistory) {
    this.categories = categories;
    this.batches = batches;
    this.laundryHistory = laundryHistory || [];
  }

  // ---------------------------------------------------------------------------
  // FLOW SCORE CALCULATION
  // ---------------------------------------------------------------------------
  
  /**
   * Calculate the overall "Flow Score" (0-100)
   * Represents system health based on:
   * - Clean inventory ratio
   * - Category balance
   * - Bottleneck severity
   * - Laundry consistency
   */
  calculateFlowScore() {
    // If there's no data (empty state for new users), return 0
    const activeCategories = this.categories.filter(c => !c.hibernated && c.totalOwned > 0);
    if (activeCategories.length === 0) {
      return 0;
    }

    const weights = {
      cleanRatio: 0.35,
      categoryBalance: 0.25,
      bottleneckPenalty: 0.25,
      consistencyBonus: 0.15,
    };

    const cleanRatioScore = this._calculateCleanRatioScore();
    const balanceScore = this._calculateBalanceScore();
    const bottleneckPenalty = this._calculateBottleneckPenalty();
    const consistencyScore = this._calculateConsistencyScore();

    const rawScore =
      cleanRatioScore * weights.cleanRatio +
      balanceScore * weights.categoryBalance -
      bottleneckPenalty * weights.bottleneckPenalty +
      consistencyScore * weights.consistencyBonus;

    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  _calculateCleanRatioScore() {
    const activeCategories = this.categories.filter(c => !c.hibernated && c.totalOwned > 0);
    if (activeCategories.length === 0) return 0;

    const totalClean = activeCategories.reduce((sum, c) => sum + c.cleanCount, 0);
    const totalOwned = activeCategories.reduce((sum, c) => sum + c.totalOwned, 0);
    
    if (totalOwned === 0) return 0;
    return (totalClean / totalOwned) * 100;
  }

  _calculateBalanceScore() {
    const activeCategories = this.categories.filter(c => !c.hibernated && c.totalOwned > 0);
    if (activeCategories.length === 0) return 0;
    if (activeCategories.length < 2) return 100; // Single category is perfectly balanced

    const cleanRatios = activeCategories.map(c => c.cleanCount / c.totalOwned);
    const avgRatio = cleanRatios.reduce((a, b) => a + b, 0) / cleanRatios.length;
    const variance = cleanRatios.reduce((sum, r) => sum + Math.pow(r - avgRatio, 2), 0) / cleanRatios.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = better balance = higher score
    return Math.max(0, 100 - (stdDev * 200));
  }

  _calculateBottleneckPenalty() {
    // Only consider categories that actually have items (totalOwned > 0)
    const activeCategories = this.categories.filter(c => !c.hibernated && c.totalOwned > 0);
    let penalty = 0;

    for (const category of activeCategories) {
      if (category.cleanCount < category.safetyThreshold) {
        const severity = 1 - (category.cleanCount / category.safetyThreshold);
        penalty += severity * 30;
      }
      if (category.cleanCount === 0 && category.totalOwned > 0) {
        penalty += 20; // Extra penalty for stockout (only if category has items)
      }
    }

    return Math.min(100, penalty);
  }

  _calculateConsistencyScore() {
    // If no laundry history, return 0 (no data to calculate consistency)
    if (this.laundryHistory.length === 0) return 0;
    if (this.laundryHistory.length < 3) return 50; // Neutral score for users with some history but not enough

    const intervals = this._calculateLaundryIntervals();
    if (intervals.length < 2) return 50;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const coefficientOfVariation = Math.sqrt(variance) / avgInterval;

    // Lower CV = more consistent = higher score
    return Math.max(0, 100 - (coefficientOfVariation * 100));
  }

  // ---------------------------------------------------------------------------
  // STOCKOUT PREDICTION (Burn Down Analysis)
  // ---------------------------------------------------------------------------

  /**
   * Predict when a category will run out of clean items
   * Uses exponential moving average of daily consumption
   */
  predictStockout(categoryId) {
    const category = this.categories.find(c => c.id === categoryId);
    if (!category || category.hibernated) return null;

    const dailyConsumption = this._estimateDailyConsumption(category);
    if (dailyConsumption <= 0) return null;

    const daysUntilStockout = category.cleanCount / dailyConsumption;
    const stockoutDate = new Date();
    stockoutDate.setDate(stockoutDate.getDate() + Math.floor(daysUntilStockout));

    return {
      categoryId,
      categoryName: category.name,
      currentClean: category.cleanCount,
      dailyConsumption: Math.round(dailyConsumption * 100) / 100,
      daysUntilStockout: Math.floor(daysUntilStockout),
      stockoutDate: stockoutDate.toISOString(),
      severity: this._classifyStockoutSeverity(daysUntilStockout),
    };
  }

  _estimateDailyConsumption(category) {
    // Default consumption rates if no history
    const defaultRates = {
      'T-Shirts': 1,
      'Socks': 1,
      'Underwear': 1,
      'Shirts': 0.7,
      'Jeans': 0.3,
      'Hoodies': 0.2,
    };

    if (!category.wearHistory || category.wearHistory.length < 7) {
      return defaultRates[category.name] || 0.5;
    }

    // Calculate from actual wear history
    const last30Days = category.wearHistory
      .filter(w => new Date(w.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    return last30Days.length / 30;
  }

  _classifyStockoutSeverity(days) {
    if (days <= 2) return 'critical';
    if (days <= 5) return 'warning';
    return 'normal';
  }

  /**
   * Get all stockout predictions sorted by urgency
   */
  getAllStockoutPredictions() {
    return this.categories
      .filter(c => !c.hibernated)
      .map(c => this.predictStockout(c.id))
      .filter(p => p !== null)
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
  }

  // ---------------------------------------------------------------------------
  // DEAD STOCK DETECTION
  // ---------------------------------------------------------------------------

  /**
   * Identify items that are rarely or never worn
   * "Dead stock" = items not worn in the last 60 days despite being clean
   */
  detectDeadStock() {
    const deadStockThreshold = 60; // days
    const now = Date.now();
    const results = [];

    for (const category of this.categories) {
      if (category.hibernated) continue;

      const lastWorn = category.lastWornDate ? new Date(category.lastWornDate).getTime() : 0;
      const daysSinceWorn = Math.floor((now - lastWorn) / (1000 * 60 * 60 * 24));

      if (daysSinceWorn > deadStockThreshold && category.cleanCount > 0) {
        results.push({
          categoryId: category.id,
          categoryName: category.name,
          daysSinceWorn,
          cleanCount: category.cleanCount,
          totalOwned: category.totalOwned,
          isDeadStock: true,
        });
      }
    }

    return results;
  }

  /**
   * Calculate inventory efficiency (active vs. stagnant items)
   * Active = items currently in use (dirty/in laundry) + items in rotation (clean, recently used)
   * Stagnant = items not worn recently (dead stock) + items beyond rotation capacity
   */
  calculateInventoryEfficiency() {
    const deadStockThreshold = 60; // days (same as detectDeadStock)
    const now = Date.now();
    let activeItems = 0;
    let stagnantItems = 0;

    for (const category of this.categories.filter(c => !c.hibernated && c.totalOwned > 0)) {
      // Items currently in use (dirty or in laundry) are definitely active
      const itemsInUse = category.dirtyCount + category.inLaundryCount;
      
      // Check if category has recent usage
      const lastWorn = category.lastWornDate ? new Date(category.lastWornDate).getTime() : 0;
      const daysSinceWorn = Math.floor((now - lastWorn) / (1000 * 60 * 60 * 24));
      const isDeadStock = daysSinceWorn > deadStockThreshold;
      
      // Calculate rotation capacity (max items that can be in active rotation)
      const maxInRotation = category.maxBatchSize || Math.ceil(category.totalOwned * 0.4);
      
      if (isDeadStock) {
        // Category hasn't been worn recently - all items are stagnant
        stagnantItems += category.totalOwned;
      } else {
        // Category is in active use
        // Active items = items in use + clean items up to rotation capacity
        const cleanInRotation = Math.min(category.cleanCount, Math.max(0, maxInRotation - itemsInUse));
        const categoryActive = itemsInUse + cleanInRotation;
        const categoryStagnant = category.totalOwned - categoryActive;
        
        activeItems += categoryActive;
        stagnantItems += Math.max(0, categoryStagnant);
      }
    }

    const total = activeItems + stagnantItems;
    return {
      activeItems,
      stagnantItems,
      totalItems: total,
      efficiencyPercent: total > 0 ? Math.round((activeItems / total) * 100) : 100,
    };
  }

  // ---------------------------------------------------------------------------
  // LAUNDRY CYCLE ANALYSIS
  // ---------------------------------------------------------------------------

  /**
   * Analyze laundry consistency patterns
   */
  analyzeLaundryCycles() {
    const intervals = this._calculateLaundryIntervals();
    if (intervals.length === 0) {
      return {
        intervals: [],
        avgInterval: 0,
        optimalInterval: 7,
        consistency: 'unknown',
        recommendation: 'Start tracking your laundry cycles for personalized insights.',
      };
    }

    const avgInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
    const minInterval = Math.min(...intervals);
    const maxInterval = Math.max(...intervals);
    const range = maxInterval - minInterval;

    // Calculate optimal interval based on inventory
    const optimalInterval = this._calculateOptimalInterval();

    let consistency, recommendation;
    if (range <= 3) {
      consistency = 'excellent';
      recommendation = `Great consistency! Your ${avgInterval}-day cycle is working well.`;
    } else if (range <= 6) {
      consistency = 'good';
      recommendation = `Good routine. Try to stay closer to ${optimalInterval} days for optimal flow.`;
    } else {
      consistency = 'poor';
      recommendation = `Your laundry gaps swing from ${minInterval} to ${maxInterval} days. Aim for every ${optimalInterval} days to fix your "nothing to wear" feeling.`;
    }

    return {
      intervals,
      avgInterval,
      optimalInterval,
      consistency,
      recommendation,
      minInterval,
      maxInterval,
    };
  }

  _calculateLaundryIntervals() {
    if (this.laundryHistory.length < 2) return [];

    const sortedHistory = [...this.laundryHistory].sort(
      (a, b) => new Date(a.completedAt) - new Date(b.completedAt)
    );

    const intervals = [];
    for (let i = 1; i < sortedHistory.length; i++) {
      const prev = new Date(sortedHistory[i - 1].completedAt);
      const curr = new Date(sortedHistory[i].completedAt);
      const days = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (days > 0 && days < 30) intervals.push(days);
    }

    return intervals;
  }

  _calculateOptimalInterval() {
    // Calculate based on smallest category buffer
    const activeCategories = this.categories.filter(c => !c.hibernated && c.totalOwned > 0);
    
    if (activeCategories.length === 0) return 7;

    const bufferDays = activeCategories.map(c => {
      const dailyUse = this._estimateDailyConsumption(c);
      return dailyUse > 0 ? (c.cleanCount - c.safetyThreshold) / dailyUse : 14;
    });

    const minBuffer = Math.min(...bufferDays);
    return Math.max(3, Math.min(14, Math.floor(minBuffer)));
  }

  // ---------------------------------------------------------------------------
  // BURN DOWN CHART DATA
  // ---------------------------------------------------------------------------

  /**
   * Generate burn down chart data for visualization
   */
  generateBurnDownData(daysAhead = 14) {
    const categories = this.categories.filter(c => !c.hibernated).slice(0, 3);
    const dates = [];
    const categoryData = categories.map(c => ({
      name: c.name,
      values: [],
    }));

    for (let day = 0; day <= daysAhead; day++) {
      dates.push(`Day ${day + 1}`);
      
      categories.forEach((category, idx) => {
        const dailyConsumption = this._estimateDailyConsumption(category);
        const projected = Math.max(0, category.cleanCount - (dailyConsumption * day));
        categoryData[idx].values.push(Math.round(projected));
      });
    }

    return {
      dates,
      categories: categoryData,
    };
  }

  // ---------------------------------------------------------------------------
  // INSIGHT GENERATION
  // ---------------------------------------------------------------------------

  /**
   * Generate all smart insights for the dashboard
   */
  generateInsights() {
    const insights = [];
    let insightId = 1;

    // 1. Bottleneck Detection
    const stockouts = this.getAllStockoutPredictions();
    for (const stockout of stockouts.filter(s => s.severity !== 'normal')) {
      insights.push({
        id: insightId++,
        urgency: stockout.severity,
        type: 'bottleneck',
        title: stockout.severity === 'critical' ? 'Bottleneck Detected' : 'Low Stock Warning',
        message: `${stockout.categoryName}. You have ${stockout.currentClean} ${stockout.currentClean === 1 ? 'item' : 'items'} left. At your current pace, you reach zero on ${this._formatDay(stockout.stockoutDate)}.`,
      });
    }

    // 2. Dead Stock Detection
    const efficiency = this.calculateInventoryEfficiency();
    if (efficiency.stagnantItems > 5) {
      const deadStock = this.detectDeadStock();
      const topDeadCategory = deadStock[0];
      insights.push({
        id: insightId++,
        urgency: 'warning',
        type: 'deadstock',
        title: 'Low Utilization',
        message: topDeadCategory 
          ? `You own ${topDeadCategory.totalOwned} ${topDeadCategory.categoryName} but rarely use them. ${efficiency.stagnantItems} items are Dead Stock.`
          : `${efficiency.stagnantItems} items in your wardrobe are rarely worn. Consider donating unused items.`,
      });
    }

    // 3. Inventory Imbalance
    const imbalance = this._detectImbalance();
    if (imbalance) {
      insights.push({
        id: insightId++,
        urgency: 'warning',
        type: 'imbalance',
        title: 'Inventory Imbalance',
        message: imbalance.message,
      });
    }

    // 4. Laundry Consistency
    const cycleAnalysis = this.analyzeLaundryCycles();
    if (cycleAnalysis.consistency === 'poor') {
      insights.push({
        id: insightId++,
        urgency: 'insight',
        type: 'procrastination',
        title: 'Routine Stability: Low',
        message: cycleAnalysis.recommendation,
      });
    }

    // 5. Monday Panic Forecast
    const panicDay = this._predictPanicDay();
    if (panicDay) {
      insights.push({
        id: insightId++,
        urgency: 'critical',
        type: 'forecast',
        title: `${panicDay.day} Panic Forecast`,
        message: `You typically run out of ${panicDay.category} on ${panicDay.day}s. Wash a batch tonight to break the loop.`,
      });
    }

    // Sort by urgency
    const urgencyOrder = { critical: 0, warning: 1, insight: 2 };
    return insights.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  }

  _formatDay(isoString) {
    const date = new Date(isoString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  _detectImbalance() {
    const activeCategories = this.categories.filter(c => !c.hibernated && c.totalOwned > 0);
    if (activeCategories.length < 2) return null;

    const cleanCounts = activeCategories.map(c => ({ name: c.name, clean: c.cleanCount }));
    const maxClean = Math.max(...cleanCounts.map(c => c.clean));
    const minClean = Math.min(...cleanCounts.map(c => c.clean));

    if (maxClean > 5 && minClean < 3) {
      const maxCat = cleanCounts.find(c => c.clean === maxClean);
      const minCat = cleanCounts.find(c => c.clean === minClean);
      return {
        message: `You have ${maxClean} clean ${maxCat.name.toLowerCase()} but only ${minClean} clean ${minCat.name.toLowerCase()}. You effectively have only ${minClean} outfits available.`,
      };
    }

    return null;
  }

  _predictPanicDay() {
    // Simplified prediction - would use ML in production
    const stockouts = this.getAllStockoutPredictions();
    const urgent = stockouts.find(s => s.daysUntilStockout <= 3);
    
    if (urgent) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const stockoutDay = new Date(urgent.stockoutDate).getDay();
      return {
        day: days[stockoutDay],
        category: urgent.categoryName,
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // COST PER WEAR ANALYSIS
  // ---------------------------------------------------------------------------

  /**
   * Calculate cost per wear for items with price data
   */
  calculateCostPerWear(items) {
    return items
      .map(item => ({
        ...item,
        costPerWear: item.wearCount > 0 ? item.purchasePrice / item.wearCount : item.purchasePrice,
        isEfficient: item.wearCount > 0 ? (item.purchasePrice / item.wearCount) < 100 : false,
        wearGoal: Math.ceil(item.purchasePrice / 50), // Target ₹50 per wear
      }))
      .sort((a, b) => a.costPerWear - b.costPerWear);
  }
}

// ============================================================================
// STATE MANAGEMENT HELPERS
// ============================================================================

/**
 * Process item toss - items stay clean until dispatched to laundry
 * Only updates wear history, doesn't change clean/dirty counts
 */
export const processItemToss = (categories, categoryId, count = 1) => {
  return categories.map(cat => {
    if (cat.id !== categoryId) return cat;
    
    const toToss = Math.min(count, cat.cleanCount);
    // Items stay clean when tossed - they only become dirty when dispatched to laundry
    return {
      ...cat,
      lastWornDate: new Date().toISOString(),
      wearHistory: [
        ...cat.wearHistory,
        { date: new Date().toISOString(), count: toToss },
      ],
    };
  });
};

/**
 * Process batch dispatch - items become dirty when sent to laundry
 */
export const processBatchDispatch = (categories, bagContents) => {
  return categories.map(cat => {
    const countInBag = bagContents[cat.name] || 0;
    if (countInBag === 0) return cat;

    // Validate: can't dispatch more than available clean items
    const toDispatch = Math.min(countInBag, cat.cleanCount);
    if (toDispatch === 0) return cat;

    // Items become dirty when dispatched to laundry
    return {
      ...cat,
      cleanCount: Math.max(0, cat.cleanCount - toDispatch),
      dirtyCount: cat.dirtyCount + toDispatch,
      inLaundryCount: cat.inLaundryCount + toDispatch,
    };
  });
};

/**
 * Process batch completion (laundry items become clean)
 */
export const processBatchComplete = (categories, batchContents) => {
  return categories.map(cat => {
    const countInBatch = batchContents[cat.name] || 0;
    if (countInBatch === 0) return cat;

    // Items come back clean from laundry, so reduce both inLaundryCount and dirtyCount
    return {
      ...cat,
      inLaundryCount: Math.max(0, cat.inLaundryCount - countInBatch),
      dirtyCount: Math.max(0, cat.dirtyCount - countInBatch),
      cleanCount: cat.cleanCount + countInBatch,
    };
  });
};

/**
 * Process item acquisition (purchase)
 */
export const processItemAcquisition = (categories, categoryId, count = 1, price = 0) => {
  return categories.map(cat => {
    if (cat.id !== categoryId) return cat;

    const newTotal = cat.totalOwned + count;
    return {
      ...cat,
      totalOwned: newTotal,
      cleanCount: cat.cleanCount + count,
      safetyThreshold: Math.ceil(newTotal * 0.2) || 2,
      maxBatchSize: Math.ceil(newTotal * 0.4) || 2,
      purchaseHistory: [
        ...cat.purchaseHistory,
        { date: new Date().toISOString(), count, price },
      ],
    };
  });
};

/**
 * Process item retirement (donate/discard)
 * Retires items from any state (clean, dirty, or in laundry) to maintain data integrity
 */
export const processItemRetirement = (categories, categoryId, count = 1, reason = 'worn_out') => {
  return categories.map(cat => {
    if (cat.id !== categoryId) return cat;

    // Retire from totalOwned, prioritizing clean items, then dirty, then in laundry
    const toRetire = Math.min(count, cat.totalOwned);
    const newTotal = Math.max(0, cat.totalOwned - toRetire);
    
    // Calculate how many to retire from each state
    let remainingToRetire = toRetire;
    let newCleanCount = cat.cleanCount;
    let newDirtyCount = cat.dirtyCount;
    let newInLaundryCount = cat.inLaundryCount;
    
    // First retire from clean items
    const retireFromClean = Math.min(remainingToRetire, newCleanCount);
    newCleanCount -= retireFromClean;
    remainingToRetire -= retireFromClean;
    
    // Then retire from dirty items
    const retireFromDirty = Math.min(remainingToRetire, newDirtyCount);
    newDirtyCount -= retireFromDirty;
    remainingToRetire -= retireFromDirty;
    
    // Finally retire from items in laundry
    const retireFromLaundry = Math.min(remainingToRetire, newInLaundryCount);
    newInLaundryCount -= retireFromLaundry;
    
    return {
      ...cat,
      totalOwned: newTotal,
      cleanCount: newCleanCount,
      dirtyCount: newDirtyCount,
      inLaundryCount: newInLaundryCount,
      safetyThreshold: Math.ceil(newTotal * 0.2) || 2,
      maxBatchSize: Math.ceil(newTotal * 0.4) || 2,
      retirementHistory: [
        ...cat.retirementHistory,
        { date: new Date().toISOString(), count: toRetire, reason },
      ],
    };
  });
};

// ============================================================================
// PERSISTENCE HELPERS
// ============================================================================

export const serializeState = (state) => JSON.stringify(state);

export const deserializeState = (json, defaultState) => {
  try {
    return JSON.parse(json) || defaultState;
  } catch {
    return defaultState;
  }
};

export default WardrobeAnalyticsEngine;
