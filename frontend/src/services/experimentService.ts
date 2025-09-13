import api from "../utils/api";
import { APIExperiment, apiToUIExperiment } from "../types/api";
import { Experiment, NodeStatus, NodeType } from "../types/research";

// Debug logger
const debug = {
  log: (...args: any[]) => {
    console.log("[ExperimentService]", ...args);
  },
  error: (...args: any[]) => {
    console.error("[ExperimentService]", ...args);
  },
  warn: (...args: any[]) => {
    console.warn("[ExperimentService]", ...args);
  },
};

// Extract status value from backend response
const extractStatusValue = (status: any): string => {
  debug.log("Extracting status from:", status);

  if (!status) {
    debug.warn("Status is empty");
    return "";
  }

  // Handle string format: "<ExperimentStatus.COMPLETED: 'completed'>"
  if (typeof status === "string") {
    const match = status.match(/[A-Z_]+:\s*'([^']+)'/);
    if (match) {
      debug.log("Extracted status from string:", match[1]);
      return match[1];
    }
    debug.log("Using status string as is:", status);
    return status;
  }

  // Handle object format
  if (typeof status === "object") {
    if ("value" in status) {
      debug.log("Extracted status from object.value:", status.value);
      return status.value;
    }
    const str = status.toString();
    const match = str.match(/[A-Z_]+:\s*'([^']+)'/);
    if (match) {
      debug.log("Extracted status from object.toString:", match[1]);
      return match[1];
    }
  }

  debug.warn("Using status as is:", status);
  return String(status);
};

// Map UI status to API status
const mapUIStatusToAPIStatus = (uiStatus: NodeStatus): string => {
  debug.log("Mapping UI status to API:", uiStatus);
  let apiStatus: string;

  switch (uiStatus) {
    case "completed":
      apiStatus = "completed"; // completed -> completed
      break;
    case "planned":
      apiStatus = "planned"; // planned -> planned
      break;
    case "postponed":
      apiStatus = "postponed"; // postponed -> postponed
      break;
    default:
      apiStatus = "planned"; // default to planned
  }

  debug.log("Mapped UI status:", uiStatus, "to API status:", apiStatus);
  return apiStatus;
};

// Map API status to UI status
const mapAPIStatusToUIStatus = (apiStatus: any): NodeStatus => {
  const status = extractStatusValue(apiStatus).toLowerCase();
  debug.log("Mapping API status to UI:", {
    original: apiStatus,
    extracted: status,
  });

  let uiStatus: NodeStatus;
  switch (status) {
    case "completed":
      uiStatus = "completed"; // completed -> completed
      break;
    case "planned":
      uiStatus = "planned"; // planned -> planned
      break;
    case "in_progress":
      uiStatus = "planned"; // in_progress -> planned
      break;
    case "postponed":
      uiStatus = "postponed"; // postponed -> postponed
      break;
    default:
      debug.warn("Unknown status:", status);
      uiStatus = "planned"; // default to planned
  }

  debug.log("Mapped API status:", status, "to UI status:", uiStatus);
  return uiStatus;
};

// Convert API node to ResearchNode
const convertToResearchNode = (node: any): Experiment => {
  debug.log("Converting node:", node);
  const status = mapAPIStatusToUIStatus(node.status);
  debug.log("Mapped status:", status);

  const experiment: Experiment = {
    id: node.id.toString(),
    title: node.title,
    description: node.description || "",
    type: (node.type as NodeType) || "experiment",
    status,
    level: 0,
    keywords: [],
    createdAt: node.created_at,
    aiGenerated: false,
  };

  debug.log("Converted experiment:", experiment);
  return experiment;
};

export const experimentService = {
  // Get all experiments
  async getAllExperiments(): Promise<Experiment[]> {
    try {
      debug.log("Fetching all experiments...");
      const response = await api.get("/graph/overview");
      debug.log("API Response:", response.data);
      const { nodes } = response.data;
      const experiments = nodes.map(convertToResearchNode);
      debug.log("Converted all experiments:", experiments);
      return experiments;
    } catch (error) {
      debug.error("Error fetching all experiments:", error);
      throw error;
    }
  },

  // Get past (completed) experiments
  async getPastExperiments(): Promise<Experiment[]> {
    try {
      debug.log("Fetching past experiments...");
      const { nodes } = await api
        .get("/graph/overview")
        .then((res) => res.data);
      const experiments = nodes
        .filter((node: any) => {
          const status = extractStatusValue(node.status);
          debug.log("Filtering node:", { node, extractedStatus: status });
          const isCompleted = status.toLowerCase() === "completed";
          debug.log("Is completed:", isCompleted);
          return isCompleted;
        })
        .map(convertToResearchNode);
      debug.log("Past experiments:", experiments);
      return experiments;
    } catch (error) {
      debug.error("Error fetching past experiments:", error);
      throw error;
    }
  },

  // Get planned experiments
  async getPlannedExperiments(): Promise<Experiment[]> {
    try {
      debug.log("Fetching planned experiments...");
      const { nodes } = await api
        .get("/graph/overview")
        .then((res) => res.data);
      const experiments = nodes
        .filter((node: any) => {
          const status = extractStatusValue(node.status);
          debug.log("Filtering node:", { node, extractedStatus: status });
          const isPlanned = status.toLowerCase() === "planned";
          debug.log("Is planned:", isPlanned);
          return isPlanned;
        })
        .map(convertToResearchNode);
      debug.log("Planned experiments:", experiments);
      return experiments;
    } catch (error) {
      debug.error("Error fetching planned experiments:", error);
      throw error;
    }
  },

  // Get postponed (rejected) experiments
  async getPostponedExperiments(): Promise<Experiment[]> {
    try {
      debug.log("Fetching postponed experiments...");
      const { nodes } = await api
        .get("/graph/overview")
        .then((res) => res.data);
      const experiments = nodes
        .filter((node: any) => {
          const status = extractStatusValue(node.status);
          debug.log("Filtering node:", { node, extractedStatus: status });
          const isPostponed = status.toLowerCase() === "postponed";
          debug.log("Is postponed:", isPostponed);
          return isPostponed;
        })
        .map(convertToResearchNode);
      debug.log("Postponed experiments:", experiments);
      return experiments;
    } catch (error) {
      debug.error("Error fetching postponed experiments:", error);
      throw error;
    }
  },

  // Update experiment status
  async updateExperimentStatus(
    experimentId: string,
    status: NodeStatus
  ): Promise<Experiment> {
    try {
      debug.log("Updating experiment status:", { experimentId, status });
      const response = await api.patch(`/nodes/${experimentId}`, {
        status: mapUIStatusToAPIStatus(status),
      });
      debug.log("Update response:", response.data);
      const experiment = convertToResearchNode(response.data);
      debug.log("Updated experiment:", experiment);
      return experiment;
    } catch (error) {
      debug.error("Error updating experiment status:", error);
      throw error;
    }
  },
};

export default experimentService;
