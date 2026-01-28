# Closetly

A smart, data-driven wardrobe management app that helps you optimize your clothing inventory, track laundry cycles, and maintain a healthy wardrobe flow. Built with React Native and Expo, featuring a minimalist design with high-contrast neon accents on deep black backgrounds.

## Overview

Closetly treats your wardrobe as a production system, using statistical analysis to predict stockouts, detect dead stock, and optimize your laundry schedule. The app tracks your clothing inventory across three states: **Clean**, **Dirty**, and **In Laundry**, providing real-time insights and analytics to keep your wardrobe flowing smoothly.

## Key Features

### 🏠 Dashboard
- **Flow Score**: Visual health indicator (0-100) showing overall wardrobe availability
  - Cyan (≥80%): Optimal flow
  - Amber (50-79%): Warning state
  - Red (<50%): Critical - action needed
- **Smart Insights**: Dynamic alerts and behavioral analysis
  - Bottleneck warnings (low clean stock)
  - Dead stock detection
  - Laundry consistency recommendations
  - Category-specific insights
- **Welcome Onboarding**: Guided tour for first-time users

### 📦 Inventory Manager
- **Category Management**: Create and organize clothing categories with custom emojis
  - Add/remove categories
  - Custom emoji selection (grid picker + text input with validation)
  - Auto-suggested category names based on emoji
- **Item Tracking**: Manage your clothing inventory
  - Add items to categories (acquisition)
  - Remove/retire items
  - Hibernate unused categories
- **Flow Bar**: Visual representation of inventory state
  - Clean items (cyan)
  - Dirty items (not in laundry) (amber)
  - In laundry items (orange)
  - Real-time synchronization across all tabs

### 🧺 Virtual Hamper
- **Quick Toss**: Send items to the hamper with one tap
  - Items automatically marked as dirty when tossed
  - Category-based organization
  - Quick fill and dump all options
- **Laundry Dispatch**: Send hamper contents to laundry
  - Creates laundry batches
  - Tracks items in process
  - Updates inventory state automatically

### 📊 Analytics Lab

#### Active Cycles Tab
- **In Process Batches**: View all active laundry batches
  - Batch details (items, count, days ago)
  - Mark as clean to return items to inventory
  - Automatic cleanup of orphaned batches

#### Data Lab Tab
- **Burn Down Analysis**: 30-day forecast of clean stock levels
  - Multi-category line chart
  - Predicts when categories will run out
  - Scrollable for long date ranges
- **Inventory Efficiency**: Active vs. Stagnant items
  - Pie chart visualization
  - Percentage utilization display
  - Identifies underutilized inventory
- **Laundry Consistency**: Days between laundry cycles
  - Bar chart showing cycle intervals
  - Optimal interval recommendations
  - Scrollable for multiple cycles

## Design Philosophy

