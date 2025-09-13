# Research Assistant

An AI-powered tool-use agent that helps researchers manage their experimental work through intelligent graph manipulation and conversational guidance.

## Features

- **Conversational Research Partner**: Answer questions about experiments, provide guidance, and suggest new work
- **Active Graph Management**: Automatically create, update, and manage experiment nodes and relationships
- **Literature Integration**: Manage research references and context
- **Context Awareness**: Maintain persistent research context through keywords and experiment metadata
- **Dynamic Context Initialization**: Automatically loads current graph state and context keywords when starting conversations
- **Template System**: Uses Jinja-style templates for dynamic context generation

## Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API key
- Backend API running (see main project README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your OpenAI API key and backend URL
```

3. Build the project:
```bash
npm run build
```

### Usage

#### Interactive Mode
Start a conversational session:
```bash
npm run dev
```

#### Demo Mode
Run the demo to see the assistant in action:
```bash
npm run demo
```

#### Context Demo
Test the new context initialization system:
```bash
npm run context-demo
```

## Configuration

Environment variables in `.env`:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
GRAPH_API_BASE=http://127.0.0.1:8000

# Optional
ASSISTANT_MODEL=gpt-4o
MAX_ITERATIONS=10

# Logging Configuration
LOG_LEVEL=1                    # 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
LOG_CONSOLE=true              # Enable console logging
LOG_FILE=false                # Enable file logging
LOG_FILE_PATH=./logs/assistant.log
```

## How It Works

The Research Assistant is a tool-use agent that:

1. **Initializes with context** by fetching current graph state and context keywords
2. **Receives user input** through a conversational interface
3. **Analyzes intent** and determines what tools to use
4. **Calls backend API tools** to read or modify the experiment graph
5. **Provides intelligent responses** based on the graph state and user needs
6. **Maintains context** through dynamic template-based system prompts

### Available Tools

The assistant has access to all backend API endpoints as tools:

#### Graph Reading
- `get_graph_overview` - Get complete graph representation
- `get_node_info` - Get detailed experiment information
- `get_all_nodes` - List all experiments
- `get_node_literature` - Get literature for specific experiments
- `get_context_keywords` - Get stored research context

#### Graph Modification
- `create_node` - Create new experiments
- `update_node` - Update experiment status and results
- `delete_node` - Remove experiments
- `create_edge` - Create relationships between experiments
- `add_literature` - Add research references
- `add_context_keyword` - Store important concepts

## Context System

The Research Assistant features a sophisticated context initialization system that provides up-to-date information about your research graph when starting conversations.

### How Context Initialization Works

1. **Graph Overview**: Fetches current experiment nodes, their status, and relationships
2. **Context Keywords**: Retrieves stored research concepts and findings
3. **Template Rendering**: Uses Jinja-style templates to generate dynamic system prompts
4. **Context Refresh**: Allows updating context during conversations

### Context Templates

The system uses two main templates:

- **Full Context Template**: Comprehensive overview with detailed experiment information
- **Minimal Context Template**: Lightweight version for quick context updates

### Available Commands

- `refresh` - Refresh context with latest graph information
- `context` - Show current conversation context
- `clear` - Clear conversation and refresh with latest context

### Example Context Output

```
## Current Research Context (Updated: 2024-01-15T10:30:00Z)

### Research Graph Overview
**Total Experiments:** 3
**Active Experiments:**
- **DNA Extraction Optimization** (in_progress)
  - Type: experiment
  - Description: Testing new extraction protocol for higher yield
  - Dependencies: None

- **PCR Amplification** (planned)
  - Type: experiment
  - Description: Amplify extracted DNA samples
  - Dependencies: DNA Extraction Optimization

### Research Context Keywords
**Important Concepts & Findings:**
- **High Yield Protocol**: New extraction method shows 30% improvement
  - Added: 2024-01-14T15:20:00Z
  - Context: DNA extraction optimization
```

## Example Interactions

### New Researcher Onboarding
```
User: "I'm new to this project. What should I work on?"
Assistant: [Gets graph overview] "Welcome! I can see you have 3 active experiments focusing on molecular biology. Based on the current graph, I'd recommend starting with the DNA extraction experiment because it's a prerequisite for the other work. Would you like me to walk you through the experimental design?"
```

### Experiment Planning
```
User: "I want to test if my hypothesis about protein folding is correct"
Assistant: [Creates new experiment node] "I've created a new experiment node for your protein folding hypothesis. Based on your current work, I suggest these experimental approaches: [suggestions]. Should I also look for relevant literature to support your experimental design?"
```

### Status Updates
```
User: "I completed the DNA extraction experiment and found that the new protocol works better"
Assistant: [Updates experiment status and results] "Great! I've updated your DNA extraction experiment status to completed and added your results. This success suggests we should consider these follow-up experiments: [suggests based on graph relationships]"
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  Research        │───▶│  Backend API    │
│                 │    │  Assistant       │    │  (FastAPI)      │
└─────────────────┘    │                  │    └─────────────────┘
                       │  - ReAct Loop    │
                       │  - Tool Calling  │
                       │  - Context Mgmt  │
                       └──────────────────┘
```

## Development

### Project Structure
```
src/
├── agent.ts          # Core agent with ReAct loop
├── tools.ts          # API tool wrappers
├── conversation.ts   # Chat interface handler
├── template.ts       # Context template system
├── prompts.ts        # System prompts and templates
├── index.ts          # Main entry point
├── demo.ts           # Demo script
└── context-demo.ts   # Context system demo
```

### Adding New Tools

1. Add the tool function to `tools.ts`
2. Include it in the `tools` array
3. The agent will automatically have access to it

### Customizing Behavior

- Modify the system prompt in `agent.ts` to change assistant behavior
- Adjust tool selection logic in the ReAct loop
- Add new conversation patterns in `conversation.ts`

## Troubleshooting

### Common Issues

1. **API Connection Error**: Ensure the backend is running and `GRAPH_API_BASE` is correct
2. **OpenAI API Error**: Check your API key and billing status
3. **Tool Execution Error**: Verify the backend API endpoints are working

### Logging System

The assistant uses Winston for logging, similar to Python's logging library. You can control logging behavior through environment variables:

#### Log Levels
- **DEBUG (0)**: Detailed internal information, tool calls, and agent thoughts
- **INFO (1)**: General information about conversations and actions
- **WARN (2)**: Warning messages for non-critical issues
- **ERROR (3)**: Error messages for failures and exceptions

#### Logging Configuration
```bash
# Enable debug logging to see agent's internal thoughts
LOG_LEVEL=0 npm run dev

# Enable file logging
LOG_FILE=true LOG_FILE_PATH=./logs/assistant.log npm run dev

# Disable console logging (file only)
LOG_CONSOLE=false LOG_FILE=true npm run dev
```

#### Logging Categories
The logger provides different categories for easy filtering:
- **AGENT**: General agent operations and initialization
- **TOOL**: Tool execution and results
- **CONVERSATION**: User messages and assistant responses
- **DEMO**: Demo script execution
- **STARTUP**: Application startup and configuration

## License

MIT License - see main project for details.
