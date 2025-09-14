import { Experiment } from "../types/research";

export const mockExperiments: Experiment[] = [
  {
    id: 1,
    title: "Data Preprocessing Optimization",
    description:
      "Study the impact of different data preprocessing methods on model performance",
    type: "experiment",
    status: "completed",
    level: 0,
    motivation: "Data quality directly affects model performance",
    expectations: "Find the most suitable preprocessing pipeline",
    reasoning: "Good data preprocessing is fundamental to ML success",
    keywords: ["preprocessing", "feature engineering", "data cleaning"],
    created_at: "2025-09-13T10:00:00.000Z",
    updated_at: "2025-09-13T10:00:00.000Z",
    aiGenerated: true,
  },
  {
    id: 2,
    title: "Model Architecture Comparison",
    description:
      "Compare different neural network architectures on specific tasks",
    type: "experiment",
    status: "completed",
    level: 1,
    motivation: "Understand pros and cons of different architectures",
    expectations: "Identify the most suitable model architecture",
    reasoning: "Architecture choice impacts performance and efficiency",
    keywords: ["neural networks", "architecture", "performance"],
    created_at: "2025-09-13T10:30:00.000Z",
    updated_at: "2025-09-13T10:30:00.000Z",
    aiGenerated: true,
  },
  {
    id: 3,
    title: "Feature Selection Study",
    description: "Evaluate different feature selection methods",
    type: "experiment",
    status: "planned",
    level: 1,
    motivation: "Reduce feature dimensionality, improve efficiency",
    expectations: "Find the most important feature subset",
    reasoning: "Feature selection can improve performance and reduce costs",
    keywords: ["feature selection", "dimensionality reduction", "optimization"],
    created_at: "2025-09-13T11:00:00.000Z",
    updated_at: "2025-09-13T11:00:00.000Z",
    aiGenerated: true,
  },
  {
    id: 4,
    title: "Hyperparameter Optimization",
    description: "Use Bayesian optimization for hyperparameter tuning",
    type: "experiment",
    status: "completed",
    level: 2,
    motivation: "Automate hyperparameter tuning process",
    expectations: "Find optimal hyperparameter combinations",
    reasoning: "Hyperparameters significantly impact model performance",
    keywords: ["hyperparameters", "bayesian optimization", "tuning"],
    created_at: "2025-09-13T11:30:00.000Z",
    updated_at: "2025-09-13T11:30:00.000Z",
    aiGenerated: true,
  },
  {
    id: 5,
    title: "Model Ensemble Methods",
    description: "Research different model ensemble strategies",
    type: "experiment",
    status: "planned",
    level: 2,
    motivation: "Improve model generalization",
    expectations: "Develop robust ensemble learning methods",
    reasoning: "Ensembles typically outperform single models",
    keywords: ["ensemble learning", "model fusion", "voting strategies"],
    created_at: "2025-09-13T12:00:00.000Z",
    updated_at: "2025-09-13T12:00:00.000Z",
    aiGenerated: true,
  },
];

// Define relationships between experiments
export const mockRelationships = [
  {
    source: 1, // Data Preprocessing
    target: 2, // Model Architecture
    type: "leads_to",
  },
  {
    source: 2, // Model Architecture
    target: 4, // Hyperparameter Optimization
    type: "leads_to",
  },
  {
    source: 1, // Data Preprocessing
    target: 3, // Feature Selection
    type: "supports",
  },
  {
    source: 4, // Hyperparameter Optimization
    target: 5, // Model Ensemble
    type: "leads_to",
  },
];
