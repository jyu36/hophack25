import { ResearchAssistant, AgentContext } from "./agent";
import * as readline from "readline";

export class ConversationHandler {
  private assistant: ResearchAssistant;
  private context: AgentContext | null = null;
  private rl: readline.Interface;

  constructor(assistant: ResearchAssistant) {
    this.assistant = assistant;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start(): Promise<void> {
    console.log("🤖 Research Assistant - Starting conversation...\n");
    
    try {
      const { response, context } = await this.assistant.startConversation();
      this.context = context;
      console.log(`Assistant: ${response}\n`);
      
      await this.conversationLoop();
    } catch (error) {
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
          this.context = null;
          console.log("🧹 Context cleared. Starting fresh conversation.");
          continue;
        }

        if (!userInput) {
          continue;
        }

        console.log("\n🤔 Thinking...");
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
        console.error("Error in conversation:", error);
        console.log("Please try again or type 'help' for assistance.\n");
      }
    }

    this.rl.close();
  }

  private showHelp(): void {
    console.log(`
📚 Research Assistant Help

Available commands:
  help     - Show this help message
  context  - Show current conversation context
  clear    - Clear conversation context and start fresh
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
`);
  }

  private showContext(): void {
    if (!this.context) {
      console.log("No conversation context available.");
      return;
    }

    console.log("\n📊 Current Context:");
    console.log(`  Iterations: ${this.context.currentIteration}`);
    console.log(`  Messages: ${this.context.messages.length}`);
    
    if (this.context.lastToolCalls.length > 0) {
      console.log("  Last tool calls:");
      this.context.lastToolCalls.forEach((call, index) => {
        console.log(`    ${index + 1}. ${call.function.name}`);
      });
    }
    
    console.log();
  }
}
