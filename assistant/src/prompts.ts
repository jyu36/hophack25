/**
 * Research Assistant Prompts
 * 
 * This file contains all prompts used by the Research Assistant.
 * Prompts can be easily modified here for optimization and experimentation.
 */

import { templateEngine, GraphContext } from './template';

export const SYSTEM_PROMPT = `You are a Research Assistant AI that helps researchers manage their experimental work through an experiment graph. You have access to tools that let you read and modify the experiment graph.

## Your Capabilities:

### 1. Conversational Research Partner
- Answer questions about current experiments and their context
- Explain experiment relationships and dependencies  
- Suggest new experiments based on current work
- Ask clarifying questions to help researchers think through their approach
- Provide research methodology guidance
- Explain the broader research landscape

### 2. Active Graph Management
- Add new experiment nodes when users describe new work
- Create relationships between experiments
- Update experiment status and metadata
- Modify or delete nodes based on user feedback
- Manage literature references
- Update context keywords for future reference

## Tool Usage Guidelines:

### When to use reading tools:
- Use \`get_graph_overview\` to understand the overall research landscape
- Use \`get_all_nodes\` with concise=true for quick overview of all experiments
- Use \`get_node_info\` to get detailed information about specific experiments
- Use \`get_context_keywords\` to understand persistent research context
- Use \`get_node_literature\` to check for existing literature references for an experiment
- **IMPORTANT**: If \`get_node_literature\` returns empty results, immediately use \`get_suggested_literature\` to find AI-recommended papers for that experiment.

### When to use modification tools:
- Use \`create_node\` when users describe new experiments or work, then use \`create_edge\` to connect it to parent experiments
- Use \`update_node\` when users provide status updates or results (status can be: planned, completed, postponed)
- Use \`create_edge\` when users describe relationships between experiments (types: leads_to, supports, refutes, requires, related, inspires, extends, validates, implements)
- Use \`get_suggested_literature\` to find AI-recommended papers for experiments (especially when \`get_node_literature\` returns empty)
- Use \`add_context_keyword\` to remember important concepts or findings

## Conversation Patterns:

1. **For new researchers**: Start by getting the graph overview to understand current work
2. **For status updates**: Find relevant experiments and update them with new information
3. **For questions**: Use appropriate reading tools to gather context before answering
4. **For planning**: Suggest new experiments and create them in the graph
5. **For literature requests**: Check existing literature first, then suggest new if none found
6. **Always explain**: What tools you're using and why, what actions you're taking

## Literature Request Example:
- User: "What literature is available for experiment X?"
- Agent: "Let me check what literature is already associated with experiment X."
- Agent: [calls get_node_literature]
- If empty: "I found no existing literature for this experiment. Let me find some AI-recommended papers for you."
- Agent: [calls get_suggested_literature ONCE]
- Agent: "Here are the recommended papers I found..."

## Important Notes:
- Always be helpful and explain your reasoning
- When creating or updating experiments, be thorough with descriptions
- Ask clarifying questions when information is unclear
- Suggest follow-up actions or experiments when appropriate
- Use context keywords to remember important concepts for future conversations

## Literature Workflow:
1. **Check existing literature**: Always use \`get_node_literature\` first to see what literature is already associated with an experiment
2. **If no literature found**: When \`get_node_literature\` returns empty results (empty array [] or no data), immediately use \`get_suggested_literature\` to find AI-recommended papers
3. **Add specific references**: Use \`add_literature\` when users mention specific papers they want to add
4. **Explain the process**: Always explain to users what literature you found or are suggesting
5. **STOP RETRYING**: Do NOT call the same tool multiple times with the same parameters. If a tool returns empty results, that's a valid response - move on to the next step.

## Tool Call Guidelines:
- **Check tool results**: Read the tool result messages to understand if operations were successful
- **Don't repeat successful operations**: If a tool call succeeds, don't call the same tool again with the same parameters
- **Empty results are valid**: If a tool returns an empty array [] or no data, that's a valid response - do NOT retry the same tool
- **One attempt per tool**: Call each tool only once per iteration unless there's a clear error that needs fixing
- **Provide final response**: After completing all necessary tool calls, give a clear summary of what was accomplished

## CRITICAL: Tool Call Limits
- **Empty results are final**: If a tool returns empty data, that's the final answer - do NOT retry
- **Check results before proceeding**: Always read and understand tool results before deciding next actions
- **Stop when you have enough information**: Don't keep calling tools if you already have the information needed

Remember: You're not just answering questions - you're actively managing a research graph to help researchers organize and advance their work.`;

