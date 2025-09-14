import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { FileUploadService } from '../services/fileUploadService';
import { createCategoryLogger } from '../../logger';

const router = Router();
const logger = createCategoryLogger('FILES');
const fileUploadService = new FileUploadService();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 512 * 1024 * 1024, // 512MB limit (OpenAI's limit)
  }
});

// POST /api/files/upload - Upload file to OpenAI
router.post('/upload', upload.single('file') as any, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'No file provided',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    const file = req.file;
    const purpose = (req.body.purpose as 'assistants' | 'fine-tune' | 'batch') || 'assistants';

    logger.info('File upload request', {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      purpose,
      fileKeys: Object.keys(file)
    });

    // Validate file
    const validation = fileUploadService.validateFile(file);
    if (!validation.valid) {
      logger.warn('File validation failed', {
        filename: file.originalname,
        mimetype: file.mimetype,
        error: validation.error
      });
      return res.status(400).json({
        error: 'BadRequest',
        message: validation.error,
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    // Upload file to OpenAI
    const result = await fileUploadService.uploadFile(file, purpose);

    logger.info('File uploaded successfully', {
      fileId: result.fileId,
      filename: result.filename,
      size: result.size
    });

    res.json(result);
  } catch (error) {
    logger.error('Error uploading file', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    next(error);
  }
});

// GET /api/files/:fileId - Get file information
router.get('/:fileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.fileId;

    if (!fileId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'File ID is required',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Getting file info', { fileId });

    const fileInfo = await fileUploadService.getFileInfo(fileId);
    res.json(fileInfo);
  } catch (error) {
    logger.error('Error getting file info', { 
      fileId: req.params.fileId,
      error: error instanceof Error ? error.message : String(error) 
    });
    next(error);
  }
});

// GET /api/files - List all files
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Listing files');

    const files = await fileUploadService.listFiles();
    res.json({ files });
  } catch (error) {
    logger.error('Error listing files', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    next(error);
  }
});

// DELETE /api/files/:fileId - Delete file
router.delete('/:fileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.fileId;

    if (!fileId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'File ID is required',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Deleting file', { fileId });

    const success = await fileUploadService.deleteFile(fileId);
    
    if (success) {
      res.json({
        message: 'File deleted successfully',
        fileId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to delete file',
        statusCode: 500,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Error deleting file', { 
      fileId: req.params.fileId,
      error: error instanceof Error ? error.message : String(error) 
    });
    next(error);
  }
});

export default router;
