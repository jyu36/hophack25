import { AIResponse, ExperimentSuggestion } from '../types/research';

const mockResponses: Record<string, AIResponse> = {
  "machine learning": {
    message: "Based on your interest in machine learning, here are some suggested experiments:",
    suggestions: [
      {
        title: "Data Preprocessing Pipeline",
        description: "Research different data preprocessing methods and their impact on model performance",
        type: "experiment",
        motivation: "Data quality directly affects model performance",
        expectations: "Find optimal preprocessing workflow",
        reasoning: "Good data preprocessing is fundamental to ML success",
        keywords: ["preprocessing", "feature engineering", "data cleaning"]
      },
      {
        title: "Model Architecture Study",
        description: "Compare different neural network architectures on specific tasks",
        type: "experiment",
        motivation: "Understand architecture trade-offs",
        expectations: "Identify best architecture for the task",
        reasoning: "Architecture choice significantly impacts performance",
        keywords: ["neural networks", "deep learning", "architecture"]
      }
    ]
  },
  "deep learning": {
    message: "Deep learning is a vast field. Here are some research directions:",
    suggestions: [
      {
        title: "Attention Mechanism Analysis",
        description: "Study different attention mechanisms in neural networks",
        type: "experiment",
        motivation: "Improve model's focus on important features",
        expectations: "Better model performance and interpretability",
        reasoning: "Attention mechanisms are key to modern deep learning",
        keywords: ["attention", "transformers", "neural networks"]
      }
    ]
  }
};

const defaultResponse: AIResponse = {
  message: "Here are some general research suggestions:",
  suggestions: [
    {
      title: "Literature Review",
      description: "Comprehensive review of existing research in the field",
      type: "analysis",
      motivation: "Build research foundation",
      expectations: "Field overview and gap identification",
      reasoning: "Literature review is crucial for any research project",
      keywords: ["literature review", "research foundation"]
    }
  ]
};

export function generateAIResponse(input: string): AIResponse {
  const keywords = input.toLowerCase();

  for (const [key, response] of Object.entries(mockResponses)) {
    if (keywords.includes(key)) {
      return response;
    }
  }

  return {
    ...defaultResponse,
    message: `Regarding "${input}", here are some general research suggestions:`
  };
}

export function generateRelatedSuggestions(experimentId: string): ExperimentSuggestion[] {
  return [
    {
      title: "Follow-up Study",
      description: "In-depth investigation based on current findings",
      type: "experiment",
      motivation: "Validate and extend current findings",
      expectations: "Deeper insights and validation",
      reasoning: "Natural extension of the current experiment",
      keywords: ["follow-up", "validation"]
    }
  ];
}