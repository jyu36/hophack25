import { ResearchNode } from './research';

// Backend API Types - These match exactly with the backend schema

export enum ExperimentStatus {
  PLANNED = "planned",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export enum RelationshipType {
  LEADS_TO = "leads_to",
  SUPPORTS = "supports",
  REFUTES = "refutes",
  REQUIRES = "requires",
  RELATED_TO = "related",
  INSPIRES = "inspires",
  EXTENDS = "extends",
  VALIDATES = "validates",
  IMPLEMENTS = "implements",
}

export interface APIExperiment {
  id: number;
  title: string;
  description?: string;
  motivation?: string;
  expectations?: string;
  status: ExperimentStatus;
  hypothesis?: string;
  result?: string;
  extra_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface APIExperimentRelationship {
  id: number;
  from_experiment_id: number;
  to_experiment_id: number;
  relationship_type: RelationshipType;
  label?: string;
  extra_data?: Record<string, any>;
  created_at: string;
}

export interface APIGraphNode {
  id: number;
  title: string;
  status: ExperimentStatus;
  type: string;
  description?: string;
}

export interface APIGraphEdge {
  id: number;
  from: number;
  to: number;
  type: string;
  label?: string;
}

export interface APIGraphOverview {
  nodes: APIGraphNode[];
  edges: APIGraphEdge[];
}

export interface APINodeInfo {
  node: APIExperiment;
  incoming_relationships: APIExperimentRelationship[];
  outgoing_relationships: APIExperimentRelationship[];
}

// Utility functions to convert between API and UI types
export function apiToUIExperiment(apiExp: APIExperiment): ResearchNode {
  return {
    id: apiExp.id.toString(),
    title: apiExp.title,
    description: apiExp.description || "",
    type: "experiment",
    status: "pending", // Map status appropriately
    level: 0,
    motivation: apiExp.motivation,
    expectations: apiExp.expectations,
    keywords: apiExp.extra_data?.keywords || [],
    createdAt: apiExp.created_at,
    aiGenerated: false,
    // Map other fields as needed
  };
}

export function uiToAPIExperiment(
  uiExp: ResearchNode
): Omit<APIExperiment, "id" | "created_at" | "updated_at"> {
  return {
    title: uiExp.title,
    description: uiExp.description,
    motivation: uiExp.motivation,
    expectations: uiExp.expectations,
    status: ExperimentStatus.PLANNED, // Default or map from UI status
    extra_data: {
      keywords: uiExp.keywords,
      level: uiExp.level,
      aiGenerated: uiExp.aiGenerated,
      // Store other UI-specific fields
    },
  };
}