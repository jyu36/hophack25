# Research Assistant

An AI-powered tool-use agent that helps researchers manage their experimental work through intelligent graph manipulation and conversational guidance.

## Features

- **Conversational Research Partner**: Answer questions about experiments, provide guidance, and suggest new work
- **Active Graph Management**: Automatically create, update, and manage experiment nodes and relationships
- **Literature Integration**: Manage research references and context
- **Context Awareness**: Maintain persistent research context through keywords and experiment metadata

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

## Configuration

Environment variables in `.env`:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
GRAPH_API_BASE=http://127.0.0.1:8000

# Optional
ASSISTANT_MODEL=gpt-4
MAX_ITERATIONS=10
```

## How It Works

The Research Assistant is a tool-use agent that:

1. **Receives user input** through a conversational interface
2. **Analyzes intent** and determines what tools to use
3. **Calls backend API tools** to read or modify the experiment graph
4. **Provides intelligent responses** based on the graph state and user needs

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
├── index.ts          # Main entry point
└── demo.ts           # Demo script
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

### Debug Mode

Set `DEBUG=true` in your environment to see detailed tool execution logs.

## License

MIT License - see main project for details.
