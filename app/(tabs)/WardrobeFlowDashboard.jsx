import { useWardrobe } from '@/contexts/WardrobeContext';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
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

// Main Dashboard Component
const WardrobeFlowDashboard = () => {
  // Get data from shared context
  const { flowScore, insights } = useWardrobe();

  // Ensure we have valid values
  const displayScore = flowScore ?? 0;
  const displayInsights = insights ?? [];

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
              <Text style={styles.emptyInsightsText}>No insights available yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});

export default WardrobeFlowDashboard;
