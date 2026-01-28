import { useWardrobe } from '@/contexts/WardrobeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const RING_SIZE = 240;
const RING_STROKE_WIDTH = 20;
const RING_RADIUS = (RING_SIZE - RING_STROKE_WIDTH) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Health Ring Component
const HealthRing = ({ score }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const getRingColor = (flowScore) => {
    if (flowScore >= 80) return '#00E5FF'; // Cyan - Optimal
    if (flowScore >= 50) return '#FFAB00'; // Amber - Warning
    return '#FF5252'; // Red - Critical
  };

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  const ringColor = getRingColor(score);

  return (
    <View style={styles.ringContainer}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <G rotation="-90" origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}>
          {/* Background Ring */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="#2A2A2A"
            strokeWidth={RING_STROKE_WIDTH}
            fill="none"
          />
          {/* Animated Progress Ring */}
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={ringColor}
            strokeWidth={RING_STROKE_WIDTH}
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.scoreNumber}>{Math.round(score)}</Text>
        <Text style={styles.scoreLabel}>FLOW SCORE</Text>
      </View>
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Smart Insight Card Component
const InsightCard = ({ insight }) => {
  const getBorderColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return '#FF5252'; // Red
      case 'warning':
        return '#FFAB00'; // Amber
      case 'insight':
        return '#2196F3'; // Blue
      default:
        return '#2196F3';
    }
  };

  const getIcon = (type) => {
    const iconMap = {
      bottleneck: '📉',
      forecast: '🔮',
      overload: '🛑',
      deadstock: '⚠️',
      imbalance: '⚖️',
      scarcity: '💸',
      procrastination: '📉',
      seasonal: '❄️',
      maintenance: '♻️',
    };
    return iconMap[type] || '📊';
  };

  return (
    <View
      style={[
        styles.insightCard,
        { borderLeftColor: getBorderColor(insight.urgency) },
      ]}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{insight.title}</Text>
          <Text style={styles.cardBody}>{insight.message}</Text>
        </View>
        <Text style={styles.cardIcon}>{getIcon(insight.type)}</Text>
      </View>
    </View>
  );
};

// Welcome Modal Component
const WelcomeModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Welcome! 👋</Text>
            <Text style={styles.modalSubtitle}>Your smart wardrobe management companion</Text>
            <Text style={styles.modalIntro}>
              Follow these simple steps to get the most out of your wardrobe tracking
            </Text>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.guideSection}>
              {/* Step 1 */}
              <View style={[styles.stepContainer, styles.stepContainerEven]}>
                <View style={styles.guideItem}>
                  <Text style={styles.guideEmoji}>📦</Text>
                  <View style={styles.guideTextContainer}>
                    <Text style={styles.guideTitle}>Set Up Your Inventory</Text>
                    <Text style={styles.guideDescription}>
                      Start by going to the <Text style={styles.highlight}>Inventory Manager</Text> tab. 
                      Tap "Add New Category" to create categories like Shirts, Pants, or Socks. 
                      Choose an emoji and enter the number of items you own in each category.
                    </Text>
                    <Text style={styles.guideTip}>
                      💡 Tip: Be accurate with your initial counts - this helps the app provide better insights!
                    </Text>
                  </View>
                </View>
              </View>

              {/* Step 2 */}
              <View style={[styles.stepContainer, styles.stepContainerOdd]}>
                <View style={styles.guideItem}>
                  <Text style={styles.guideEmoji}>🧺</Text>
                  <View style={styles.guideTextContainer}>
                    <Text style={styles.guideTitle}>Use Your Virtual Hamper</Text>
                    <Text style={styles.guideDescription}>
                      When clothes get dirty, go to the <Text style={styles.highlight}>Virtual Hamper</Text> tab 
                      and tap any category to toss items into your hamper. Items are automatically marked as dirty when tossed. 
                      Once you've collected enough items, tap "Send to Laundry" to create a laundry batch.
                    </Text>
                    <Text style={styles.guideTip}>
                      💡 Tip: In <Text style={styles.highlight}>Inventory Manager</Text>, you'll see three states: 
                      <Text style={styles.highlight}> Clean</Text> (ready to wear), 
                      <Text style={styles.highlight}> Dirty</Text> (in hamper), and 
                      <Text style={styles.highlight}> In Laundry</Text> (being washed)!
                    </Text>
                  </View>
                </View>
              </View>

              {/* Step 3 */}
              <View style={[styles.stepContainer, styles.stepContainerEven]}>
                <View style={styles.guideItem}>
                  <Text style={styles.guideEmoji}>🔄</Text>
                  <View style={styles.guideTextContainer}>
                    <Text style={styles.guideTitle}>Complete Laundry Batches</Text>
                    <Text style={styles.guideDescription}>
                      In the <Text style={styles.highlight}>Analytics Lab</Text> tab, you'll see your active laundry batches 
                      under "In Process". When your laundry is done, tap "Mark Complete" to return those items 
                      to your clean inventory. The app keeps a history of all your laundry cycles.
                    </Text>
                    <Text style={styles.guideTip}>
                      💡 Tip: Regular laundry completion helps maintain a healthy Flow Score!
                    </Text>
                  </View>
                </View>
              </View>

              {/* Step 4 */}
              <View style={[styles.stepContainer, styles.stepContainerOdd]}>
                <View style={styles.guideItem}>
                  <Text style={styles.guideEmoji}>📊</Text>
                  <View style={styles.guideTextContainer}>
                    <Text style={styles.guideTitle}>Monitor Your Flow Score</Text>
                    <Text style={styles.guideDescription}>
                      Your <Text style={styles.highlight}>Flow Score</Text> (shown on this dashboard) measures your wardrobe's 
                      health. A high score means you have enough clean clothes available. The app provides 
                      smart insights and alerts when you need to do laundry or when categories are running low.
                    </Text>
                    <Text style={styles.guideTip}>
                      💡 Tip: Aim for a Flow Score above 50 for optimal wardrobe availability!
                    </Text>
                  </View>
                </View>
              </View>

              {/* Step 5 */}
              <View style={[styles.stepContainer, styles.stepContainerEven]}>
                <View style={styles.guideItem}>
                  <Text style={styles.guideEmoji}>📈</Text>
                  <View style={styles.guideTextContainer}>
                    <Text style={styles.guideTitle}>Explore Analytics & Insights</Text>
                    <Text style={styles.guideDescription}>
                      Visit the <Text style={styles.highlight}>Analytics Lab</Text> to see detailed charts, 
                      track your laundry patterns, view burn-down projections, and read smart insights tailored
                      to your wardrobe.
                    </Text>
                    <Text style={styles.guideTip}>
                      💡 Tip: Check analytics weekly to optimize your laundry schedule and wardrobe size!
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.finalNote}>
                <Text style={styles.finalNoteText}>
                  🎯 <Text style={styles.finalNoteBold}>Remember:</Text> The more you use the app, the better it gets at 
                  understanding your wardrobe patterns and providing personalized insights!
                </Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.modalButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.modalButtonText}>Let's Get Started! 🚀</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Main Dashboard Component
