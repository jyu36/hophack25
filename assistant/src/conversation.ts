import { ResearchAssistant, AgentContext } from "./agent";
import { createCategoryLogger } from "./logger";
import { HELP_MESSAGE, CONTEXT_MESSAGES, CONTEXT_REFRESH_MESSAGES } from "./prompts";
import * as readline from "readline";

export class ConversationHandler {
  private assistant: ResearchAssistant;
  private context: AgentContext | null = null;
  private rl: readline.Interface;
  private logger = createCategoryLogger("CONVERSATION");

  constructor(assistant: ResearchAssistant) {
    this.assistant = assistant;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start(): Promise<void> {
    this.logger.info('Starting conversation handler');
    console.log("🤖 Research Assistant - Starting conversation...\n");
    
    try {
      const { response, context } = await this.assistant.startConversation();
      this.context = context;
      console.log(`Assistant: ${response}\n`);
      
      await this.conversationLoop();
    } catch (error) {
      this.logger.error('Error starting conversation', { error: error instanceof Error ? error.message : String(error) });
      console.error("Error starting conversation:", error);
    }
  }

  private async conversationLoop(): Promise<void> {
    const askQuestion = (): Promise<string> => {
      return new Promise((resolve) => {
        this.rl.question("You: ", (answer) => {
          resolve(answer.trim());
        });
      });
    };

    while (true) {
      try {
        const userInput = await askQuestion();
        
        if (userInput.toLowerCase() === "exit" || userInput.toLowerCase() === "quit") {
          console.log("\n👋 Goodbye! Thanks for using the Research Assistant.");
          break;
        }

        if (userInput.toLowerCase() === "help") {
          this.showHelp();
          continue;
        }

        if (userInput.toLowerCase() === "context") {
          this.showContext();
          continue;
        }

        if (userInput.toLowerCase() === "clear") {
          await this.clearAndRefreshContext();
          continue;
        }

        if (userInput.toLowerCase() === "refresh") {
          await this.refreshContext();
          continue;
        }

        if (!userInput) {
          continue;
        }

        console.log("\n🤔 Thinking...");
        this.logger.info('Processing user message');
        
        const { response, newContext, actions } = await this.assistant.processMessage(userInput, this.context || undefined);
        
        this.context = newContext;
        
        if (actions.length > 0) {
          console.log("\n🔧 Actions taken:");
          actions.forEach((action, index) => {
            console.log(`  ${index + 1}. ${action}`);
          });
          console.log();
        }
        
        console.log(`Assistant: ${response}\n`);
        
        } catch (error) {
          this.logger.error('Error processing message', { error: error instanceof Error ? error.message : String(error) });
          console.error("Error in conversation:", error);
          console.log("Please try again or type 'help' for assistance.\n");
        }
    }

    this.rl.close();
  }

  private showHelp(): void {
    console.log(HELP_MESSAGE);
  }

  private showContext(): void {
    if (!this.context) {
      console.log(CONTEXT_MESSAGES.NO_CONTEXT);
      return;
    }

    console.log(CONTEXT_MESSAGES.CONTEXT_INFO(
      this.context.currentIteration,
      this.context.messages.length,
      this.context.lastToolCalls
    ));
  }

  private async refreshContext(): Promise<void> {
    try {
      console.log(CONTEXT_REFRESH_MESSAGES.REFRESHING);
      
      // Get refreshed context
      const refreshedPrompt = await this.assistant.refreshContext();
      
      if (refreshedPrompt === CONTEXT_REFRESH_MESSAGES.REFRESH_ERROR) {
        console.log(CONTEXT_REFRESH_MESSAGES.REFRESH_ERROR);
        return;
      }

      // Update the system message in the context
      if (this.context && this.context.messages.length > 0) {
        this.context.messages[0].content = refreshedPrompt;
        this.logger.info('Context refreshed successfully');
        console.log(CONTEXT_REFRESH_MESSAGES.REFRESHED);
      } else {
        // If no context exists, start a new conversation with refreshed context
        const { response, context } = await this.assistant.startConversation(true);
        this.context = context;
        console.log(`Assistant: ${response}`);
        console.log(CONTEXT_REFRESH_MESSAGES.REFRESHED);
      }
    } catch (error) {
      this.logger.error('Error refreshing context', { error: error instanceof Error ? error.message : String(error) });
      console.log(CONTEXT_REFRESH_MESSAGES.REFRESH_ERROR);
    }
  }

  private async clearAndRefreshContext(): Promise<void> {
    try {
      console.log(CONTEXT_MESSAGES.CONTEXT_CLEARED);
      console.log(CONTEXT_REFRESH_MESSAGES.REFRESHING);
      
      // Clear existing context and start fresh with updated context
      const { response, context } = await this.assistant.startConversation(true);
      this.context = context;
      
      this.logger.info('Context cleared and refreshed with latest graph information');
      console.log(`Assistant: ${response}`);
      console.log(CONTEXT_REFRESH_MESSAGES.REFRESHED);
    } catch (error) {
      this.logger.error('Error clearing and refreshing context', { error: error instanceof Error ? error.message : String(error) });
      console.log(CONTEXT_REFRESH_MESSAGES.REFRESH_ERROR);
    }
  }
}
