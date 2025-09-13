import dotenv from "dotenv";
import { ResearchAssistant } from "./agent";
import { ConversationHandler } from "./conversation";

// Load environment variables
dotenv.config();

async function main() {
  // Validate required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Error: OPENAI_API_KEY environment variable is required");
    console.log("Please set your OpenAI API key in the .env file or environment variables");
    process.exit(1);
  }

  if (!process.env.GRAPH_API_BASE) {
    console.error("❌ Error: GRAPH_API_BASE environment variable is required");
    console.log("Please set the backend API base URL in the .env file or environment variables");
    process.exit(1);
  }

  console.log("🚀 Starting Research Assistant...");
  console.log(`📡 Backend API: ${process.env.GRAPH_API_BASE}`);
  console.log(`🤖 Model: ${process.env.ASSISTANT_MODEL || "gpt-4"}`);
  console.log();

  try {
    // Initialize the assistant
    const assistant = new ResearchAssistant({
      model: process.env.ASSISTANT_MODEL || "gpt-4",
      maxIterations: parseInt(process.env.MAX_ITERATIONS || "10"),
      temperature: 0.7
    });

    // Start the conversation handler
    const conversationHandler = new ConversationHandler(assistant);
    await conversationHandler.start();

  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Error starting application:", error);
    process.exit(1);
  });
}
