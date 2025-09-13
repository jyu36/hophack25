import OpenAI from "openai";
import { tools, openaiToolSpecs } from "./tools";
import { logger, createCategoryLogger } from "./logger";
import { SYSTEM_PROMPT, WELCOME_MESSAGE, ERROR_MESSAGES, generateInitialContext, refreshContext, CONTEXT_REFRESH_MESSAGES } from "./prompts";

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
      // Enhanced logging: Show tool details and validation
      this.logger.debug(`🔧 Calling tool: ${toolName}`, { 
        toolName,
        toolDescription: tool.description,
        arguments: args,
        argumentValidation: 'About to validate with Zod schema'
      });

      // Log the tool's expected schema for comparison
      this.logger.debug(`📝 Tool ${toolName} expected schema:`, {
        toolName,
        schema: tool.schema._def,
        requiredFields: this.getRequiredFields(tool.schema),
        optionalFields: this.getOptionalFields(tool.schema)
      });

      const result = await tool.run(args);
      
      // Enhanced logging: Show successful tool execution
      this.logger.debug(`✅ Tool ${toolName} executed successfully:`, {
        toolName,
        executionTime: 'N/A', // Could add timing if needed
        resultType: typeof result,
        resultSize: JSON.stringify(result).length,
        resultPreview: JSON.stringify(result, null, 2).substring(0, 300) + (JSON.stringify(result).length > 300 ? '...' : '')
      });
      
      this.logger.toolCall(toolName, args, result);
      return result;
    } catch (error) {
      // Enhanced logging: Show detailed error information
      this.logger.error(`❌ Tool ${toolName} execution failed:`, {
        toolName,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
        arguments: args,
        expectedSchema: tool.schema._def,
        validationError: error instanceof Error && error.message.includes('validation') ? 'Zod validation failed' : 'Other error'
      });
      
      this.logger.toolCall(toolName, args, undefined, error);
      throw error;
    }
  }

  // Helper method to extract required fields from Zod schema
  private getRequiredFields(schema: any): string[] {
    try {
      if (schema._def.typeName === 'ZodObject') {
        const shape = schema._def.shape();
        return Object.entries(shape)
          .filter(([_, fieldSchema]: [string, any]) => !fieldSchema._def.typeName?.includes('Optional'))
          .map(([key, _]) => key);
      }
      return [];
    } catch {
      return [];
    }
  }

  // Helper method to extract optional fields from Zod schema
  private getOptionalFields(schema: any): string[] {
    try {
      if (schema._def.typeName === 'ZodObject') {
        const shape = schema._def.shape();
        return Object.entries(shape)
          .filter(([_, fieldSchema]: [string, any]) => fieldSchema._def.typeName?.includes('Optional'))
          .map(([key, _]) => key);
      }
      return [];
    } catch {
      return [];
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
        // Enhanced logging: Show raw tool call structure
        this.logger.debug(`🔧 Raw Tool Call Structure:`, {
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          rawArguments: toolCall.function.arguments,
          toolCallType: toolCall.type
        });

        const args = JSON.parse(toolCall.function.arguments);
        
        // Enhanced logging: Show parsed arguments with detailed breakdown
        this.logger.debug(`📋 Parsed Arguments for ${toolCall.function.name}:`, {
          toolName: toolCall.function.name,
          argumentCount: Object.keys(args).length,
          arguments: args,
          argumentTypes: Object.entries(args).reduce((acc, [key, value]) => {
            acc[key] = typeof value;
            return acc;
          }, {} as Record<string, string>)
        });
        
        const result = await this.callTool(toolCall.function.name, args);
        
        // Enhanced logging: Show successful result
        this.logger.debug(`✅ Tool ${toolCall.function.name} completed successfully:`, {
          toolName: toolCall.function.name,
          resultType: typeof result,
          resultKeys: result && typeof result === 'object' ? Object.keys(result) : 'N/A',
          resultPreview: JSON.stringify(result, null, 2).substring(0, 500) + (JSON.stringify(result).length > 500 ? '...' : '')
        });
        
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
        // Enhanced logging: Show detailed error information
        this.logger.error(`❌ Tool ${toolCall.function.name} failed:`, {
          toolName: toolCall.function.name,
          toolCallId: toolCall.id,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          arguments: (() => {
            try {
              return JSON.parse(toolCall.function.arguments);
            } catch {
              return 'Failed to parse arguments';
            }
          })(),
          rawArguments: toolCall.function.arguments
        });
        
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

  private async buildContextualSystemPrompt(): Promise<string> {
    try {
      return await generateInitialContext();
    } catch (error) {
      this.logger.error('Error building contextual system prompt', { error: error instanceof Error ? error.message : String(error) });
      return SYSTEM_PROMPT; // Fallback to basic system prompt
    }
  }

  async refreshContext(): Promise<string> {
    try {
      this.logger.info('Refreshing context with latest graph information');
      return await refreshContext();
    } catch (error) {
      this.logger.error('Error refreshing context', { error: error instanceof Error ? error.message : String(error) });
      return CONTEXT_REFRESH_MESSAGES.REFRESH_ERROR;
    }
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
          // Enhanced logging: Show detailed tool call detection
          this.logger.debug(`🔧 Tool calls detected: ${message.tool_calls.length} calls`, {
            iteration: currentIteration + 1,
            toolCallCount: message.tool_calls.length,
            toolNames: message.tool_calls?.map(tc => tc.function.name) || [],
            toolCallIds: message.tool_calls?.map(tc => tc.id) || [],
            assistantContent: message.content || 'No content'
          });

          // Log each tool call individually
          message.tool_calls?.forEach((toolCall, index) => {
            this.logger.debug(`🔧 Tool Call ${index + 1}/${message.tool_calls?.length || 0}:`, {
              toolCallId: toolCall.id,
              toolName: toolCall.function.name,
              rawArguments: toolCall.function.arguments,
              toolCallType: toolCall.type
            });
          });
          
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

          // Track actions with enhanced details
          for (const toolCall of message.tool_calls) {
            actions.push(`Called ${toolCall.function.name} with args: ${toolCall.function.arguments}`);
          }

          // Log completion of tool execution phase
          this.logger.debug(`✅ Tool execution phase completed:`, {
            iteration: currentIteration + 1,
            toolsExecuted: message.tool_calls.length,
            toolNames: message.tool_calls?.map(tc => tc.function.name) || [],
            resultsCount: toolResults.length
          });

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

  async startConversation(useContext: boolean = true): Promise<{
    response: string;
    context: AgentContext;
  }> {
    this.logger.agent("Starting new conversation");
    
    let systemPrompt: string;
    if (useContext) {
      this.logger.info("Building contextual system prompt with current graph state");
      systemPrompt = await this.buildContextualSystemPrompt();
    } else {
      systemPrompt = this.buildSystemPrompt();
    }
    
    const context: AgentContext = {
      messages: [
        {
          role: "system",
          content: systemPrompt
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
