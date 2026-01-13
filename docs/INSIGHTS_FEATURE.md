# User Insights Feature

## Overview
Added a Google Photos-style insights feature that analyzes user memories using the multi-agent InsightAgent system.

## Implementation

### 1. Components Created

#### `components/InsightsModal.tsx`
- **Purpose**: Modal UI component to display insights
- **Features**:
  - Patterns section (temporal, categorical, behavioral)
  - Trends & changes visualization
  - Memory connections/relationships
  - Actionable insights with priority levels
  - Loading states and empty states
  - Responsive design with scroll area

#### `hooks/use-insights.ts`
- **Purpose**: Custom React hook for insights state management
- **Methods**:
  - `fetchInsights(userId)`: Fetch insights from API
  - `clearInsights()`: Clear cached insights
- **State**: `data`, `loading`, error handling

### 2. API Endpoint

#### `app/api/insights/route.ts`
- **Method**: POST
- **Authentication**: Required (Supabase auth)
- **Process**:
  1. Validates user authentication
  2. Initializes InsightAgent from multi-agent system
  3. Executes comprehensive memory analysis
  4. Returns patterns, relationships, trends, and actionable insights
- **Response Structure**:
```json
{
  "success": true,
  "data": {
    "patterns": [],
    "relationships": [],
    "trends": [],
    "insights": [],
    "summary": "string"
  },
  "metadata": {
    "confidence": 0.85,
    "executionTime": 1200,
    "reasoning": []
  }
}
```

### 3. Home Page Integration

#### Changes to `app/page.tsx`
- Added "Your Insights" pill button above "Welcome back"
- Button styling: glass-card with purple gradient and sparkle animation
- Click handler: Opens modal and fetches insights on first click
- Imports: InsightsModal component and useInsights hook

### 4. Insights Agent Integration

Uses existing `lib/agents/InsightAgent.ts` which provides:
- **Pattern Discovery**: Temporal, categorical, and behavioral patterns
- **Relationship Mapping**: Connections between memories
- **Trend Analysis**: Changes over time
- **Proactive Insights**: Actionable recommendations

## User Flow

1. User sees "Your Insights" pill button on home page
2. Clicks button → Modal opens with loading state
3. API calls InsightAgent to analyze all user memories
4. Agent discovers:
   - Memory creation patterns
   - Category distribution
   - Behavioral trends
   - Memory relationships
   - Actionable recommendations
5. Results displayed in organized sections with visual indicators
6. User can view detailed breakdowns and suggested actions

## Features Like Google Photos

- **Automatic Analysis**: No manual input required
- **Visual Presentation**: Cards, badges, and icons for easy scanning
- **Patterns**: Similar to Google Photos' "Rediscover this day"
- **Trends**: Shows increases/decreases in memory creation
- **Actionable**: Suggests next steps (add details, merge duplicates, etc.)
- **Smart Insights**: AI-powered recommendations based on data

## Modular Architecture

### Separation of Concerns
- **UI Layer**: InsightsModal component (presentation only)
- **Business Logic**: useInsights hook (state management)
- **API Layer**: /api/insights route (orchestration)
- **Agent Layer**: InsightAgent (analysis logic)

### Future Extensibility
- Easy to add new insight types (modify InsightAgent)
- Can create mobile-specific insights UI
- Reusable hook for other pages
- API can be extended with filters/parameters
- Agent system allows for specialized analysis

## No Breaking Changes
- ✅ Core structure maintained
- ✅ Existing functionality unchanged
- ✅ New files only (no modifications to existing logic)
- ✅ Optional feature (doesn't affect main workflows)

## Files Created/Modified

### Created:
1. `components/InsightsModal.tsx` - UI component
2. `hooks/use-insights.ts` - Custom hook
3. `app/api/insights/route.ts` - API endpoint

### Modified:
1. `app/page.tsx` - Added insights button and modal integration

Total: 3 new files, 1 file modified (minimal changes)
