import { useWardrobe } from '@/contexts/WardrobeContext';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  Vibration,
  View,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Haptic Feedback Helper
const hapticFeedback = {
  success: () => Vibration.vibrate([0, 50]),
  warning: () => Vibration.vibrate([0, 30, 20, 30]),
  light: () => Vibration.vibrate(10),
};

// Flow Bar Component
const FlowBar = ({ cleanCount, dirtyCount, inLaundryCount = 0, totalOwned }) => {
  const animatedClean = useRef(new Animated.Value(0)).current;
  const animatedDirty = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const cleanPercent = totalOwned > 0 ? (cleanCount / totalOwned) * 100 : 0;
    // Include items in laundry as part of "dirty" (they're not clean and not available)
    const totalDirty = dirtyCount + inLaundryCount;
    const dirtyPercent = totalOwned > 0 ? (totalDirty / totalOwned) * 100 : 0;

    Animated.parallel([
      Animated.timing(animatedClean, {
        toValue: cleanPercent,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(animatedDirty, {
        toValue: dirtyPercent,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();
  }, [cleanCount, dirtyCount, inLaundryCount, totalOwned]);

  const cleanWidth = animatedClean.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const dirtyWidth = animatedDirty.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.flowBarContainer}>
      <View style={styles.flowBarBackground}>
        <Animated.View
          style={[
            styles.flowBarSegment,
            styles.flowBarClean,
            { width: cleanWidth },
          ]}
        />
        <Animated.View
          style={[
            styles.flowBarSegment,
            styles.flowBarDirty,
            { width: dirtyWidth },
          ]}
        />
      </View>
      <View style={styles.flowBarLabels}>
        <Text style={styles.flowBarLabel}>
          <Text style={styles.flowBarLabelClean}>{cleanCount}</Text> clean
        </Text>
        <Text style={styles.flowBarLabel}>
          <Text style={styles.flowBarLabelDirty}>{dirtyCount + inLaundryCount}</Text> dirty
          {inLaundryCount > 0 && (
            <Text style={styles.flowBarLabelInLaundry}> ({inLaundryCount} in laundry)</Text>
          )}
        </Text>
      </View>
    </View>
  );
};

// Action Button Component
const ActionButton = ({ icon, label, onPress, type = 'default' }) => {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        type === 'plus' && styles.actionButtonPlus,
        type === 'minus' && styles.actionButtonMinus,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.actionButtonIcon}>{icon}</Text>
      <Text style={styles.actionButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

// Purchase Modal Component
const PurchaseModal = ({ visible, onClose, onConfirm, category, utilizationLow }) => {
  const [quantity, setQuantity] = useState('1');
  const [showWarning, setShowWarning] = useState(utilizationLow);

  const handleConfirm = () => {
    hapticFeedback.success();
    onConfirm(parseInt(quantity) || 1);
    setQuantity('1');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add {category}</Text>

          {showWarning && (
            <View style={styles.impulseShield}>
              <Text style={styles.impulseShieldIcon}>⚠️</Text>
              <Text style={styles.impulseShieldTitle}>Impulse Shield Active</Text>
              <Text style={styles.impulseShieldText}>
                Your utilization is low. You own many {category.toLowerCase()} but
                only use a few. Are you sure you need more?
              </Text>
            </View>
          )}

          <Text style={styles.inputLabel}>QUANTITY</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor="#666666"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={handleConfirm}
            >
              <Text style={styles.modalButtonText}>Confirm Purchase</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Retire Modal Component
const RetireModal = ({ visible, onClose, onConfirm, category }) => {
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState(null);

  const reasons = [
    { id: 'worn_out', label: 'Worn Out', icon: '👔' },
    { id: 'donated', label: 'Donated', icon: '🎁' },
    { id: 'lost', label: 'Lost', icon: '❓' },
  ];

  const handleConfirm = () => {
    if (!reason) {
      hapticFeedback.warning();
      return;
    }
    hapticFeedback.success();
    onConfirm(parseInt(quantity) || 1, reason);
    setQuantity('1');
    setReason(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Retire {category}</Text>

          <Text style={styles.inputLabel}>QUANTITY</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor="#666666"
          />

          <Text style={styles.inputLabel}>REASON</Text>
          <View style={styles.reasonGrid}>
            {reasons.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.reasonButton,
                  reason === item.id && styles.reasonButtonSelected,
                ]}
                onPress={() => {
                  setReason(item.id);
                  hapticFeedback.light();
                }}
              >
                <Text style={styles.reasonIcon}>{item.icon}</Text>
                <Text style={styles.reasonLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonConfirm,
                !reason && styles.modalButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!reason}
            >
              <Text style={styles.modalButtonText}>Confirm Retirement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Add Category Modal Component
const AddCategoryModal = ({ visible, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('👕');
  const [initialCount, setInitialCount] = useState('0');
  const scrollViewRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollPosition = useRef(0);
  const maxScrollX = useRef(0);
  
  // Each emoji is 50px wide + 8px margin = 58px, scroll 2.5 emojis at a time
  const SCROLL_STEP = 58 * 2.5; // ~145px

  // Reset scroll state when modal opens
  useEffect(() => {
    if (visible) {
      setCanScrollLeft(false);
      setCanScrollRight(true);
      scrollPosition.current = 0;
      maxScrollX.current = 0;
      // Reset scroll position after a short delay to ensure layout is complete
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: 0, animated: false });
        }
      }, 200);
    }
  }, [visible]);

  const emojiOptions = [
    '👕', '👖', '🧦', '👔', '🩲', '🧥', '👗', '👟', 
    '🧢', '👜', '👠', '👓', '⌚', '🧤', '🧣', '🎩'
  ];

  const handleConfirm = () => {
    if (!name.trim()) {
      hapticFeedback.warning();
      return;
    }
    hapticFeedback.success();
    onConfirm(name.trim(), emoji, parseInt(initialCount) || 0);
    setName('');
    setEmoji('👕');
    setInitialCount('0');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add New Category</Text>

          <Text style={styles.inputLabel}>CATEGORY NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Jackets, Shoes, Accessories"
            placeholderTextColor="#666666"
            autoCapitalize="words"
          />

          <Text style={styles.inputLabel}>EMOJI</Text>
          <View style={styles.emojiPickerContainer}>
            <TouchableOpacity
              style={[styles.emojiArrowButton, styles.emojiArrowLeft, !canScrollLeft && styles.emojiArrowDisabled]}
              onPress={() => {
                if (scrollViewRef.current && canScrollLeft) {
                  const currentX = scrollPosition.current || 0;
                  const newX = Math.max(0, currentX - SCROLL_STEP);
                  scrollViewRef.current.scrollTo({ x: newX, animated: true });
                  hapticFeedback.light();
                }
              }}
              disabled={!canScrollLeft}
              activeOpacity={0.7}
            >
              <Text style={[styles.emojiArrowText, !canScrollLeft && styles.emojiArrowTextDisabled]}>◀</Text>
            </TouchableOpacity>
            
            <ScrollView 
              ref={scrollViewRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              scrollEnabled={true}
              style={styles.emojiPicker}
              contentContainerStyle={styles.emojiPickerContent}
              nestedScrollEnabled={true}
              bounces={false}
              onScroll={(event) => {
                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                const currentX = contentOffset.x;
                const maxX = Math.max(0, contentSize.width - layoutMeasurement.width);
                
                scrollPosition.current = currentX;
                maxScrollX.current = maxX;
                
                const scrollLeft = currentX > 5;
                const scrollRight = currentX < (maxX - 5);
                
                setCanScrollLeft(scrollLeft);
                setCanScrollRight(scrollRight);
              }}
              onContentSizeChange={(contentWidth) => {
                // Check if content is wider than container and update scroll state
                if (scrollViewRef.current && contentWidth > 0) {
                  setTimeout(() => {
                    scrollViewRef.current?.measure((x, y, width, height, pageX, pageY) => {
                      const needsScroll = contentWidth > width;
                      setCanScrollRight(needsScroll);
                      if (!needsScroll) {
                        setCanScrollLeft(false);
                      }
                    });
                  }, 50);
                }
              }}
              scrollEventThrottle={16}
            >
            {emojiOptions.map((em) => (
              <TouchableOpacity
                key={em}
                style={[
                  styles.emojiOption,
                  emoji === em && styles.emojiOptionSelected
                ]}
                onPress={() => {
                  setEmoji(em);
                  hapticFeedback.light();
                }}
              >
                <Text style={styles.emojiOptionText}>{em}</Text>
              </TouchableOpacity>
            ))}
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.emojiArrowButton, styles.emojiArrowRight, !canScrollRight && styles.emojiArrowDisabled]}
              onPress={() => {
                if (scrollViewRef.current && canScrollRight) {
                  const currentX = scrollPosition.current || 0;
                  const maxX = maxScrollX.current || 1000;
                  const newX = Math.min(maxX, currentX + SCROLL_STEP);
                  scrollViewRef.current.scrollTo({ x: newX, animated: true });
                  hapticFeedback.light();
                }
              }}
              disabled={!canScrollRight}
              activeOpacity={0.7}
            >
              <Text style={[styles.emojiArrowText, !canScrollRight && styles.emojiArrowTextDisabled]}>▶</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>INITIAL COUNT (Optional)</Text>
          <TextInput
            style={styles.input}
            value={initialCount}
            onChangeText={setInitialCount}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#666666"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonConfirm,
                !name.trim() && styles.modalButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!name.trim()}
            >
              <Text style={styles.modalButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Remove Category Modal Component
const RemoveCategoryModal = ({ visible, onClose, onConfirm, categories }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const handleConfirm = () => {
    if (!selectedCategoryId) {
      hapticFeedback.warning();
      return;
    }
    hapticFeedback.success();
    onConfirm(selectedCategoryId);
    setSelectedCategoryId(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Remove Category</Text>
          <Text style={styles.deleteWarningText}>
            Select a category to remove. This will permanently delete the category and all its items.
          </Text>

          <ScrollView 
            style={styles.categorySelectList}
            showsVerticalScrollIndicator={false}
          >
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categorySelectItem,
                    selectedCategoryId === category.id && styles.categorySelectItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCategoryId(category.id);
                    hapticFeedback.light();
                  }}
                >
                  <Text style={styles.categorySelectEmoji}>{category.emoji}</Text>
                  <View style={styles.categorySelectText}>
                    <Text style={styles.categorySelectName}>{category.name}</Text>
                    <Text style={styles.categorySelectCount}>
                      {category.totalOwned} items
                    </Text>
                  </View>
                  {selectedCategoryId === category.id && (
                    <Text style={styles.categorySelectCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No categories available</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonDelete,
                !selectedCategoryId && styles.modalButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!selectedCategoryId}
            >
              <Text style={styles.modalButtonText}>Remove Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Category Row Component
const CategoryRow = ({ category, onUpdate, onPurchase, onRetire }) => {
  const [expanded, setExpanded] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [retireModalVisible, setRetireModalVisible] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
    hapticFeedback.light();
  };

  const toggleHibernate = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onUpdate(category.id, { hibernated: !category.hibernated });
    hapticFeedback.light();
  };

  const handlePurchase = (quantity) => {
    onPurchase(category.id, quantity);
  };

  const handleRetire = (quantity, reason) => {
    onRetire(category.id, quantity, reason);
  };

  const hasBottleneck = category.cleanCount < category.safetyThreshold;
  const utilizationLow =
    category.totalOwned >= 15 &&
    (category.maxBatchSize || 0) < category.totalOwned * 0.4;

  return (
    <View
      style={[
        styles.categoryRow,
        category.hibernated && styles.categoryRowHibernated,
      ]}
    >
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.categoryHeaderLeft}>
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryName}>{category.name}</Text>
            {hasBottleneck && (
              <View style={styles.bottleneckBadge}>
                <Text style={styles.bottleneckIcon}>⚠️</Text>
              </View>
            )}
          </View>
          <Text style={styles.categoryCount}>
            {category.totalOwned} owned
          </Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      <FlowBar
        cleanCount={category.cleanCount}
        dirtyCount={category.dirtyCount}
        inLaundryCount={category.inLaundryCount || 0}
        totalOwned={category.totalOwned}
      />

      {expanded && (
        <View style={styles.expandedPanel}>
          <View style={styles.actionButtons}>
            <ActionButton
              icon="+"
              label="Acquire"
              type="plus"
              onPress={() => setPurchaseModalVisible(true)}
            />
            <ActionButton
              icon="−"
              label="Retire"
              type="minus"
              onPress={() => setRetireModalVisible(true)}
            />
          </View>

          <View style={styles.hibernateRow}>
            <View style={styles.hibernateText}>
              <Text style={styles.hibernateLabel}>Seasonal Storage</Text>
              <Text style={styles.hibernateDescription}>
                Hibernate this category for seasonal items
              </Text>
            </View>
            <Switch
              value={category.hibernated}
              onValueChange={toggleHibernate}
              trackColor={{ false: '#2A2A2A', true: '#00E5FF' }}
              thumbColor={category.hibernated ? '#FFFFFF' : '#666666'}
            />
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>CLEAN</Text>
              <Text style={styles.statValue}>{category.cleanCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>DIRTY</Text>
              <Text style={styles.statValue}>{category.dirtyCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>TOTAL</Text>
              <Text style={styles.statValue}>{category.totalOwned}</Text>
            </View>
          </View>
        </View>
      )}

      <PurchaseModal
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
        onConfirm={handlePurchase}
        category={category.name}
        utilizationLow={utilizationLow}
      />

      <RetireModal
        visible={retireModalVisible}
        onClose={() => setRetireModalVisible(false)}
        onConfirm={handleRetire}
        category={category.name}
      />
    </View>
  );
};

// Main Inventory Manager Screen
const InventoryManager = () => {
  // Get categories and actions from shared context
  const { categories, acquireItem, retireItem, updateCategoryHibernation, addCategory, removeCategory } = useWardrobe();
  
  // State for modals
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [removeCategoryModalVisible, setRemoveCategoryModalVisible] = useState(false);

  const updateCategory = (id, updates) => {
    // Handle hibernation toggle - persist in context
    if (updates.hibernated !== undefined) {
      updateCategoryHibernation(id, updates.hibernated);
    }
  };

  const handlePurchase = (categoryId, quantity) => {
    acquireItem(categoryId, quantity, 0);
  };

  const handleRetire = (categoryId, quantity, reason) => {
    retireItem(categoryId, quantity, reason);
  };

  const handleAddCategory = (name, emoji, initialCount) => {
    addCategory(name, emoji, initialCount);
  };

  const handleRemoveCategory = (categoryId) => {
    removeCategory(categoryId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>INVENTORY</Text>
        <Text style={styles.headerSubtitle}>Asset Management</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={({ pressed }) => [
            styles.addCategoryCard,
            pressed && styles.addCategoryCardPressed
          ]}
          onPress={() => {
            setAddCategoryModalVisible(true);
            hapticFeedback.light();
          }}
        >
          <View style={styles.addCategoryContent}>
            <View style={styles.addCategoryIconContainer}>
              <Text style={styles.addCategoryIcon}>+</Text>
            </View>
            <View style={styles.addCategoryTextContainer}>
              <Text style={styles.addCategoryTitle}>Add New Category</Text>
              <Text style={styles.addCategorySubtitle}>Create a new clothing category</Text>
            </View>
            <Text style={styles.addCategoryArrow}>▶</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.removeCategoryCard,
            pressed && styles.removeCategoryCardPressed
          ]}
          onPress={() => {
            setRemoveCategoryModalVisible(true);
            hapticFeedback.light();
          }}
        >
          <View style={styles.addCategoryContent}>
            <View style={styles.removeCategoryIconContainer}>
              <Text style={styles.removeCategoryIcon}>−</Text>
            </View>
            <View style={styles.addCategoryTextContainer}>
              <Text style={styles.addCategoryTitle}>Remove Category</Text>
              <Text style={styles.addCategorySubtitle}>Delete an existing category</Text>
            </View>
            <Text style={styles.addCategoryArrow}>▶</Text>
          </View>
        </Pressable>

        {categories && categories.length > 0 ? (
          categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onUpdate={updateCategory}
              onPurchase={handlePurchase}
              onRetire={handleRetire}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No categories available</Text>
          </View>
        )}
      </ScrollView>

      <AddCategoryModal
        visible={addCategoryModalVisible}
        onClose={() => setAddCategoryModalVisible(false)}
        onConfirm={handleAddCategory}
      />

      <RemoveCategoryModal
        visible={removeCategoryModalVisible}
        onClose={() => setRemoveCategoryModalVisible(false)}
        onConfirm={handleRemoveCategory}
        categories={categories}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888888',
    letterSpacing: 2,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  categoryRow: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  categoryRowHibernated: {
    opacity: 0.5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryHeaderLeft: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  categoryCount: {
    fontSize: 12,
    color: '#888888',
    letterSpacing: 1,
  },
  expandIcon: {
    fontSize: 14,
    color: '#00E5FF',
    marginLeft: 12,
  },
  bottleneckBadge: {
    marginLeft: 8,
    backgroundColor: '#FF5252',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bottleneckIcon: {
    fontSize: 14,
  },
  flowBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  flowBarBackground: {
    height: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  flowBarSegment: {
    height: '100%',
  },
  flowBarClean: {
    backgroundColor: '#00E5FF',
  },
  flowBarDirty: {
    backgroundColor: '#FF5252',
  },
  flowBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  flowBarLabel: {
    fontSize: 11,
    color: '#888888',
    letterSpacing: 0.5,
  },
  flowBarLabelClean: {
    color: '#00E5FF',
    fontWeight: '700',
  },
  flowBarLabelDirty: {
    color: '#FF5252',
    fontWeight: '700',
  },
  expandedPanel: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  actionButtonPlus: {
    backgroundColor: '#1A3A2A',
    borderColor: '#00E5FF',
  },
  actionButtonMinus: {
    backgroundColor: '#3A1A1A',
    borderColor: '#FF5252',
  },
  actionButtonIcon: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  actionButtonLabel: {
    fontSize: 11,
    color: '#AAAAAA',
    letterSpacing: 1,
    marginTop: 4,
  },
  hibernateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  hibernateText: {
    flex: 1,
    marginRight: 16,
  },
  hibernateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  hibernateDescription: {
    fontSize: 12,
    color: '#888888',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#888888',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  impulseShield: {
    backgroundColor: '#3A2A1A',
    borderLeftWidth: 4,
    borderLeftColor: '#FFAB00',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  impulseShieldIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  impulseShieldTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFAB00',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  impulseShieldText: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    fontVariant: ['tabular-nums'],
  },
  reasonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  reasonButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonButtonSelected: {
    backgroundColor: '#1A2A3A',
    borderColor: '#00E5FF',
  },
  reasonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 11,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#2A2A2A',
  },
  modalButtonConfirm: {
    backgroundColor: '#00E5FF',
  },
  modalButtonDisabled: {
    backgroundColor: '#2A2A2A',
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
  addCategoryCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2A2A2A'
  },
  addCategoryCardPressed: {
    backgroundColor: '#1A2A3A',
    borderColor: '#00E5FF',
    borderStyle: 'solid',
  },
  addCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  addCategoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A3A2A',
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    alignItems:'center'
  },
  addCategoryIcon: {
    fontSize: 24,
    color: '#00E5FF',
    fontWeight: '300',
    marginBottom: 6
  },
  addCategoryTextContainer: {
    flex: 1,
  },
  addCategoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  addCategorySubtitle: {
    fontSize: 12,
    color: '#888888',
    letterSpacing: 0.5,
  },
  addCategoryArrow: {
    fontSize: 14,
    color: '#00E5FF',
    marginLeft: 12,
  },
  removeCategoryCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  removeCategoryCardPressed: {
    backgroundColor: '#2A1A1A',
    borderColor: '#FF5252',
  },
  removeCategoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3A1A1A',
    borderWidth: 2,
    borderColor: '#FF5252',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  removeCategoryIcon: {
    fontSize: 24,
    color: '#FF5252',
    fontWeight: '300',
    marginBottom: 6,
  },
  categorySelectList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  categorySelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categorySelectItemSelected: {
    backgroundColor: '#2A1A1A',
    borderColor: '#FF5252',
  },
  categorySelectEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categorySelectText: {
    flex: 1,
  },
  categorySelectName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  categorySelectCount: {
    fontSize: 12,
    color: '#888888',
  },
  categorySelectCheck: {
    fontSize: 20,
    color: '#FF5252',
    fontWeight: '700',
  },
  modalButtonDelete: {
    backgroundColor: '#FF5252',
  },
  deleteWarningText: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
    marginBottom: 20,
  },
  emojiPickerContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  emojiPicker: {
    height: 70,
    flex: 1,
    marginHorizontal: 8,
  },
  emojiPickerContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    flexGrow: 0,
  },
  emojiArrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiArrowLeft: {
    marginRight: 0,
  },
  emojiArrowRight: {
    marginLeft: 0,
  },
  emojiArrowDisabled: {
    opacity: 0.3,
    borderColor: '#666666',
  },
  emojiArrowText: {
    fontSize: 16,
    color: '#00E5FF',
    fontWeight: '700',
  },
  emojiArrowTextDisabled: {
    color: '#666666',
  },
  emojiOption: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionSelected: {
    borderColor: '#00E5FF',
    backgroundColor: '#1A2A3A',
  },
  emojiOptionText: {
    fontSize: 24,
  },
});

export default InventoryManager;
