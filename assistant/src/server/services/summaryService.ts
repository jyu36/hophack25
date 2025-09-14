import axios from 'axios';
import OpenAI from 'openai';
import { createCategoryLogger } from '../../logger';
import { getGraphOverview } from '../../tools';

const logger = createCategoryLogger('SUMMARY');

// Cache interface
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

// Summary types
export interface GraphOverview {
  nodes: Array<{
    id: number;
    title: string;
    status: string;
    type: string;
    description: string;
    created_at: string;
    updated_at: string;
  }>;
  edges: Array<{
    id: number;
    from: number;
    to: number;
    type: string;
    label: string;
  }>;
}

export interface SummaryRequest {
  ignore_cache?: boolean;
}

export interface SummaryResponse {
  summary: string;
  generated_at: string;
  cache_hit: boolean;
  node_count: number;
  edge_count: number;
}

export class SummaryService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly BASE_URL = process.env.GRAPH_API_BASE || 'http://127.0.0.1:8000';
  private openai: OpenAI;

  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Clean up expired cache entries every 10 minutes
    setInterval(() => this.cleanupCache(), 10 * 60 * 1000);
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        logger.debug('Removed expired cache entry', { key });
      }
    }
  }

  private getCacheKey(type: 'overview' | 'weekly', params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${type}:${paramStr}`;
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    logger.debug('Cache hit', { key });
    return entry.data;
  }

  private setCache(key: string, data: any): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_TTL
    });
    logger.debug('Cached data', { key, ttl: this.CACHE_TTL });
  }

  private async fetchGraphOverview(): Promise<GraphOverview> {
    try {
      logger.info('Fetching graph overview from backend');
      const result = await getGraphOverview.run();
      return result as GraphOverview;
    } catch (error) {
      logger.error('Failed to fetch graph overview', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new Error('Failed to fetch graph data from backend');
    }
  }

  private async generateSummaryWithLLM(
    nodes: any[], 
    edges: any[], 
    prompt: string
  ): Promise<string> {
    try {
      // Prepare the data for the LLM
      const graphData = {
        nodes: nodes.map(node => ({
          id: node.id,
          title: node.title,
          status: node.status,
          description: node.description,
          created_at: node.created_at,
          updated_at: node.updated_at
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          from: edge.from,
          to: edge.to,
          type: edge.type,
          label: edge.label
        }))
      };

      // Create a comprehensive prompt for the LLM
      const systemPrompt = `You are a research assistant that generates comprehensive summaries of research projects. 
You will be given graph data containing experiments (nodes) and their relationships (edges). 
Generate a well-structured, informative summary that provides insights into the research progress and connections. 
Be concise and to the point.

Guidelines:
- Use clear, professional language
- Structure the summary with appropriate headings
- Highlight key findings, progress, and relationships
- Include statistics about the research scope
- Make the summary engaging and informative
- Focus on the most important and recent developments`;

      const userPrompt = `${prompt}

Here is the research project data in a graphical format:

**Experiments (${nodes.length} total):**
${JSON.stringify(graphData.nodes, null, 2)}

**Relationships (${edges.length} total):**
${JSON.stringify(graphData.edges, null, 2)}

Please generate a comprehensive summary of this research project.`;

      logger.info('Calling OpenAI API for summary generation', { 
        nodeCount: nodes.length, 
        edgeCount: edges.length,
        model: process.env.ASSISTANT_MODEL || 'gpt-4o',
        summaryType: prompt.includes('weekly') ? 'weekly' : 'overview'
      });

      // Log the complete prompt and data being sent to GPT-4o
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ];

      logger.debug('GPT-4o Summary Generation Request', {
        messages,
        systemPrompt,
        userPrompt,
        graphData: {
          nodes: graphData.nodes,
          edges: graphData.edges
        },
        promptLength: userPrompt.length,
        dataSize: JSON.stringify(graphData).length,
        model: process.env.ASSISTANT_MODEL || 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2000
      });

      const response = await this.openai.chat.completions.create({
        model: process.env.ASSISTANT_MODEL || 'gpt-4o',
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 2000
      });

      const summary = response.choices[0].message.content || 'Unable to generate summary';
      
      // Log the complete response from GPT-4o
      logger.debug('GPT-4o Summary Generation Response', {
        summary,
        finishReason: response.choices[0].finish_reason,
        usage: response.usage,
        responseId: response.id,
        model: response.model
      });
      
      logger.info('Generated summary with OpenAI', { 
        nodeCount: nodes.length, 
        edgeCount: edges.length,
        summaryLength: summary.length,
        tokensUsed: response.usage?.total_tokens || 0,
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0
      });
      
      return summary;
    } catch (error) {
      logger.error('Failed to generate summary with OpenAI', { 
        error: error instanceof Error ? error.message : String(error),
        nodeCount: nodes.length,
        edgeCount: edges.length
      });
      
      // Fallback to template-based summary if LLM fails
      logger.warn('Falling back to template-based summary generation');
      const graphData = {
        nodes: nodes.map(node => ({
          id: node.id,
          title: node.title,
          status: node.status,
          description: node.description,
          created_at: node.created_at,
          updated_at: node.updated_at
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          from: edge.from,
          to: edge.to,
          type: edge.type,
          label: edge.label
        }))
      };
      
      return this.generateTemplateSummary(graphData, prompt);
    }
  }

  private generateTemplateSummary(graphData: any, prompt: string): string {
    const { nodes, edges } = graphData;
    
    // Count nodes by status
    const statusCounts = nodes.reduce((acc: any, node: any) => {
      acc[node.status] = (acc[node.status] || 0) + 1;
      return acc;
    }, {});

    // Count edges by type
    const edgeTypeCounts = edges.reduce((acc: any, edge: any) => {
      acc[edge.type] = (acc[edge.type] || 0) + 1;
      return acc;
    }, {});

    // Generate basic summary
    let summary = `# Research Project Summary\n\n`;
    summary += `## Overview\n`;
    summary += `This research project contains ${nodes.length} experiments with ${edges.length} relationships between them.\n\n`;
    
    summary += `## Experiment Status Breakdown\n`;
    Object.entries(statusCounts).forEach(([status, count]) => {
      summary += `- ${status}: ${count} experiments\n`;
    });
    
    summary += `\n## Relationship Types\n`;
    Object.entries(edgeTypeCounts).forEach(([type, count]) => {
      summary += `- ${type}: ${count} relationships\n`;
    });

    summary += `\n## Recent Experiments\n`;
    const recentNodes = nodes
      .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
    
    recentNodes.forEach((node: any) => {
      summary += `- **${node.title}** (${node.status}): ${node.description || 'No description'}\n`;
    });

    return summary;
  }

  async generateOverviewSummary(request: SummaryRequest = {}): Promise<SummaryResponse> {
    const cacheKey = this.getCacheKey('overview');
    let cacheHit = false;

    // Check cache first (unless ignore_cache is true)
    if (!request.ignore_cache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        cacheHit = true;
        logger.info('Returning cached overview summary');
        return {
          ...cached,
          cache_hit: true
        };
      }
    }

    try {
      logger.info('Generating overview summary', { ignore_cache: request.ignore_cache });
      
      // Fetch graph data
      const graphData = await this.fetchGraphOverview();
      const { nodes, edges } = graphData;

      // Generate summary
      const overviewPrompt = `Generate a comprehensive overview summary of this research project from the beginning. 

Focus on:
- Overall project scope and objectives
- Complete timeline of all experiments
- Key relationships and dependencies between experiments
- Progress status across all experiments
- Major findings and results
- Project structure and organization
- Next steps and future directions

Provide a complete picture of the entire research project. Space is limited, so be concise and to the point.`;
      const summary = await this.generateSummaryWithLLM(nodes, edges, overviewPrompt);

      const response: SummaryResponse = {
        summary,
        generated_at: new Date().toISOString(),
        cache_hit: cacheHit,
        node_count: nodes.length,
        edge_count: edges.length
      };

      // Cache the result
      this.setCache(cacheKey, response);

      logger.info('Overview summary generated successfully', { 
        nodeCount: nodes.length, 
        edgeCount: edges.length 
      });

      return response;
    } catch (error) {
      logger.error('Failed to generate overview summary', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async generateWeeklySummary(request: SummaryRequest = {}): Promise<SummaryResponse> {
    const cacheKey = this.getCacheKey('weekly');
    let cacheHit = false;

    // Check cache first (unless ignore_cache is true)
    if (!request.ignore_cache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        cacheHit = true;
        logger.info('Returning cached weekly summary');
        return {
          ...cached,
          cache_hit: true
        };
      }
    }

    try {
      logger.info('Generating weekly summary', { ignore_cache: request.ignore_cache });
      
      // Fetch graph data
      const graphData = await this.fetchGraphOverview();
      const { nodes, edges } = graphData;

      // Filter nodes updated in the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentNodes = nodes.filter((node: any) => {
        const updatedAt = new Date(node.updated_at);
        return updatedAt >= oneWeekAgo;
      });

      // Get edges that involve recent nodes
      const recentNodeIds = new Set(recentNodes.map((node: any) => node.id));
      const recentEdges = edges.filter((edge: any) => 
        recentNodeIds.has(edge.from) || recentNodeIds.has(edge.to)
      );

      // Generate summary
      const weeklyPrompt = `Generate a weekly summary focusing only on experiments and relationships that were updated in the last week. 
This will be a first-person narrative on the progress of the project this week, which is well-readable to reportable to professors and other stakeholders.
Focus on:
- Recent changes and updates to experiments
- New experiments or relationships created this week, with intention or desired outcomes. (Emphasize the high level picture)
- Progress made on ongoing experiments (status changes, etc.)
- Results or findings from completed experiments
- Changes in experiment status or direction
- New insights or discoveries
- Impact of recent changes on the overall project
- What was accomplished this week
- Any blockers or challenges encountered

This should be a focused report on recent activity and progress.`;
      const summary = await this.generateSummaryWithLLM(recentNodes, recentEdges, weeklyPrompt);

      const response: SummaryResponse = {
        summary,
        generated_at: new Date().toISOString(),
        cache_hit: cacheHit,
        node_count: recentNodes.length,
        edge_count: recentEdges.length
      };

      // Cache the result
      this.setCache(cacheKey, response);

      logger.info('Weekly summary generated successfully', { 
        recentNodeCount: recentNodes.length, 
        recentEdgeCount: recentEdges.length,
        totalNodes: nodes.length,
        totalEdges: edges.length
      });

      return response;
    } catch (error) {
      logger.error('Failed to generate weekly summary', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  // Method to clear cache (useful for testing or manual cache invalidation)
  clearCache(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  // Method to get cache statistics
  getCacheStats(): { size: number; entries: Array<{ key: string; age: number; expiresIn: number }> } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      expiresIn: entry.expiresAt - now
    }));

    return {
      size: this.cache.size,
      entries
    };
  }
}
