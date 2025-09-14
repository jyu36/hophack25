import OpenAI from 'openai';
import { createCategoryLogger } from '../../logger';
import { FileUploadResponse, FileInfo } from '../../types/api';

const logger = createCategoryLogger('FILE_UPLOAD');

export class FileUploadService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async uploadFile(file: any, purpose: 'assistants' | 'fine-tune' | 'batch' = 'assistants'): Promise<FileUploadResponse> {
    try {
      logger.info('Uploading file to OpenAI', {
        filename: file.originalname || file.name,
        size: file.size,
        type: file.mimetype || file.type,
        purpose
      });

      // Convert multer file to proper File object for OpenAI
      const fileForOpenAI = new File([file.buffer], file.originalname || file.name, {
        type: file.mimetype || file.type
      });

      // Upload file to OpenAI
      const response = await this.openai.files.create({
        file: fileForOpenAI,
        purpose: purpose
      });

      const fileResponse: FileUploadResponse = {
        fileId: response.id,
        filename: file.originalname || file.name,
        size: file.size,
        purpose: response.purpose,
        created_at: new Date(response.created_at * 1000).toISOString()
      };

      logger.info('File uploaded successfully to OpenAI', {
        fileId: response.id,
        filename: file.originalname || file.name,
        size: file.size
      });

      return fileResponse;
    } catch (error) {
      logger.error('Failed to upload file to OpenAI', {
        filename: file.originalname || file.name,
        size: file.size,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFileInfo(fileId: string): Promise<FileInfo> {
    try {
      logger.debug('Getting file info from OpenAI', { fileId });

      const response = await this.openai.files.retrieve(fileId);

      const fileInfo: FileInfo = {
        fileId: response.id,
        filename: response.filename,
        size: response.bytes,
        uploadedAt: new Date(response.created_at * 1000).toISOString()
      };

      logger.debug('Retrieved file info from OpenAI', fileInfo);

      return fileInfo;
    } catch (error) {
      logger.error('Failed to get file info from OpenAI', {
        fileId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      logger.info('Deleting file from OpenAI', { fileId });

      await this.openai.files.del(fileId);

      logger.info('File deleted successfully from OpenAI', { fileId });

      return true;
    } catch (error) {
      logger.error('Failed to delete file from OpenAI', {
        fileId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listFiles(): Promise<FileInfo[]> {
    try {
      logger.debug('Listing files from OpenAI');

      const response = await this.openai.files.list();

      const files: FileInfo[] = response.data.map(file => ({
        fileId: file.id,
        filename: file.filename,
        size: file.bytes,
        uploadedAt: new Date(file.created_at * 1000).toISOString()
      }));

      logger.debug('Retrieved file list from OpenAI', { count: files.length });

      return files;
    } catch (error) {
      logger.error('Failed to list files from OpenAI', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Helper method to validate file before upload
  validateFile(file: any): { valid: boolean; error?: string } {
    try {
      // Check if file object exists
      if (!file) {
        return {
          valid: false,
          error: 'No file provided'
        };
      }

      // Check file size (max 512MB for OpenAI)
      const maxSize = 512 * 1024 * 1024; // 512MB
      if (file.size && file.size > maxSize) {
        return {
          valid: false,
          error: `File size must be less than ${maxSize / 1024 / 1024}MB`
        };
      }

      // Check file type (basic validation)
      const allowedTypes = [
        'text/plain',
        'text/csv',
        'application/pdf',
        'application/json',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      // Check MIME type first
      if (file.mimetype && allowedTypes.includes(file.mimetype)) {
        return { valid: true };
      }

      // Check file extension as fallback
      const fileName = file.originalname || file.name || '';
      if (fileName && typeof fileName === 'string' && fileName.match(/\.(txt|csv|pdf|json|docx|xlsx|pptx)$/i)) {
        return { valid: true };
      }

      return {
        valid: false,
        error: 'Unsupported file type. Supported types: txt, csv, pdf, json, docx, xlsx, pptx'
      };
    } catch (error) {
      logger.error('Error validating file', {
        error: error instanceof Error ? error.message : String(error),
        file: file ? Object.keys(file) : 'undefined'
      });
      return {
        valid: false,
        error: 'File validation error'
      };
    }
  }
}
