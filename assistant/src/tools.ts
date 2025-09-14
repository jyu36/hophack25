import axios, { AxiosResponse } from "axios";
import { z } from "zod";

const BASE_URL = process.env.GRAPH_API_BASE || "http://127.0.0.1:8000";

// Helper function to make API calls with error handling
async function apiCall<T>(request: () => Promise<AxiosResponse<T>>): Promise<T> {
  try {
    const response = await request();
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`API Error ${error.response.status}: ${error.response.data?.detail || error.message}`);
    } else if (error.request) {
      throw new Error(`Network Error: Unable to connect to backend API at ${BASE_URL}`);
    } else {
      throw new Error(`Request Error: ${error.message}`);
    }
  }
}

// Graph Reading Tools
export const getGraphOverview = {
  name: "get_graph_overview",
  description: "Get complete graph representation with all nodes and edges to understand the research landscape",
  schema: z.object({}),
  run: async () => apiCall(() => axios.get(`${BASE_URL}/graph/overview`))
};

export const getNodeInfo = {
  name: "get_node_info",
  description: "Get detailed information about a specific experiment node including parent and child relationships",
  schema: z.object({
    node_id: z.number().describe("ID of the node to get information for"),
    with_parents: z.boolean().optional().default(true).describe("Include parent experiments"),
    with_children: z.boolean().optional().default(true).describe("Include child experiments")
  }),
  run: async (args: unknown) => {
    const { node_id, with_parents, with_children } = getNodeInfo.schema.parse(args);
    return apiCall(() => axios.get(`${BASE_URL}/nodes/${node_id}`, {
      params: { with_parents, with_children }
    }));
  }
};

// export const getAllNodes = {
//   name: "get_all_nodes",
//   description: "Get all experiment nodes, optionally in concise format for quick overview",
//   schema: z.object({
//     concise: z.boolean().optional().default(false).describe("Return concise format with basic info only")
//   }),
//   run: async (args: unknown) => {
//     const { concise } = getAllNodes.schema.parse(args);
//     return apiCall(() => axios.get(`${BASE_URL}/nodes`, {
//       params: { concise }
//     }));
//   }
// };

export const getNodeLiterature = {
  name: "get_node_literature",
  description: "Get literature references for a specific experiment node, this will not generate new literature, it will only return the literature that has already been added to the graph, use get_suggested_literature to generate new literature",
  schema: z.object({
    node_id: z.number().describe("ID of the node to get literature for")
  }),
  run: async (args: unknown) => {
    const { node_id } = getNodeLiterature.schema.parse(args);
    return apiCall(() => axios.get(`${BASE_URL}/nodes/${node_id}/literature`));
  }
};

export const getSuggestedLiterature = {
  name: "get_suggested_literature",
  description: "Get AI-suggested literature references for a specific experiment node",
  schema: z.object({
    node_id: z.number().describe("ID of the node to get suggested literature for"),
    ignore_cache: z.boolean().optional().default(false).describe("Bypass cache and recompute suggestions"),
    relationship: z.enum(["auto", "similar", "builds_on", "prior", "contrast"]).optional().default("auto").describe("Type of relationship to find")
  }),
  run: async (args: unknown) => {
    const { node_id, ignore_cache, relationship } = getSuggestedLiterature.schema.parse(args);
    return apiCall(() => axios.get(`${BASE_URL}/nodes/${node_id}/literature/suggested`, {
      params: { ignore_cache, relationship }
    }));
  }
};

export const getAllLiterature = {
  name: "get_all_literature",
  description: "Get all literature references across all nodes, this will not generate new literature, it will only return the literature that has already been added to the graph, use get_suggested_literature to generate new literature. You ONLY need to call this endpoint once.",
  schema: z.object({}),
  run: async () => apiCall(() => axios.get(`${BASE_URL}/literature`))
};

export const getContextKeywords = {
  name: "get_context_keywords",
  description: "Get all stored context keywords for understanding persistent research context",
  schema: z.object({}),
  run: async () => apiCall(() => axios.get(`${BASE_URL}/context-keywords`))
};