const WardrobeFlowDashboard = () => {
  // Get data from shared context
  const { flowScore, insights } = useWardrobe();
  // Start with welcome visible by default; hide it later if user has already seen it
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  // Ensure we have valid values
  const displayScore = flowScore ?? 0;
  const displayInsights = insights ?? [];

  // Check if welcome modal should be shown (runs once on first dashboard mount)
  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        const hasSeenWelcome = await AsyncStorage.getItem('@wardrobe_has_seen_welcome');
        const shouldShow = !hasSeenWelcome;
        // If user has never seen it, keep it visible; otherwise hide it
        setShowWelcomeModal(shouldShow);
      } catch (error) {
        console.error('Error checking welcome status:', error);
      }
    };

    checkWelcomeStatus();
  }, []);

  // Handle welcome modal close
  const handleCloseWelcome = async () => {
    try {
      await AsyncStorage.setItem('@wardrobe_has_seen_welcome', 'true');
      setShowWelcomeModal(false);
    } catch (error) {
      console.error('Error saving welcome status:', error);
      setShowWelcomeModal(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Health Ring */}
        <HealthRing score={displayScore} />

        {/* Smart Insights Feed */}
        <View style={styles.insightsContainer}>
          {displayInsights.length > 0 ? (
            displayInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))
          ) : (
            <View style={styles.emptyInsights}>
              <Text style={styles.emptyInsightsText}>No insights available</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Welcome Modal */}
      <WelcomeModal visible={showWelcomeModal} onClose={handleCloseWelcome} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 2.5,
    marginTop: 4,
  },
  insightsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  insightCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 16,
    padding: 16,
    ...(Platform.OS !== 'web' && {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    }),
    ...(Platform.OS === 'web' && {
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardText: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  cardBody: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  cardIcon: {
    fontSize: 28,
    marginTop: 2,
  },
  emptyInsights: {
    padding: 20,
    alignItems: 'center',
  },
  emptyInsightsText: {
    fontSize: 26,
    color:'#5FB3B3',
    textAlign: 'center',
  },
  // Welcome Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...(Platform.OS !== 'web' && {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 10,
    }),
    ...(Platform.OS === 'web' && {
      boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.5)',
    }),
  },
  modalHeader: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalIntro: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  modalScroll: {
    maxHeight: 500,
  },
  guideSection: {
    padding: 24,
    paddingTop: 20,
  },
  stepContainer: {
    marginBottom: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  stepContainerEven: {
    backgroundColor: '#222222',
  },
  stepContainerOdd: {
    backgroundColor: '#252525',
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guideEmoji: {
    fontSize: 32,
    marginRight: 16,
    marginTop: 2,
  },
  guideTextContainer: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  guideDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 22,
    marginBottom: 10,
  },
  highlight: {
    color: '#5FABEE',
    fontWeight: '600',
  },
  guideTip: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 6,
    paddingLeft: 4,
  },
  finalNote: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#5FABEE',
  },
  finalNoteText: {
    fontSize: 13,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  finalNoteBold: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButton: {
    backgroundColor: '#5FABEE',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    margin: 24,
    alignItems: 'center',
    ...(Platform.OS !== 'web' && {
      shadowColor: '#5FABEE',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    }),
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default WardrobeFlowDashboard;
