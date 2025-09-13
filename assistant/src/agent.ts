import OpenAI from "openai";
import { tools, openaiToolSpecs } from "./tools";

export interface AgentConfig {
  model: string;
  maxIterations: number;
  temperature: number;
}

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: any[];
  toolCallId?: string;
}

export interface AgentContext {
  messages: AgentMessage[];
  currentIteration: number;
  lastToolCalls: any[];
}

export class ResearchAssistant {
  private openai: OpenAI;
  private config: AgentConfig;

  constructor(config: Partial<AgentConfig> = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.config = {
      model: config.model || process.env.ASSISTANT_MODEL || "gpt-4",
      maxIterations: config.maxIterations || parseInt(process.env.MAX_ITERATIONS || "10"),
      temperature: config.temperature || 0.7
    };
  }

  private async callTool(toolName: string, args: any): Promise<any> {
    const tool = tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    try {
      console.log(`🔧 Calling tool: ${toolName}`, args);
      const result = await tool.run(args);
      console.log(`✅ Tool result:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error(`❌ Tool error:`, error);
      throw error;
    }
  }

  private async getAssistantResponse(
    messages: AgentMessage[],
    toolCalls?: any[]
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: messages as any,
      tools: openaiToolSpecs,
      tool_choice: toolCalls ? "auto" : "none",
      temperature: this.config.temperature
    });

    return response;
  }

  private async executeToolCalls(toolCalls: any[]): Promise<AgentMessage[]> {
    const toolResults: AgentMessage[] = [];

    for (const toolCall of toolCalls) {
      try {
        const result = await this.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
        
        toolResults.push({
          role: "assistant",
          content: "",
          toolCalls: [toolCall],
          toolCallId: toolCall.id
        });

        toolResults.push({
          role: "user",
          content: `Tool ${toolCall.function.name} result: ${JSON.stringify(result)}`
        });
      } catch (error) {
        console.error(`Error executing tool ${toolCall.function.name}:`, error);
        
        toolResults.push({
          role: "assistant",
          content: "",
          toolCalls: [toolCall],
          toolCallId: toolCall.id
        });

        toolResults.push({
          role: "user",
          content: `Tool ${toolCall.function.name} error: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }

    return toolResults;
  }

  private buildSystemPrompt(): string {
    return `You are a Research Assistant AI that helps researchers manage their experimental work through an experiment graph. You have access to tools that let you read and modify the experiment graph.

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
- Use \`get_node_literature\` to understand research background

### When to use modification tools:
- Use \`create_node\` when users describe new experiments or work, then use \`create_edge\` to connect it to parent experiments
- Use \`update_node\` when users provide status updates or results
- Use \`create_edge\` when users describe relationships between experiments
- Use \`add_literature\` when users mention relevant papers or references
- Use \`add_context_keyword\` to remember important concepts or findings

## Conversation Patterns:

1. **For new researchers**: Start by getting the graph overview to understand current work
2. **For status updates**: Find relevant experiments and update them with new information
3. **For questions**: Use appropriate reading tools to gather context before answering
4. **For planning**: Suggest new experiments and create them in the graph
5. **Always explain**: What tools you're using and why, what actions you're taking

## Important Notes:
- Always be helpful and explain your reasoning
- When creating or updating experiments, be thorough with descriptions
- Ask clarifying questions when information is unclear
- Suggest follow-up actions or experiments when appropriate
- Use context keywords to remember important concepts for future conversations

Remember: You're not just answering questions - you're actively managing a research graph to help researchers organize and advance their work.`;
  }

  async processMessage(userMessage: string, context?: AgentContext): Promise<{
    response: string;
    newContext: AgentContext;
    actions: string[];
  }> {
    const messages: AgentMessage[] = context?.messages || [
      {
        role: "system",
        content: this.buildSystemPrompt()
      }
    ];

    // Add user message
    messages.push({
      role: "user",
      content: userMessage
    });

    const actions: string[] = [];
    let currentIteration = context?.currentIteration || 0;
    let lastToolCalls: any[] = [];

    // ReAct loop
    while (currentIteration < this.config.maxIterations) {
      console.log(`\n🔄 Iteration ${currentIteration + 1}/${this.config.maxIterations}`);
      
      try {
        const response = await this.getAssistantResponse(messages, lastToolCalls);
        const message = response.choices[0].message;

        if (message.tool_calls && message.tool_calls.length > 0) {
          // Execute tool calls
          lastToolCalls = message.tool_calls;
          const toolResults = await this.executeToolCalls(message.tool_calls);
          
          // Add assistant message with tool calls
          messages.push({
            role: "assistant",
            content: message.content || "",
            toolCalls: message.tool_calls
          });

          // Add tool results
          messages.push(...toolResults);

          // Track actions
          for (const toolCall of message.tool_calls) {
            actions.push(`Called ${toolCall.function.name} with args: ${toolCall.function.arguments}`);
          }

          currentIteration++;
        } else {
          // No tool calls, return final response
          messages.push({
            role: "assistant",
            content: message.content || ""
          });

          return {
            response: message.content || "I apologize, but I couldn't generate a response.",
            newContext: {
              messages,
              currentIteration,
              lastToolCalls
            },
            actions
          };
        }
      } catch (error) {
        console.error("Error in agent loop:", error);
        return {
          response: `I encountered an error: ${error instanceof Error ? error.message : String(error)}`,
          newContext: {
            messages,
            currentIteration,
            lastToolCalls
          },
          actions
        };
      }
    }

    // Max iterations reached
    return {
      response: "I've reached the maximum number of iterations. Please try rephrasing your request or breaking it into smaller parts.",
      newContext: {
        messages,
        currentIteration,
        lastToolCalls
      },
      actions
    };
  }

  async startConversation(): Promise<{
    response: string;
    context: AgentContext;
  }> {
    const welcomeMessage = "Hello! I'm your Research Assistant. I can help you manage your experimental work, answer questions about your research, and suggest new experiments. What would you like to work on today?";
    
    const context: AgentContext = {
      messages: [
        {
          role: "system",
          content: this.buildSystemPrompt()
        }
      ],
      currentIteration: 0,
      lastToolCalls: []
    };

    return {
      response: welcomeMessage,
      context
    };
  }
}