// Graph Modification Tools - Node Management
export const createNode = {
  name: "create_node",
  description: "Create a new experiment node with metadata",
  schema: z.object({
    title: z.string().describe("Short title/name of the experiment"),
    description: z.string().optional().describe("Detailed description of the experiment"),
    motivation: z.string().optional().describe("Why this experiment is being conducted"),
    expectations: z.string().optional().describe("What we expect to learn/achieve"),
    hypothesis: z.string().optional().describe("The hypothesis being tested"),
    status: z.enum(["planned", "completed", "postponed"]).optional().default("planned"),
    extra_data: z.record(z.any()).optional().describe("Additional properties as JSON object")
  }),
  run: async (args: unknown) => {
    const data = createNode.schema.parse(args);
    return apiCall(() => axios.post(`${BASE_URL}/nodes`, data));
  }
};

export const updateNode = {
  name: "update_node",
  description: "Update an existing experiment node with new information",
  schema: z.object({
    node_id: z.number().describe("ID of the node to update"),
    title: z.string().optional().describe("Updated title"),
    description: z.string().optional().describe("Updated description"),
    motivation: z.string().optional().describe("Updated motivation"),
    expectations: z.string().optional().describe("Updated expectations"),
    hypothesis: z.string().optional().describe("Updated hypothesis"),
    result: z.string().optional().describe("Results of the experiment"),
    status: z.enum(["planned", "completed", "postponed"]).optional().describe("Updated status"),
    extra_data: z.record(z.any()).optional().describe("Additional properties as JSON object")
  }),
  run: async (args: unknown) => {
    const { node_id, ...updateData } = updateNode.schema.parse(args);
    return apiCall(() => axios.patch(`${BASE_URL}/nodes/${node_id}`, updateData));
  }
};

export const deleteNode = {
  name: "delete_node",
  description: "Delete an experiment node, optionally with its entire subgraph",
  schema: z.object({
    node_id: z.number().describe("ID of the node to delete"),
    force_delete: z.boolean().optional().default(false).describe("Delete entire subgraph if true")
  }),
  run: async (args: unknown) => {
    const { node_id, force_delete } = deleteNode.schema.parse(args);
    return apiCall(() => axios.delete(`${BASE_URL}/nodes/${node_id}`, {
      params: { force_delete }
    }));
  }
};

// Relationship Management
export const createEdge = {
  name: "create_edge",
  description: "Create a relationship between two experiment nodes",
  schema: z.object({
    from_experiment_id: z.number().describe("Source experiment ID"),
    to_experiment_id: z.number().describe("Target experiment ID"),
    relationship_type: z.enum(["leads_to", "supports", "refutes", "requires", "related", "inspires", "extends", "validates", "implements"]).describe("Type of relationship"),
    label: z.string().optional().describe("Optional description of the relationship"),
    extra_data: z.record(z.any()).optional().describe("Additional properties as JSON object")
  }),
  run: async (args: unknown) => {
    const data = createEdge.schema.parse(args);
    return apiCall(() => axios.post(`${BASE_URL}/edges`, data));
  }
};

export const updateEdge = {
  name: "update_edge",
  description: "Update an existing relationship between experiments",
  schema: z.object({
    edge_id: z.number().describe("ID of the edge to update"),
    from_experiment_id: z.number().optional().describe("Updated source experiment ID"),
    to_experiment_id: z.number().optional().describe("Updated target experiment ID"),
    relationship_type: z.enum(["leads_to", "supports", "refutes", "requires", "related", "inspires", "extends", "validates", "implements"]).optional().describe("Updated relationship type"),
    label: z.string().optional().describe("Updated label"),
    extra_data: z.record(z.any()).optional().describe("Additional properties as JSON object")
  }),
  run: async (args: unknown) => {
    const { edge_id, ...updateData } = updateEdge.schema.parse(args);
    return apiCall(() => axios.patch(`${BASE_URL}/edges/${edge_id}`, updateData));
  }
};

export const deleteEdgeById = {
  name: "delete_edge_by_id",
  description: "Delete a relationship by its ID",
  schema: z.object({
    edge_id: z.number().describe("ID of the edge to delete")
  }),
  run: async (args: unknown) => {
    const { edge_id } = deleteEdgeById.schema.parse(args);
    return apiCall(() => axios.delete(`${BASE_URL}/edges/${edge_id}`));
  }
};

// export const deleteEdgeByNodes = {
//   name: "delete_edge_by_nodes",
//   description: "Delete a relationship by specifying source and target nodes",
//   schema: z.object({
//     from_id: z.number().describe("Source experiment ID"),
//     to_id: z.number().describe("Target experiment ID"),
//     label: z.string().optional().describe("Optional label to match specific relationship")
//   }),
//   run: async (args: unknown) => {
//     const { from_id, to_id, label } = deleteEdgeByNodes.schema.parse(args);
//     return apiCall(() => axios.delete(`${BASE_URL}/edges/by-nodes`, {
//       params: { from_id, to_id, label }
//     }));
//   }
// };

