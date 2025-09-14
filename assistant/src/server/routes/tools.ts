import express from 'express';
import { tools } from '../../tools';
import { createCategoryLogger } from '../../logger';

const router = express.Router();
const logger = createCategoryLogger('TOOLS');

// Get list of available tools
router.get('/', (req, res) => {
  try {
    const toolList = tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      schema: tool.schema
    }));

    logger.info('Tools list requested', { toolCount: toolList.length });

    res.json({
      tools: toolList,
      count: toolList.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting tools list', {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to get tools list',
      statusCode: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific tool details
router.get('/:toolName', (req, res) => {
  try {
    const { toolName } = req.params;
    const tool = tools.find(t => t.name === toolName);

    if (!tool) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Tool '${toolName}' not found`,
        statusCode: 404,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Tool details requested', { toolName });

    res.json({
      name: tool.name,
      description: tool.description,
      schema: tool.schema,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting tool details', {
      error: error instanceof Error ? error.message : String(error),
      toolName: req.params.toolName
    });
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to get tool details',
      statusCode: 500,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
