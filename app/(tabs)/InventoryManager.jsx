import { useWardrobe } from '@/contexts/WardrobeContext';
import React, { useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
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
const FlowBar = ({ cleanCount, dirtyCount, totalOwned }) => {
  const animatedClean = useRef(new Animated.Value(0)).current;
  const animatedDirty = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const cleanPercent = totalOwned > 0 ? (cleanCount / totalOwned) * 100 : 0;
    const dirtyPercent = totalOwned > 0 ? (dirtyCount / totalOwned) * 100 : 0;

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
  }, [cleanCount, dirtyCount, totalOwned]);

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
          <Text style={styles.flowBarLabelDirty}>{dirtyCount}</Text> dirty
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
  const { categories, acquireItem, retireItem, updateCategoryHibernation } = useWardrobe();

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
});

export default InventoryManager;
