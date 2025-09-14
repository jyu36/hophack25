#!/usr/bin/env ts-node

import dotenv from "dotenv";
import { ResearchAssistant } from "./agent";
import { ConversationHandler } from "./conversation";
import { createCategoryLogger } from "./logger";

// Load environment variables
dotenv.config();

async function startInteractiveSession() {
  const logger = createCategoryLogger("INTERACTIVE");
  
  console.log("🚀 Starting Research Assistant Interactive Session\n");
  
  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Error: OPENAI_API_KEY environment variable is required");
    process.exit(1);
  }

  if (!process.env.GRAPH_API_BASE) {
    console.error("❌ Error: GRAPH_API_BASE environment variable is required");
    process.exit(1);
  }

  try {
    // Create assistant instance
    const assistant = new ResearchAssistant({
      model: process.env.ASSISTANT_MODEL || "gpt-4o",
      maxIterations: 5,
      temperature: 0.7
    });

    // Create conversation handler
    const conversationHandler = new ConversationHandler(assistant);
    
    // Start interactive session
    await conversationHandler.start();
    
  } catch (error) {
    logger.error('Failed to start interactive session', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    console.error("❌ Failed to start interactive session:", error);
    process.exit(1);
  }
}

// Run the interactive session
if (require.main === module) {
  startInteractiveSession().catch((error) => {
    console.error("❌ Interactive session error:", error);
    process.exit(1);
  });
}

export { startInteractiveSession };
