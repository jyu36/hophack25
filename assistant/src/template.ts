/**
 * Template System for Dynamic Context Generation
 * 
 * This module provides template rendering capabilities for generating
 * dynamic context with up-to-date graph information.
 */

import nunjucks from 'nunjucks';
import { tools } from './tools';

export interface GraphContext {
  overview: any;
  keywords: any[];
  nodeCount: number;
  lastUpdated: string;
}

export interface ContextTemplateData {
  graphContext: GraphContext;
  systemPrompt: string;
  timestamp: string;
}

export class TemplateEngine {
  private nunjucks: nunjucks.Environment;

  constructor() {
    this.nunjucks = nunjucks.configure({
      autoescape: false,
      throwOnUndefined: false
    });
  }

  /**
   * Fetches current graph context including overview and keywords
   */
  async fetchGraphContext(): Promise<GraphContext> {
    try {
      // Get graph overview
      const overviewTool = tools.find(t => t.name === 'get_graph_overview');
      const overview = overviewTool ? await overviewTool.run({}) : null;

      // Get context keywords
      const keywordsTool = tools.find(t => t.name === 'get_context_keywords');
      const keywords = keywordsTool ? await keywordsTool.run({}) : [];

      // Get node count from overview
      const nodeCount = overview?.nodes?.length || 0;

      return {
        overview,
        keywords: keywords || [],
        nodeCount,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching graph context:', error);
      return {
        overview: null,
        keywords: [],
        nodeCount: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Renders the context template with current graph data
   */
  async renderContextTemplate(template: string, additionalData: any = {}): Promise<string> {
    const graphContext = await this.fetchGraphContext();
    
    const templateData: ContextTemplateData = {
      graphContext,
      systemPrompt: additionalData.systemPrompt || '',
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    try {
      return this.nunjucks.renderString(template, templateData);
    } catch (error) {
      console.error('Error rendering template:', error);
      return template; // Return original template if rendering fails
    }
  }

  /**
   * Renders a simple template without graph context
   */
  renderSimpleTemplate(template: string, data: any = {}): string {
    try {
      return this.nunjucks.renderString(template, data);
    } catch (error) {
      console.error('Error rendering simple template:', error);
      return template;
    }
  }
}

// Export singleton instance
export const templateEngine = new TemplateEngine();
