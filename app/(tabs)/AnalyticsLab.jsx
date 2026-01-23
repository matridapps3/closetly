import { useWardrobe } from '@/contexts/WardrobeContext';
import { WardrobeAnalyticsEngine } from '@/contexts/WardrobeEngine';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import {
  BarChart,
  LineChart,
  PieChart,
} from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;

// Haptic Feedback
const hapticFeedback = {
  success: () => Vibration.vibrate([0, 50]),
  tab: () => Vibration.vibrate(10),
};

// Active Batch Card Component
const ActiveBatchCard = ({ batch, onMarkClean }) => {
  const [dissolving, setDissolving] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const handleMarkClean = () => {
    setDissolving(true);
    hapticFeedback.success();

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 0.8,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onMarkClean(batch);
    });
  };

  const daysAgo = Math.floor(
    (Date.now() - new Date(batch.timestamp).getTime()) / (1000 * 60 * 60 * 24)
  );

  const itemsList = Object.entries(batch.contents)
    .map(([name, count]) => `${count} ${name}`)
    .join(', ');

  return (
    <Animated.View
      style={[
        styles.batchCard,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={styles.batchHeader}>
        <View>
          <Text style={styles.batchId}>Batch #{batch.id}</Text>
          <Text style={styles.batchTime}>
            Sent {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago
          </Text>
        </View>
        <View style={styles.batchCountBadge}>
          <Text style={styles.batchCountText}>{batch.totalItems}</Text>
          <Text style={styles.batchCountLabel}>items</Text>
        </View>
      </View>

      <Text style={styles.batchContents}>{itemsList}</Text>

      <TouchableOpacity
        style={styles.markCleanButton}
        onPress={handleMarkClean}
        disabled={dissolving}
      >
        <Text style={styles.markCleanIcon}>✓</Text>
        <Text style={styles.markCleanText}>MARK AS CLEAN</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Burn Down Chart Component
const BurnDownChart = ({ data }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const chartData = {
    labels: data.dates,
    datasets: data.categories.map((cat, index) => ({
      data: cat.values,
      color: (opacity = 1) => {
        const colors = ['#00E5FF', '#FFAB00', '#FF5252'];
        return colors[index];
      },
      strokeWidth: 2,
    })),
    legend: data.categories.map((cat) => cat.name),
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>BURN DOWN ANALYSIS</Text>
      <Text style={styles.chartSubtitle}>
        Clean stock levels over last 30 days
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={chartData}
          width={Math.max(CHART_WIDTH, data.dates.length * 40)}
          height={220}
          chartConfig={{
            backgroundColor: '#1E1E1E',
            backgroundGradientFrom: '#1E1E1E',
            backgroundGradientTo: '#1E1E1E',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 229, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(136, 136, 136, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
            },
          }}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
        />
      </ScrollView>

      <View style={styles.chartLegend}>
        {data.categories.map((cat, index) => {
          const colors = ['#00E5FF', '#FFAB00', '#FF5252'];
          return (
            <View key={index} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors[index] }]}
              />
              <Text style={styles.legendText}>{cat.name}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Dead Stock Chart Component
const DeadStockChart = ({ activeCount, stagnantCount }) => {
  const total = activeCount + stagnantCount;
  const efficiency = total > 0 ? ((activeCount / total) * 100).toFixed(0) : 0;

  const data = [
    {
      name: 'Active',
      count: activeCount,
      color: '#00E5FF',
      legendFontColor: '#AAAAAA',
      legendFontSize: 13,
    },
    {
      name: 'Stagnant',
      count: stagnantCount,
      color: '#FF5252',
      legendFontColor: '#AAAAAA',
      legendFontSize: 13,
    },
  ];

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>INVENTORY EFFICIENCY</Text>
      <Text style={styles.chartSubtitle}>Active vs. Dead Stock</Text>

      <View style={styles.donutContainer}>
        <PieChart
          data={data}
          width={CHART_WIDTH}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 0]}
          absolute
          hasLegend={true}
        />
        <View style={styles.donutCenter}>
          <Text style={styles.donutPercentage}>{efficiency}%</Text>
          <Text style={styles.donutLabel}>UTILIZED</Text>
        </View>
      </View>
    </View>
  );
};

// Procrastination Chart Component
const ProcrastinationChart = ({ cycleData, optimalInterval }) => {
  const barAnimations = useRef(
    cycleData.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.stagger(
      100,
      barAnimations.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        })
      )
    ).start();
  }, []);

  const chartData = {
    labels: cycleData.map((_, i) => `C${i + 1}`),
    datasets: [
      {
        data: cycleData,
      },
    ],
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>LAUNDRY CONSISTENCY</Text>
      <Text style={styles.chartSubtitle}>Days between cycles</Text>

      <BarChart
        data={chartData}
        width={CHART_WIDTH}
        height={220}
        chartConfig={{
          backgroundColor: '#1E1E1E',
          backgroundGradientFrom: '#1E1E1E',
          backgroundGradientTo: '#1E1E1E',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 171, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(136, 136, 136, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 0.7,
        }}
        style={styles.chart}
        withInnerLines={true}
        withVerticalLines={false}
        showBarTops={false}
        fromZero
      />

      <View style={styles.optimalLineContainer}>
        <View style={styles.optimalLine} />
        <Text style={styles.optimalLineLabel}>
          Optimal: {optimalInterval} days
        </Text>
      </View>
    </View>
  );
};

// Cost Per Wear Item Component (DISABLED - Commented out)
// const CostPerWearItem = ({ item }) => {
//   const costPerWear = item.purchasePrice / (item.wearCount + 1);
//   const isEfficient = costPerWear < 100;
//
//   return (
//     <View style={styles.costItem}>
//       <View style={styles.costItemHeader}>
//         <Text style={styles.costItemName}>{item.name}</Text>
//         <Text
//           style={[
//             styles.costItemValue,
//             isEfficient ? styles.costEfficient : styles.costInefficient,
//           ]}
//         >
//           ₹{costPerWear.toFixed(0)}
//         </Text>
//       </View>
//       <View style={styles.costItemDetails}>
//         <Text style={styles.costItemDetail}>
//           Purchase: ₹{item.purchasePrice}
//         </Text>
//         <Text style={styles.costItemDetail}>
//           Wears: {item.wearCount}
//         </Text>
//       </View>
//       <View style={styles.costProgressBar}>
//         <View
//           style={[
//             styles.costProgressFill,
//             {
//               width: `${Math.min((item.wearCount / 50) * 100, 100)}%`,
//               backgroundColor: isEfficient ? '#00E5FF' : '#FF5252',
//             },
//           ]}
//         />
//       </View>
//     </View>
//   );
// };

// Main Analytics Lab Screen
const AnalyticsLab = () => {
  const [activeTab, setActiveTab] = useState('cycles'); // 'cycles' or 'insights'
  // Get data from shared context
  const { categories, batches, laundryHistory, completeBatch } = useWardrobe();
  
  // Filter only in-progress batches
  const activeBatches = batches.filter(b => b.status === 'in_progress');

  // Create analytics engine instance
  const engine = useMemo(() => {
    return new WardrobeAnalyticsEngine(categories, batches, laundryHistory);
  }, [categories, batches, laundryHistory]);

  // Calculate real analytics data
  const burnDownData = useMemo(() => {
    const activeCategories = categories.filter(c => !c.hibernated && c.totalOwned > 0);
    if (activeCategories.length === 0) {
      // Empty state - return placeholder data structure
      return {
        dates: ['Day 1', 'Day 7', 'Day 14', 'Day 21', 'Day 28'],
        categories: [],
      };
    }
    return engine.generateBurnDownData(27); // 28 days (0-27)
  }, [categories, engine]);

  const inventoryEfficiency = useMemo(() => {
    return engine.calculateInventoryEfficiency();
  }, [engine]);

  const laundryCycles = useMemo(() => {
    return engine.analyzeLaundryCycles();
  }, [engine]);

  // Prepare procrastination data from laundry intervals
  const procrastinationData = useMemo(() => {
    if (laundryCycles.intervals.length === 0) {
      return [];
    }
    // Return last 10 intervals, or pad with zeros if less than 10
    const intervals = laundryCycles.intervals.slice(-10);
    // Pad to 10 elements for consistent chart display
    return intervals.length < 10 
      ? [...Array(10 - intervals.length).fill(0), ...intervals]
      : intervals;
  }, [laundryCycles]);

  const optimalInterval = laundryCycles.optimalInterval || 7;

  // Cost Per Wear Items Data (DISABLED - Commented out)
  // const costPerWearItems = [
  //   { name: 'Navy Jeans', purchasePrice: 3000, wearCount: 60 },
  //   { name: 'White T-Shirt', purchasePrice: 500, wearCount: 45 },
  //   { name: 'Leather Jacket', purchasePrice: 8000, wearCount: 3 },
  //   { name: 'Running Shoes', purchasePrice: 5000, wearCount: 80 },
  // ].sort((a, b) => {
  //   const costA = a.purchasePrice / (a.wearCount + 1);
  //   const costB = b.purchasePrice / (b.wearCount + 1);
  //   return costA - costB;
  // });

  const handleMarkClean = (batch) => {
    // Use context function to complete the batch
    completeBatch(batch.id);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    hapticFeedback.tab();
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cycles' && styles.tabActive]}
          onPress={() => switchTab('cycles')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'cycles' && styles.tabTextActive,
            ]}
          >
            ACTIVE CYCLES
          </Text>
          {activeBatches.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{activeBatches.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && styles.tabActive]}
          onPress={() => switchTab('insights')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'insights' && styles.tabTextActive,
            ]}
          >
            DATA LAB
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'cycles' ? (
          <View style={styles.cyclesTab}>
            <Text style={styles.sectionTitle}>IN PROCESS</Text>
            <Text style={styles.sectionSubtitle}>
              Currently in laundry • Mark as clean to restock
            </Text>

            {activeBatches.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🧺</Text>
                <Text style={styles.emptyStateText}>No active batches</Text>
                <Text style={styles.emptyStateSubtext}>
                  Dispatch items from the Virtual Hamper
                </Text>
              </View>
            ) : (
              activeBatches.map((batch) => (
                <ActiveBatchCard
                  key={batch.id}
                  batch={batch}
                  onMarkClean={handleMarkClean}
                />
              ))
            )}
          </View>
        ) : (
          <View style={styles.insightsTab}>
            {burnDownData.categories.length > 0 ? (
              <BurnDownChart data={burnDownData} />
            ) : (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>BURN DOWN ANALYSIS</Text>
                <Text style={styles.chartSubtitle}>
                  Clean stock levels over last 30 days
                </Text>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>📊</Text>
                  <Text style={styles.emptyStateText}>No data available</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Add items to your wardrobe to see burn down analysis
                  </Text>
                </View>
              </View>
            )}

            {categories.filter(c => !c.hibernated && c.totalOwned > 0).length > 0 ? (
              <DeadStockChart 
                activeCount={inventoryEfficiency.activeItems} 
                stagnantCount={inventoryEfficiency.stagnantItems} 
              />
            ) : (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>INVENTORY EFFICIENCY</Text>
                <Text style={styles.chartSubtitle}>Active vs. Dead Stock</Text>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>📦</Text>
                  <Text style={styles.emptyStateText}>No inventory data</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Add items to track inventory efficiency
                  </Text>
                </View>
              </View>
            )}

            {laundryCycles.intervals.length > 0 ? (
              <ProcrastinationChart
                cycleData={procrastinationData}
                optimalInterval={optimalInterval}
              />
            ) : (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>LAUNDRY CONSISTENCY</Text>
                <Text style={styles.chartSubtitle}>Days between cycles</Text>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>♻️</Text>
                  <Text style={styles.emptyStateText}>No laundry history</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Complete laundry batches to see consistency analysis
                  </Text>
                </View>
              </View>
            )}

            {/* Cost Per Wear Section (DISABLED - Commented out) */}
            {/* <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>COST PER WEAR</Text>
              <Text style={styles.chartSubtitle}>
                Value efficiency analysis
              </Text>

              {costPerWearItems.map((item, index) => (
                <CostPerWearItem key={index} item={item} />
              ))}
            </View> */}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#00E5FF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666666',
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: '#00E5FF',
  },
  tabBadge: {
    backgroundColor: '#FF5252',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  cyclesTab: {},
  insightsTab: {},
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 20,
  },
  batchCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  batchId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  batchTime: {
    fontSize: 12,
    color: '#FFAB00',
    letterSpacing: 0.5,
  },
  batchCountBadge: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  batchCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00E5FF',
    fontVariant: ['tabular-nums'],
  },
  batchCountLabel: {
    fontSize: 9,
    color: '#888888',
    letterSpacing: 1,
  },
  batchContents: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 18,
    marginBottom: 16,
  },
  markCleanButton: {
    backgroundColor: '#00E5FF',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markCleanIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  markCleanText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#444444',
  },
  chartContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 2,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 16,
  },
  donutContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  donutContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  donutCenter: {
    position: 'absolute',
    top: '46%',
    left: '29%',
    transform: [{ translateX: -40 }, { translateY: -30 }],
    alignItems: 'center',
  },
  donutPercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  donutLabel: {
    fontSize: 16,
    color: 'white',
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  optimalLineContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  optimalLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#00E5FF',
    opacity: 0.5,
    borderStyle: 'dashed',
  },
  optimalLineLabel: {
    fontSize: 11,
    color: '#00E5FF',
    marginTop: 4,
  },
  // Cost Per Wear Styles (DISABLED - Commented out)
  // costItem: {
  //   backgroundColor: '#2A2A2A',
  //   borderRadius: 8,
  //   padding: 12,
  //   marginBottom: 12,
  // },
  // costItemHeader: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   marginBottom: 8,
  // },
  // costItemName: {
  //   fontSize: 14,
  //   fontWeight: '600',
  //   color: '#FFFFFF',
  // },
  // costItemValue: {
  //   fontSize: 18,
  //   fontWeight: '700',
  //   fontVariant: ['tabular-nums'],
  // },
  // costEfficient: {
  //   color: '#00E5FF',
  // },
  // costInefficient: {
  //   color: '#FF5252',
  // },
  // costItemDetails: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   marginBottom: 8,
  // },
  // costItemDetail: {
  //   fontSize: 11,
  //   color: '#888888',
  // },
  // costProgressBar: {
  //   height: 4,
  //   backgroundColor: '#1E1E1E',
  //   borderRadius: 2,
  //   overflow: 'hidden',
  // },
  // costProgressFill: {
  //   height: '100%',
  //   borderRadius: 2,
  // },
});

export default AnalyticsLab;
