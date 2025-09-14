# Graph Components

This directory contains the graph visualization components for the research assistant application.

## Components

### GraphPanel

The main graph visualization component that combines Ant Design and React Flow to display experiments as nodes with connecting edges.

**Features:**

- Interactive node visualization with experiment details
- Relationship edges with different styles based on relationship type
- Filtering by status and keywords
- Zoom and pan controls
- Mini-map for navigation
- Real-time status updates
- Responsive design

**Props:**

- `experiments`: Array of ResearchNode objects
- `relationships`: Array of relationship edges
- `extractedKeywords`: Optional array of keywords for filtering
- `onKeywordSelect`: Optional callback for keyword selection
- `onNodeClick`: Optional callback for node clicks
- `onNodeStatusChange`: Optional callback for status changes
- `isLoading`: Loading state
- `error`: Error state

### ExperimentNode

Custom React Flow node component for displaying individual experiments.

**Features:**

- Experiment title and description
- Status indicator with color coding
- Keywords display
- AI-generated indicator
- Interactive status change dropdown
- Node actions menu (view, edit, delete)
- Hover effects and animations

## Usage

```tsx
import { GraphPanel } from "./components/Graph";

<GraphPanel
  experiments={experiments}
  relationships={relationships}
  onNodeClick={handleNodeClick}
  onNodeStatusChange={handleNodeStatusChange}
  isLoading={isLoading}
  error={error}
/>;
```

## Styling

The components use a combination of:

- Ant Design components for UI elements
- React Flow for graph visualization
- Tailwind CSS for layout and styling
- Custom CSS for node styling

## Relationship Types

The graph supports different relationship types with distinct visual styles:

- **leads_to**: Green, thick line, animated
- **supports**: Blue line
- **refutes**: Red line
- **requires**: Orange dashed line
- **related**: Purple thin line

## Dependencies

- `reactflow`: ^11.11.4
- `antd`: ^5.27.3
- `@ant-design/icons`: ^6.0.2
