import { useWardrobe } from '@/contexts/WardrobeContext';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Haptic Feedback Patterns
const hapticFeedback = {
  toss: () => Vibration.vibrate([0, 40, 10, 30]), // Thud effect
  dispatch: () => Vibration.vibrate([0, 50, 30, 50, 30, 50]), // Zipper effect
  dump: () => Vibration.vibrate([0, 30, 10, 30, 10, 30, 10, 30]), // Multiple thuds
  quickFill: () => Vibration.vibrate([0, 60]),
};

// Flying Item Animation Component
const FlyingItem = ({ startX, startY, endX, endY, onComplete, emoji }) => {
  const position = useRef(new Animated.ValueXY({ x: startX, y: startY })).current;
  const opacity = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: endX, y: endY },
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.flyingItem,
        {
          transform: position.getTranslateTransform(),
          opacity,
        },
      ]}
    >
      <Text style={styles.flyingItemEmoji}>{emoji}</Text>
    </Animated.View>
  );
};

// Bag Peek Summary Component
const BagPeekSummary = ({ bagContents, expanded, onToggle }) => {
  const summary = Object.entries(bagContents)
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => `${count} ${name}`)
    .join(', ');

  if (!summary) return null;

  return (
    <TouchableOpacity style={styles.peekContainer} onPress={onToggle}>
      <Text style={styles.peekLabel}>
        {expanded ? '▼' : '▶'} PEEK INSIDE
      </Text>
      {expanded && <Text style={styles.peekSummary}>Contains: {summary}</Text>}
    </TouchableOpacity>
  );
};

// Liquid Fill Animation Component
const LiquidFillIndicator = ({ fillLevel }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: fillLevel,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [fillLevel]);

  const height = animatedHeight.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const backgroundColor = animatedHeight.interpolate({
    inputRange: [0, 50, 80, 100],
    outputRange: ['#FF5252', '#FF6B6B', '#FF8585', '#FF9999'],
  });

  return (
    <View style={styles.liquidContainer}>
      <Animated.View
        style={[
          styles.liquidFill,
          {
            height,
            backgroundColor,
          },
        ]}
      />
    </View>
  );
};

// The Bag Visualization Component
const VirtualBag = ({ bagCount, bagContents, maxCapacity, onDispatch, onQuickFill }) => {
  const [peekExpanded, setPeekExpanded] = useState(false);
  const fillLevel = (bagCount / maxCapacity) * 100;
  const canDispatch = bagCount > 0;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (canDispatch) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [canDispatch]);

  return (
    <View style={styles.bagSection}>
      <View style={styles.bagHeader}>
        <Text style={styles.bagTitle}>ACTIVE LAUNDRY BAG</Text>
        <TouchableOpacity
          style={styles.quickFillButton}
          onPress={onQuickFill}
          activeOpacity={0.7}
        >
          <Text style={styles.quickFillIcon}>⚡</Text>
          <Text style={styles.quickFillText}>Quick Fill</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bagContainer}>
        <View style={styles.bagVisual}>
          <LiquidFillIndicator fillLevel={fillLevel} />
          <View style={styles.bagOverlay}>
            <Text style={styles.bagCount}>{bagCount}</Text>
            <Text style={styles.bagLabel}>ITEMS</Text>
            <Text style={styles.bagCapacity}>
              {fillLevel.toFixed(0)}% Full
            </Text>
          </View>
        </View>

        <BagPeekSummary
          bagContents={bagContents}
          expanded={peekExpanded}
          onToggle={() => setPeekExpanded(!peekExpanded)}
        />

        <Animated.View
          style={[
            styles.dispatchButtonContainer,
            canDispatch && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.dispatchButton,
              !canDispatch && styles.dispatchButtonDisabled,
            ]}
            onPress={onDispatch}
            disabled={!canDispatch}
            activeOpacity={0.8}
          >
            <Text style={styles.dispatchIcon}>🚀</Text>
            <Text style={styles.dispatchText}>
              {canDispatch ? 'DISPATCH NOW' : 'BAG EMPTY'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

// Category Grid Button Component
const CategoryButton = ({
  category,
  onToss,
  onDumpAll,
  position,
  bagPosition,
}) => {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef(null);

  const handlePressIn = () => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      hapticFeedback.dump();
      onDumpAll();
      setIsLongPressing(false);
    }, 800);
  };

  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsLongPressing(false);
  };

  const handlePress = () => {
    if (!isLongPressing && category.cleanCount > 0) {
      onToss(category, position);
    }
  };

  const isDisabled = category.cleanCount === 0;

  return (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        isDisabled && styles.categoryButtonDisabled,
        isLongPressing && styles.categoryButtonLongPress,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
      <Text style={styles.categoryButtonName}>{category.name}</Text>
      <View style={styles.categoryCountBadge}>
        <Text style={styles.categoryCountText}>{category.cleanCount}</Text>
        <Text style={styles.categoryCountLabel}>clean</Text>
      </View>
      {!isDisabled && (
        <Text style={styles.longPressHint}>Hold to dump all</Text>
      )}
    </TouchableOpacity>
  );
};

