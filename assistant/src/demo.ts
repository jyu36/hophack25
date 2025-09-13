import dotenv from "dotenv";
import { ResearchAssistant } from "./agent";

// Load environment variables
dotenv.config();

async function runDemo() {
  console.log("🎬 Research Assistant Demo\n");

  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Error: OPENAI_API_KEY environment variable is required");
    return;
  }

  if (!process.env.GRAPH_API_BASE) {
    console.error("❌ Error: GRAPH_API_BASE environment variable is required");
    return;
  }

  const assistant = new ResearchAssistant({
    model: process.env.ASSISTANT_MODEL || "gpt-4",
    maxIterations: 5,
    temperature: 0.7
  });

  // Demo scenarios
  const scenarios = [
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

  let context = null;

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📋 Scenario ${i + 1}: ${scenario.name}`);
    console.log(`📝 Description: ${scenario.description}`);
    console.log(`💬 User: ${scenario.message}`);
    console.log(`${"=".repeat(60)}\n`);

    try {
      const { response, newContext, actions } = await assistant.processMessage(scenario.message, context || undefined);
      
      context = newContext;
      
      if (actions.length > 0) {
        console.log("🔧 Actions taken:");
        actions.forEach((action, index) => {
          console.log(`  ${index + 1}. ${action}`);
        });
        console.log();
      }
      
      console.log(`🤖 Assistant: ${response}\n`);
      
      // Add a small delay between scenarios
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error in scenario ${i + 1}:`, error);
    }
  }

  console.log("\n🎉 Demo completed! The assistant has demonstrated its ability to:");
  console.log("  • Understand and query the experiment graph");
  console.log("  • Create and update experiment nodes");
  console.log("  • Manage relationships between experiments");
  console.log("  • Handle literature references");
  console.log("  • Provide research guidance and suggestions");
  console.log("\nTo start an interactive session, run: npm run dev");
}

// Run the demo
if (require.main === module) {
  runDemo().catch((error) => {
    console.error("❌ Demo error:", error);
    process.exit(1);
  });
}