- **Background**: Deep black (#000000)
- **Accents**: Neon cyan (#00E5FF), amber (#FFAB00), red (#FF5252)
- **Typography**: Monospaced numbers, wide-tracked labels
- **Principle**: Industrial gauge aesthetics with minimal UI

## Installation

```bash
npm install
# or
yarn install
```

## Running the App

```bash
# Start development server (LAN mode)
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web

# Start with tunnel (for testing on physical devices)
npm run tunnel
```

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: React Context API
- **Data Persistence**: AsyncStorage
- **Charts**: react-native-chart-kit
- **Icons**: @expo/vector-icons
- **Haptics**: expo-haptics

## Project Structure

```
wardrobeflow/
├── app/
│   ├── (tabs)/
│   │   ├── WardrobeFlowDashboard.jsx  # Main dashboard
│   │   ├── InventoryManager.jsx        # Category & item management
│   │   ├── VirtualHamper.jsx           # Hamper & laundry dispatch
│   │   ├── AnalyticsLab.jsx            # Charts & analytics
│   │   └── _layout.tsx                  # Tab navigation
│   └── _layout.tsx                     # Root layout
├── contexts/
│   ├── WardrobeContext.js              # Global state management
│   ├── WardrobeEngine.js                # Business logic & analytics
│   └── NavigationContext.js            # Navigation state
├── components/
│   ├── Navbar.tsx                       # Top navigation bar
│   ├── Tabbar.tsx                      # Bottom tab bar
│   └── ui/                             # Reusable UI components
└── constants/
    └── theme.ts                        # Design tokens
```

## Core Architecture

### State Management

The app uses React Context (`WardrobeContext`) to manage global state:

- **Categories**: Array of clothing categories with counts (clean, dirty, in laundry, total)
- **Batches**: Active and completed laundry batches
- **Laundry History**: Historical laundry cycle data
- **Bag Contents**: Items currently in the hamper

All state is persisted to AsyncStorage and automatically synchronized across all tabs.

### Analytics Engine

The `WardrobeAnalyticsEngine` class provides:

- **Flow Score Calculation**: Weighted algorithm considering:
  - Clean ratio (35%)
  - Category balance (25%)
  - Bottleneck penalty (25%)
  - Consistency bonus (15%)
- **Burn Down Predictions**: Forecasts when categories will run out of clean items
- **Dead Stock Detection**: Identifies rarely-used items
- **Inventory Efficiency**: Calculates active vs. stagnant items
- **Laundry Cycle Analysis**: Tracks consistency and optimal intervals

### Data Flow

1. **User Actions** → Context functions (e.g., `tossItem`, `dispatchLaundry`)
2. **Context** → Engine processing (e.g., `processItemToss`, `processBatchDispatch`)
3. **Engine** → State updates (categories, batches, history)
4. **State** → UI re-renders (charts, counts, insights)
5. **State** → AsyncStorage persistence

## Key Features Explained

### Flow Score

The Flow Score (0-100) represents your wardrobe's health:

- **High Score (≥80)**: You have plenty of clean clothes available
- **Medium Score (50-79)**: Some categories may be running low
- **Low Score (<50)**: Critical - multiple categories need attention

The score is calculated using:
- Clean inventory ratio across all categories
- Balance between categories
- Bottleneck severity (categories below safety threshold)
- Laundry consistency (regularity of cycles)

### Smart Insights

The app generates contextual insights:

- **Bottleneck Warnings**: When a category's clean stock is below safety threshold
- **Dead Stock Alerts**: Items not worn in 60+ days despite being clean
- **Low Utilization**: Categories with high total but low usage
- **Laundry Recommendations**: Based on cycle consistency

### Burn Down Analysis

Projects clean stock levels over the next 30 days:

- Uses current `cleanCount` and estimated daily consumption
- Shows when categories will run out if no laundry is done
- Helps plan laundry schedules proactively

### Inventory Efficiency

Measures how well you're utilizing your wardrobe:

- **Active Items**: Recently worn (within last 60 days)
- **Stagnant Items**: Not worn in 60+ days
- **Utilization %**: Percentage of active items

## Usage Examples

### Adding a New Category

1. Open **Inventory Manager** tab
2. Tap **+** button
3. Select emoji from grid or type your own
4. Enter category name (auto-filled based on emoji)
5. Set initial count (optional)
6. Tap **Add Category**

### Sending Items to Laundry

1. Open **Virtual Hamper** tab
2. Tap items to add to hamper (or use quick fill)
3. Tap **Dispatch to Laundry** button
4. Items move from "Dirty" to "In Laundry" state
5. View active batches in **Analytics Lab** → **Active Cycles**

### Completing Laundry

1. Open **Analytics Lab** tab
2. Switch to **Active Cycles** tab
3. Find your batch
4. Tap **Mark as Clean**
5. Items return to "Clean" state automatically

## Customization

### Adjusting Flow Score Thresholds

Edit `WardrobeEngine.js` → `_calculateCleanRatioScore()`:

```javascript
const weights = {
  cleanRatio: 0.35,      // Adjust weight
  categoryBalance: 0.25,
  bottleneckPenalty: 0.25,
  consistencyBonus: 0.15,
};
```

### Adding New Insight Types

Edit `WardrobeEngine.js` → `generateInsights()`:

```javascript
const newInsight = {
  id: uniqueId(),
  urgency: 'warning', // 'critical' | 'warning' | 'insight'
  type: 'custom_type',
  title: 'Your Title',
  message: 'Your message',
  categoryName: 'Category Name', // Optional
};
```

## Data Persistence

All data is stored locally using AsyncStorage:

- Categories and inventory counts
- Laundry batches (active and completed)
- Laundry history
- Hamper contents
- User preferences (welcome screen seen)

Data is automatically saved on every state change and loaded on app startup.

## Performance Optimizations

- **Memoization**: Charts and analytics use `useMemo` to prevent unnecessary recalculations
- **Refs for State**: Critical state (categories, batches) uses refs to avoid stale closures
- **Functional Updates**: All state updates use functional form (`prev => ...`) for consistency
- **Lazy Loading**: Charts only render when data is available
- **Scroll Optimization**: Horizontal scroll views for long chart data

## Testing

The app has been tested for:

- ✅ State synchronization across all tabs
- ✅ Edge cases (empty states, null values, division by zero)
- ✅ Data persistence and recovery
- ✅ Chart updates on state changes
- ✅ Laundry cycle tracking
- ✅ Category management (add/remove/hibernate)
- ✅ Hamper operations (toss, dispatch, complete)

## Production Readiness

The app is production-ready with:

- ✅ Comprehensive error handling
- ✅ Input validation (emoji, numbers, text)
- ✅ Null/undefined safety checks
- ✅ Data consistency validation
- ✅ Orphaned data cleanup
- ✅ Smooth animations and transitions
- ✅ Haptic feedback for user actions
- ✅ Responsive layouts

## Future Enhancements

Potential features for future versions:

- Push notifications for critical alerts
- Wear history tracking (manual logging)
- Cost per wear analysis
- Seasonal wardrobe suggestions
- Export/import data functionality
- Cloud sync across devices
- Customizable safety thresholds
- Multi-user support

## License

MIT

## Contact

For questions or feedback about Closetly, please refer to the project repository.

---

**Closetly** - Keep your wardrobe flowing smoothly. 🧺✨