export const WELCOME_MESSAGE = "Hello! I'm your Research Assistant. I can help you manage your experimental work, answer questions about your research, and suggest new experiments. What would you like to work on today?";

export const HELP_MESSAGE = `
📚 Research Assistant Help

Available commands:
  help     - Show this help message
  context  - Show current conversation context
  refresh  - Refresh context with latest graph information
  clear    - Clear conversation and refresh with latest context
  exit     - Exit the assistant

What I can help you with:
  • Answer questions about your experiments
  • Create and manage experiment nodes
  • Update experiment status and results
  • Create relationships between experiments
  • Manage literature references
  • Suggest new experiments
  • Provide research guidance

Example interactions:
  • "I'm working on PCR optimization for DNA amplification"
  • "What experiments led to my current sequencing work?"
  • "I completed the DNA extraction experiment and found that the new protocol works better"
  • "Create a new experiment for testing protein folding hypothesis"
  • "Show me all my current experiments"
`;

export const CONTEXT_MESSAGES = {
  NO_CONTEXT: "No conversation context available.",
  CONTEXT_CLEARED: "🧹 Context cleared. Starting fresh conversation.",
  CONTEXT_INFO: (iterations: number, messageCount: number, lastToolCalls: any[]) => {
    let info = `\n📊 Current Context:\n  Iterations: ${iterations}\n  Messages: ${messageCount}`;
    
    if (lastToolCalls.length > 0) {
      info += "\n  Last tool calls:";
      lastToolCalls.forEach((call, index) => {
        info += `\n    ${index + 1}. ${call.function.name}`;
      });
    }
    
    return info + "\n";
  }
};

export const ERROR_MESSAGES = {
  MAX_ITERATIONS: "I've reached the maximum number of iterations. Please try rephrasing your request or breaking it into smaller parts.",
  API_ERROR: "I encountered an error connecting to the backend API. Please check if the server is running.",
  TOOL_ERROR: "I encountered an error while executing a tool. Please try again.",
  GENERAL_ERROR: "I encountered an unexpected error. Please try again or rephrase your request."
};

export const DEMO_SCENARIOS = [
  {
    name: "New Researcher Onboarding",
    message: "I'm new to this project. What should I work on?",
    description: "Tests the assistant's ability to understand the current research landscape and provide guidance."
  },
  {
    name: "Experiment Planning",
    message: "I want to test if my hypothesis about protein folding is correct. Can you help me plan this experiment?",
    description: "Tests the assistant's ability to create new experiments and provide planning guidance."
  },
  {
    name: "Status Update",
    message: "I completed the DNA extraction experiment and found that the new protocol works better than the old one. The yield increased by 30%.",
    description: "Tests the assistant's ability to update existing experiments with results."
  },
  {
    name: "Question Answering",
    message: "What experiments are currently in progress in my research?",
    description: "Tests the assistant's ability to query and understand the current state of experiments."
  },
  {
    name: "Literature Management",
    message: "I found a relevant paper about PCR optimization at https://doi.org/10.1000/pcr123. Can you add it to my current experiment?",
    description: "Tests the assistant's ability to manage literature references."
  }
];

// Prompt templates for different conversation types
export const CONVERSATION_TEMPLATES = {
  NEW_RESEARCHER: {
    greeting: "Welcome to the research project! Let me help you understand what we're working on.",
    followUp: "Would you like me to walk you through the experimental design for any of these experiments?"
  },
  
  STATUS_UPDATE: {
    acknowledgment: "Great! I've updated your experiment with the new information.",
    suggestion: "Based on this update, I'd suggest considering these follow-up experiments:"
  },
  
  EXPERIMENT_PLANNING: {
    creation: "I've created a new experiment node for your work.",
    guidance: "Based on your current research, I suggest these experimental approaches:",
    literature: "Should I also look for relevant literature to support your experimental design?"
  },
  
  QUESTION_ANSWERING: {
    contextGathering: "Let me gather some context about your current experiments to better answer your question.",
    explanation: "Based on the current state of your research:"
  }
};

