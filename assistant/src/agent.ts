import OpenAI from "openai";
import { tools, openaiToolSpecs } from "./tools";
import { logger, createCategoryLogger } from "./logger";
import { SYSTEM_PROMPT, WELCOME_MESSAGE, ERROR_MESSAGES } from "./prompts";

export interface AgentConfig {
  model: string;
  maxIterations: number;
  temperature: number;
  logLevel?: number;
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
  private logger = createCategoryLogger("AGENT");

  constructor(config: Partial<AgentConfig> = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.config = {
      model: config.model || process.env.ASSISTANT_MODEL || "gpt-4o",
      maxIterations: config.maxIterations || parseInt(process.env.MAX_ITERATIONS || "10"),
      temperature: config.temperature || 0.7
    };

    this.logger.info("Research Assistant initialized", { config: this.config });
  }

  private async callTool(toolName: string, args: any): Promise<any> {
    const tool = tools.find(t => t.name === toolName);
    if (!tool) {
      this.logger.error(`Tool ${toolName} not found`);
      throw new Error(`Tool ${toolName} not found`);
    }

    try {
      this.logger.debug(`Calling tool: ${toolName}`, { args });
      const result = await tool.run(args);
      this.logger.toolCall(toolName, args, result);
      return result;
    } catch (error) {
      this.logger.toolCall(toolName, args, undefined, error);
      throw error;
    }
  }

  private async getAssistantResponse(
    messages: AgentMessage[],
    toolCalls?: any[]
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    this.logger.debug('Making API call to OpenAI', { 
      model: this.config.model, 
      messageCount: messages.length,
      toolChoice: toolCalls ? "auto" : "none"
    });

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: messages as any,
      tools: openaiToolSpecs,
      tool_choice: toolCalls ? "auto" : "none",
      temperature: this.config.temperature
    });

    this.logger.debug('Received response from OpenAI', {
      finishReason: response.choices[0].finish_reason,
      toolCalls: response.choices[0].message.tool_calls?.length || 0,
      contentLength: response.choices[0].message.content?.length || 0
    });

    return response;
  }

  private async executeToolCalls(toolCalls: any[]): Promise<AgentMessage[]> {
    const toolResults: AgentMessage[] = [];
    this.logger.debug(`Executing ${toolCalls.length} tool calls`);

    for (const toolCall of toolCalls) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        this.logger.debug(`Executing tool: ${toolCall.function.name}`, { args });
        
        const result = await this.callTool(toolCall.function.name, args);
        
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

        this.logger.debug(`Tool ${toolCall.function.name} completed successfully`);
      } catch (error) {
        this.logger.error(`Error executing tool ${toolCall.function.name}`, { error: error instanceof Error ? error.message : String(error) });
        
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
    return SYSTEM_PROMPT;
  }

  async processMessage(userMessage: string, context?: AgentContext): Promise<{
    response: string;
    newContext: AgentContext;
    actions: string[];
  }> {
    this.logger.conversation(userMessage);
    this.logger.context(context);

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
      this.logger.iteration(currentIteration + 1, this.config.maxIterations);
      
      try {
        const response = await this.getAssistantResponse(messages, lastToolCalls);
        const message = response.choices[0].message;

        if (message.tool_calls && message.tool_calls.length > 0) {
          this.logger.debug(`Tool calls detected: ${message.tool_calls.length} calls`);
          
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
          this.logger.debug('No tool calls, generating final response');
          messages.push({
            role: "assistant",
            content: message.content || ""
          });

          this.logger.conversation(userMessage, message.content || "");
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
        this.logger.error('Error in agent loop', { error: error instanceof Error ? error.message : String(error) });
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
    this.logger.warn('Max iterations reached', { iterations: currentIteration });
    return {
      response: ERROR_MESSAGES.MAX_ITERATIONS,
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
    this.logger.agent("Starting new conversation");
    
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

    this.logger.conversation("", WELCOME_MESSAGE);
    return {
      response: WELCOME_MESSAGE,
      context
    };
  }
}