// Literature Management
// export const addLiterature = {
//   name: "add_literature",
//   description: "Add a literature reference to a specific experiment node",
//   schema: z.object({
//     node_id: z.number().describe("ID of the node to add literature to"),
//     link: z.string().describe("URL or DOI of the literature reference"),
//     relationship: z.enum(["similar", "builds_on", "prior", "contrast"]).optional().default("similar").describe("Type of relationship to the experiment")
//   }),
//   run: async (args: unknown) => {
//     const { node_id, link, relationship } = addLiterature.schema.parse(args);
//     return apiCall(() => axios.post(`${BASE_URL}/nodes/${node_id}/literature`, null, {
//       params: { link, relationship }
//     }));
//   }
// };

// export const deleteLiterature = {
//   name: "delete_literature",
//   description: "Remove a literature reference from a specific experiment node",
//   schema: z.object({
//     node_id: z.number().describe("ID of the node to remove literature from"),
//     link: z.string().describe("URL or DOI of the literature reference to remove")
//   }),
//   run: async (args: unknown) => {
//     const { node_id, link } = deleteLiterature.schema.parse(args);
//     return apiCall(() => axios.delete(`${BASE_URL}/nodes/${node_id}/literature/${encodeURIComponent(link)}`));
//   }
// };

// Context Management
export const addContextKeyword = {
  name: "add_context_keyword",
  description: "Add a new context keyword for persistent research context",
  schema: z.object({
    keyword: z.string().describe("The keyword or phrase to remember")
  }),
  run: async (args: unknown) => {
    const { keyword } = addContextKeyword.schema.parse(args);
    return apiCall(() => axios.post(`${BASE_URL}/context-keywords`, null, {
      params: { keyword }
    }));
  }
};

export const deleteContextKeyword = {
  name: "delete_context_keyword",
  description: "Remove a context keyword",
  schema: z.object({
    keyword: z.string().describe("The keyword to remove")
  }),
  run: async (args: unknown) => {
    const { keyword } = deleteContextKeyword.schema.parse(args);
    return apiCall(() => axios.delete(`${BASE_URL}/context-keywords/${encodeURIComponent(keyword)}`));
  }
};

// Export all tools
export const tools = [
  // Graph Reading Tools
  getGraphOverview,
  getNodeInfo,
  // getAllNodes,
  getNodeLiterature,
  getSuggestedLiterature,
  getAllLiterature,
  getContextKeywords,

  // Node Management
  createNode,
  updateNode,
  deleteNode,
  
  // Relationship Management
  createEdge,
  updateEdge,
  deleteEdgeById,
  
  // Literature Management
  // addLiterature,
  // deleteLiterature,
  
  // Context Management
  addContextKeyword,
  deleteContextKeyword
];

// Generate OpenAI function calling specifications
export const openaiToolSpecs = tools.map(tool => {
  // Convert Zod schema to JSON Schema manually
  const convertZodToJsonSchema = (schema: any): any => {
    if (schema._def.typeName === 'ZodObject') {
      const shape = schema._def.shape();
      const properties: any = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(shape)) {
        const fieldSchema = value as any;
        properties[key] = convertZodToJsonSchema(fieldSchema);
        
        if (fieldSchema._def.typeName !== 'ZodOptional' && fieldSchema._def.typeName !== 'ZodDefault') {
          required.push(key);
        }
      }
      
      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined
      };
    } else if (schema._def.typeName === 'ZodString') {
      return { type: 'string' };
    } else if (schema._def.typeName === 'ZodNumber') {
      return { type: 'number' };
    } else if (schema._def.typeName === 'ZodBoolean') {
      return { type: 'boolean' };
    } else if (schema._def.typeName === 'ZodEnum') {
      return { 
        type: 'string',
        enum: schema._def.values
      };
    } else if (schema._def.typeName === 'ZodOptional') {
      return convertZodToJsonSchema(schema._def.innerType);
    } else if (schema._def.typeName === 'ZodDefault') {
      return convertZodToJsonSchema(schema._def.innerType);
    } else if (schema._def.typeName === 'ZodRecord') {
      return { type: 'object' };
    } else {
      return { type: 'string' }; // fallback
    }
  };

  return {
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: convertZodToJsonSchema(tool.schema)
    }
  };
});