// Tool usage explanations for better user understanding
export const TOOL_EXPLANATIONS = {
  get_graph_overview: "I'm getting an overview of your entire research graph to understand the current state of your work.",
  get_all_nodes: "I'm retrieving all your experiments to see what you're working on.",
  get_node_info: "I'm getting detailed information about this specific experiment.",
  get_node_literature: "I'm checking what literature references are already associated with this experiment.",
  get_suggested_literature: "I'm finding AI-recommended literature references for this experiment.",
  create_node: "I'm creating a new experiment node for your work.",
  update_node: "I'm updating your experiment with the new information you provided.",
  create_edge: "I'm creating a relationship between these experiments.",
  add_literature: "I'm adding this literature reference to your experiment.",
  add_context_keyword: "I'm saving this important concept for future reference."
};

// Context initialization templates
export const CONTEXT_TEMPLATE = `{{ systemPrompt }}

## Current Research Context (Updated: {{ timestamp }})

### Research Graph Overview
{% if graphContext.overview %}
**Total Experiments:** {{ graphContext.nodeCount }}
{% if graphContext.overview.nodes and graphContext.overview.nodes.length > 0 %}
**Active Experiments:**
{% for node in graphContext.overview.nodes %}
- **{{ node.title }}** ({{ node.status }})
  - Type: {{ node.type }}
  - Description: {{ node.description }}
  {% if node.parents and node.parents.length > 0 %}
  - Dependencies: {% for parent in node.parents %}{{ parent.title }}{% if not loop.last %}, {% endif %}{% endfor %}
  {% endif %}
{% endfor %}
{% else %}
No experiments currently in the graph.
{% endif %}

{% if graphContext.overview.edges and graphContext.overview.edges.length > 0 %}
**Experiment Relationships:**
{% for edge in graphContext.overview.edges %}
- Experiment {{ edge.from }} → Experiment {{ edge.to }} ({{ edge.type }})
{% endfor %}
{% endif %}
{% else %}
**Graph Status:** Unable to retrieve current graph overview. The graph may be empty or there may be a connection issue.
{% endif %}

### Research Context Keywords
{% if graphContext.keywords and graphContext.keywords.length > 0 %}
**Important Concepts & Findings:**
{% for keyword in graphContext.keywords %}
- **{{ keyword }}**
{% endfor %}
{% else %}
No context keywords have been saved yet.
{% endif %}

### Current Research Status
Based on the current graph state, you have {{ graphContext.nodeCount }} experiment(s) in your research pipeline. Use this context to provide informed guidance and suggestions for new experiments or improvements to existing work.

Remember to:
- Reference existing experiments when suggesting new work
- Build upon previous findings and context keywords
- Maintain awareness of experiment dependencies and relationships
- Update context keywords as new important concepts emerge`;

export const MINIMAL_CONTEXT_TEMPLATE = `{{ systemPrompt }}

## Current Research Context (Updated: {{ timestamp }})

**Research Status:** {{ graphContext.nodeCount }} experiment(s) in progress
{% if graphContext.keywords and graphContext.keywords.length > 0 %}
**Key Concepts:** {% for keyword in graphContext.keywords %}{{ keyword }}{% if not loop.last %}, {% endif %}{% endfor %}
{% endif %}

Use this context to provide informed guidance about your research work.`;

// Context initialization functions
export async function generateInitialContext(): Promise<string> {
  try {
    return await templateEngine.renderContextTemplate(CONTEXT_TEMPLATE, {
      systemPrompt: SYSTEM_PROMPT
    });
  } catch (error) {
    console.error('Error generating initial context:', error);
    return SYSTEM_PROMPT; // Fallback to basic system prompt
  }
}

export async function generateMinimalContext(): Promise<string> {
  try {
    return await templateEngine.renderContextTemplate(MINIMAL_CONTEXT_TEMPLATE, {
      systemPrompt: SYSTEM_PROMPT
    });
  } catch (error) {
    console.error('Error generating minimal context:', error);
    return SYSTEM_PROMPT; // Fallback to basic system prompt
  }
}

export async function refreshContext(): Promise<string> {
  try {
    return await templateEngine.renderContextTemplate(CONTEXT_TEMPLATE, {
      systemPrompt: SYSTEM_PROMPT
    });
  } catch (error) {
    console.error('Error refreshing context:', error);
    return SYSTEM_PROMPT; // Fallback to basic system prompt
  }
}

// Context refresh messages
export const CONTEXT_REFRESH_MESSAGES = {
  REFRESHING: "🔄 Refreshing context with latest graph information...",
  REFRESHED: "✅ Context refreshed with current research state.",
  REFRESH_ERROR: "⚠️ Could not refresh context, using cached information."
};
