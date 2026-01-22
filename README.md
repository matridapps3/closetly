# Wardrobe Flow - Dashboard Implementation

## Overview
A minimalist, data-driven inventory optimization app for personal wardrobes. Built with React Native following the "Minimalist Labz" design philosophy featuring high-contrast neon accents on deep charcoal backgrounds.

## Design Philosophy
- **Background**: Deep charcoal (#121212)
- **Accents**: Neon cyan (#00E5FF), amber (#FFAB00), red (#FF5252)
- **Typography**: Monospaced numbers, wide-tracked labels
- **Principle**: Industrial gauge aesthetics with minimal UI

## Installation

```bash
npm install
# or
yarn install
```

## Required Dependencies
- `react-native`: Core framework
- `react-native-svg`: For the Health Ring circular progress indicator
- `expo` (optional): For easier development and testing

## Component Structure

### 1. Health Ring Component
**Purpose**: Visual representation of wardrobe health (0-100%)

**Color Logic**:
- **Cyan (#00E5FF)**: Score ≥ 80% - Optimal flow
- **Amber (#FFAB00)**: Score 50-79% - Warning state
- **Red (#FF5252)**: Score < 50% - Critical failure

**Features**:
- Animated circular progress ring
- Large monospaced score display
- Heavy industrial gauge aesthetic
- Smooth 1.5s animation on score changes

### 2. Smart Insight Cards
**Purpose**: Dynamic alerts and behavioral analysis feed

**Card Structure**:
- Left border (4px) indicates urgency level
- Title in white bold text
- Body in light grey (#AAAAAA)
- Category icon on right side
- Subtle elevation shadow for depth

## Smart Insight Logic Library

### 🔴 Type A: Critical Alerts (Immediate Action Required)

#### 1. Bottleneck Warning
```javascript
Logic: Clean_Stock < (Daily_Burn_Rate * 2)
Trigger: When any category will run out in <2 days
```

#### 2. Monday Panic Forecast
```javascript
Logic: Historical pattern detection for weekday stockouts
Trigger: Pattern shows recurring zero-stock on specific days
```

#### 3. Laundry Overload
```javascript
Logic: Dirty_Count > (Total_Owned * 0.8)
Trigger: >80% of wardrobe is dirty
```

### 🟠 Type B: Efficiency Opportunities

#### 4. Pareto Dead Stock Detector
```javascript
Logic: Total_Owned is high BUT Max_Batch_Size is low over 3 cycles
Trigger: 20 items owned but only 5 regularly used
Purpose: Identify underutilized inventory
```

#### 5. Limiting Reagent (Outfit Capacity)
```javascript
Logic: Min(Clean_Tops, Clean_Bottoms)
Trigger: Imbalance between clothing categories
Purpose: Show true outfit availability
```

#### 6. False Scarcity Check
```javascript
Logic: User accesses "Buy" screen while Dirty_Count > 50%
Trigger: Shopping intent with high dirty inventory
Purpose: Prevent unnecessary purchases
```

### 🔵 Type C: Behavioral Analysis

#### 7. Procrastination Index
```javascript
Logic: Standard_Deviation of days_between_laundry
Trigger: High variance in laundry schedule
Purpose: Encourage routine stability
```

#### 8. Seasonal Drift
```javascript
Logic: Category_Usage = 0 for >45 days
Trigger: Items unused for 6+ weeks
Purpose: Suggest storage optimization
```

#### 9. One-In, One-Out Prompt
```javascript
Logic: Triggered 7 days post-purchase if no discard logged
Purpose: Maintain inventory discipline
```

## Implementation Roadmap

### Phase 1: Static Dashboard ✅
- [x] Health Ring with color-coded states
- [x] Scrollable insight feed
- [x] Card styling with urgency indicators
- [x] Animated ring progress

### Phase 2: State Management (Next Steps)
```javascript
// Recommended: Redux Toolkit or Zustand
const wardrobeStore = {
  inventory: {
    totalOwned: {},
    cleanStock: {},
    dirtyStock: {},
  },
  usage: {
    dailyBurnRate: {},
    rotationHistory: [],
  },
  insights: [],
  flowScore: 0,
}
```

### Phase 3: Logic Engine
Implement calculation functions for each insight type:

```javascript
// Example: Bottleneck Detection
function detectBottleneck(category) {
  const cleanStock = inventory.cleanStock[category];
  const burnRate = usage.dailyBurnRate[category];
  const daysRemaining = cleanStock / burnRate;
  
  if (daysRemaining < 2) {
    return {
      urgency: 'critical',
      type: 'bottleneck',
      title: 'Bottleneck Detected',
      message: `${category}. You have ${cleanStock} items left. At your current pace, you reach zero on ${predictDate(daysRemaining)}.`
    };
  }
  return null;
}
```

### Phase 4: Data Input Screens
- Laundry Chute: Quick-add dirty items
- Inventory Editor: Manage total owned
- Usage Logger: Track what's being worn

### Phase 5: Analytics Dashboard
- Flow Score calculation algorithm
- Historical trend graphs
- Predictive modeling for stockouts

## Usage Example

```jsx
import WardrobeFlowDashboard from './WardrobeFlowDashboard';

function App() {
  return <WardrobeFlowDashboard />;
}
```

## Customization

### Adjusting the Health Ring
```javascript
// Modify score thresholds in getRingColor()
const getRingColor = (flowScore) => {
  if (flowScore >= 85) return '#00E5FF'; // More strict optimal
  if (flowScore >= 60) return '#FFAB00'; // Adjusted warning
  return '#FF5252';
};
```

### Adding New Insight Types
```javascript
const newInsight = {
  id: uniqueId,
  urgency: 'warning', // 'critical' | 'warning' | 'insight'
  type: 'custom_type',
  title: 'Your Title',
  message: 'Your detailed message',
};
```

## Design Specifications

### Typography Scale
- **Score Number**: 64px, Bold, Tabular nums, -2 letter-spacing
- **Score Label**: 11px, Semibold, +2.5 letter-spacing, uppercase
- **Card Title**: 16px, Bold, +0.3 letter-spacing
- **Card Body**: 14px, Regular, +0.2 letter-spacing, 20px line-height

### Spacing
- Ring top margin: 40px
- Ring to insights gap: 20px
- Card margin bottom: 16px
- Card padding: 16px
- Card border-left: 4px

### Colors Reference
```javascript
const COLORS = {
  background: '#121212',
  cardBackground: '#1E1E1E',
  ringBackground: '#2A2A2A',
  
  // Status Colors
  optimal: '#00E5FF',  // Cyan
  warning: '#FFAB00',  // Amber
  critical: '#FF5252', // Red
  insight: '#2196F3',  // Blue
  
  // Text
  primary: '#FFFFFF',
  secondary: '#AAAAAA',
  tertiary: '#888888',
};
```

## Performance Considerations

- Ring animation uses native driver where possible
- ScrollView with `showsVerticalScrollIndicator={false}` for clean look
- Shadow elevation optimized for mobile performance
- Memoize insight calculations to prevent unnecessary re-renders

## Testing Scenarios

1. **Score = 85**: Ring should be cyan, minimal critical alerts
2. **Score = 65**: Ring should be amber, efficiency warnings present
3. **Score = 35**: Ring should be red, multiple critical alerts
4. **Long insight list**: Scrolling should be smooth
5. **Score changes**: Animation should be fluid over 1.5s

## Next Steps

1. Connect to actual data sources (AsyncStorage or SQLite)
2. Implement calculation engine for Flow Score
3. Build Laundry Chute input interface
4. Add push notifications for critical alerts
5. Implement historical tracking and trends
6. Add settings for customizing thresholds

## License
MIT

## Contact
For questions about implementation or design philosophy, refer to the Minimalist Labz design system documentation.