// Main Virtual Hamper Screen
const VirtualHamper = () => {
  // Get categories and actions from shared context
  const { 
    categories, 
    tossItem: contextTossItem, 
    dispatchLaundry,
    bagContents,
    bagCount,
    addToBag,
    clearBag
  } = useWardrobe();
  
  const [flyingItems, setFlyingItems] = useState([]);
  const maxCapacity = 30;

  const bagRef = useRef(null);
  const gridRefs = useRef({});

  const tossItem = (category, gridPosition) => {
    if (category.cleanCount === 0) return;
    // Check bag capacity before adding
    if (bagCount >= maxCapacity) {
      alert(`Bag is full! Maximum capacity is ${maxCapacity} items.`);
      return;
    }

    hapticFeedback.toss();

    // Use context function to update categories
    contextTossItem(category.id, 1);

    // Update bag contents in context (persists across tab switches)
    addToBag(category.name, 1);

    // Create flying animation
    const flyingItem = {
      id: Date.now(),
      startX: gridPosition.x,
      startY: gridPosition.y,
      endX: width / 2 - 20,
      endY: 150,
      emoji: category.emoji,
    };

    setFlyingItems((prev) => [...prev, flyingItem]);
  };

  const dumpAll = (category) => {
    if (category.cleanCount === 0) return;

    const count = category.cleanCount;
    // Check bag capacity - only add what fits
    const availableSpace = maxCapacity - bagCount;
    if (availableSpace <= 0) {
      alert(`Bag is full! Maximum capacity is ${maxCapacity} items.`);
      return;
    }

    const toAdd = Math.min(count, availableSpace);

    // Use context function to update categories
    for (let i = 0; i < toAdd; i++) {
      contextTossItem(category.id, 1);
    }

    // Update bag contents in context (persists across tab switches)
    addToBag(category.name, toAdd);
    
    if (toAdd < count) {
      alert(`Added ${toAdd} items. Bag is now full (${maxCapacity}/${maxCapacity}). ${count - toAdd} items remaining.`);
    }
  };

  const quickFill = () => {
    hapticFeedback.quickFill();
    
    // Quick fill: add 2 items from each category that has clean items available
    // (or all available if less than 2)
    let totalAdded = 0;

    categories.forEach((cat) => {
      if (cat.cleanCount > 0 && !cat.hibernated) {
        const toAdd = Math.min(2, cat.cleanCount);
        // Also check bag capacity
        if (bagCount + totalAdded + toAdd <= maxCapacity) {
          totalAdded += toAdd;
          // Use context function to update categories
          for (let i = 0; i < toAdd; i++) {
            contextTossItem(cat.id, 1);
          }
          // Update bag contents in context (persists across tab switches)
          addToBag(cat.name, toAdd);
        }
      }
    });
  };

  const dispatchBag = () => {
    if (bagCount === 0) return;

    hapticFeedback.dispatch();

    // Use context function to dispatch laundry (this also clears the bag)
    dispatchLaundry(bagContents);

    // Show success feedback
    alert(`✅ Batch Dispatched!\n\n${bagCount} items sent to laundry.`);
  };

  const removeFlyingItem = (id) => {
    setFlyingItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Virtual Bag Section */}
        <View ref={bagRef}>
          <VirtualBag
            bagCount={bagCount}
            bagContents={bagContents}
            maxCapacity={maxCapacity}
            onDispatch={dispatchBag}
            onQuickFill={quickFill}
          />
        </View>

        {/* Toss Grid Section */}
        <View style={styles.tossSection}>
          <Text style={styles.tossSectionTitle}>AVAILABLE IN CLOSET</Text>
          <Text style={styles.tossSectionSubtitle}>
            Tap to toss • Hold to dump all
          </Text>

          <View style={styles.categoryGrid}>
            {categories && categories.length > 0 ? (
              categories.map((category, index) => (
                <View
                  key={category.id}
                  ref={(ref) => (gridRefs.current[category.id] = ref)}
                  onLayout={(event) => {
                    if (gridRefs.current[category.id]) {
                      gridRefs.current[category.id].measure(
                        (x, y, width, height, pageX, pageY) => {
                          gridRefs.current[category.id].position = {
                            x: pageX + width / 2,
                            y: pageY + height / 2,
                          };
                        }
                      );
                    }
                  }}
                >
                  <CategoryButton
                    category={category}
                    onToss={(cat) =>
                      tossItem(
                        cat,
                        gridRefs.current[category.id]?.position || { x: 0, y: 0 }
                      )
                    }
                    onDumpAll={() => dumpAll(category)}
                  />
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No categories available</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Flying Items Layer */}
      <View style={[styles.flyingItemsContainer, {pointerEvents: 'none'}]}>
        {flyingItems.map((item) => (
          <FlyingItem
            key={item.id}
            startX={item.startX}
            startY={item.startY}
            endX={item.endX}
            endY={item.endY}
            emoji={item.emoji}
            onComplete={() => removeFlyingItem(item.id)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bagSection: {
    padding: width < 400 ? 16 : 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2A2A2A',
  },
  bagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: width < 400 ? 12 : 16,
  },
  bagTitle: {
    fontSize: width < 400 ? 12 : 14,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 2,
  },
  quickFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2A3A',
    paddingHorizontal: width < 400 ? 10 : 12,
    paddingVertical: width < 400 ? 5 : 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  quickFillIcon: {
    fontSize: width < 400 ? 14 : 16,
    marginRight: width < 400 ? 3 : 4,
  },
  quickFillText: {
    fontSize: width < 400 ? 10 : 11,
    fontWeight: '700',
    color: '#00E5FF',
    letterSpacing: 1,
  },
  bagContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: width < 400 ? 16 : 20,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  bagVisual: {
    position: 'relative',
    height: width < 400 ? 160 : 200,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: width < 400 ? 12 : 16,
  },
  liquidContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  liquidFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 8,
  },
  bagOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bagCount: {
    fontSize: width < 400 ? 48 : 64,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    textShadow: '0px 2px 8px rgba(0, 0, 0, 0.8)',
  },
  bagLabel: {
    fontSize: width < 400 ? 10 : 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 4,
    textShadow: '0px 1px 4px rgba(0, 0, 0, 0.8)',
  },
  bagCapacity: {
    fontSize: width < 400 ? 10 : 11,
    color: '#CCCCCC',
    marginTop: width < 400 ? 6 : 8,
    textShadow: '0px 1px 4px rgba(0, 0, 0, 0.8)',
  },
  peekContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: width < 400 ? 10 : 12,
    marginBottom: width < 400 ? 12 : 16,
  },
  peekLabel: {
    fontSize: width < 400 ? 10 : 11,
    fontWeight: '700',
    color: '#00E5FF',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  peekSummary: {
    fontSize: width < 400 ? 12 : 13,
    color: '#AAAAAA',
    lineHeight: width < 400 ? 16 : 18,
    marginTop: width < 400 ? 6 : 8,
  },
  dispatchButtonContainer: {
    width: '100%',
  },
  dispatchButton: {
    backgroundColor: '#00E5FF',
    borderRadius: 12,
    paddingVertical: width < 400 ? 16 : 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...(Platform.OS !== 'web' && {
      shadowColor: '#00E5FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    }),
    ...(Platform.OS === 'web' && {
      boxShadow: '0px 4px 12px rgba(0, 229, 255, 0.3)',
    }),
  },
  dispatchButtonDisabled: {
    backgroundColor: '#2A2A2A',
    shadowOpacity: 0,
  },
  dispatchIcon: {
    fontSize: width < 400 ? 20 : 24,
    marginRight: width < 400 ? 6 : 8,
  },
  dispatchText: {
    fontSize: width < 400 ? 14 : 16,
    fontWeight: '700',
    color: '#121212',
    letterSpacing: 1.5,
  },
  tossSection: {
    padding: width < 400 ? 16 : 20,
  },
  tossSectionTitle: {
    fontSize: width < 400 ? 12 : 14,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 2,
    marginBottom: 4,
  },
  tossSectionSubtitle: {
    fontSize: width < 400 ? 10 : 11,
    color: '#666666',
    marginBottom: width < 400 ? 16 : 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: width < 400 ? (width - 48) / 2 : (width - 52) / 2, // 20 padding each side + 8 gap on small, 12 gap on larger
    maxWidth: width < 400 ? 160 : 180,
    minWidth: width < 400 ? 120 : 140,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: width < 400 ? 12 : 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  categoryButtonDisabled: {
    opacity: 0.4,
  },
  categoryButtonLongPress: {
    borderColor: '#FFAB00',
    backgroundColor: '#2A2010',
  },
  categoryEmoji: {
    fontSize: width < 400 ? 40 : 48,
    marginBottom: width < 400 ? 6 : 8,
  },
  categoryButtonName: {
    fontSize: width < 400 ? 12 : 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: width < 400 ? 6 : 8,
    textAlign: 'center',
  },
  categoryCountBadge: {
    backgroundColor: '#00E5FF',
    borderRadius: 20,
    paddingHorizontal: width < 400 ? 10 : 12,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: width < 400 ? 50 : 60,
  },
  categoryCountText: {
    fontSize: width < 400 ? 16 : 18,
    fontWeight: '700',
    color: '#121212',
    fontVariant: ['tabular-nums'],
  },
  categoryCountLabel: {
    fontSize: width < 400 ? 8 : 9,
    color: '#121212',
    letterSpacing: 1,
  },
  longPressHint: {
    fontSize: width < 400 ? 8 : 9,
    color: '#666666',
    marginTop: width < 400 ? 6 : 8,
    textAlign: 'center',
  },
  flyingItemsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  flyingItem: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyingItemEmoji: {
    fontSize: 32,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});

export default VirtualHamper;
