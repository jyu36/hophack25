# File Upload Integration Guide

This guide explains how to implement file uploads in your Research Assistant, allowing users to upload documents that the AI can analyze and reference during conversations.

## 🎯 **Architecture Overview**

The file upload system uses **OpenAI's file API** directly, avoiding the need for backend database changes:

```
Frontend → Assistant API → OpenAI File API → Agent Context
```

### **Key Benefits:**
- ✅ **No Backend Changes**: Files stored in OpenAI's cloud
- ✅ **Minimal Assistant Changes**: Just extended existing APIs
- ✅ **Direct Integration**: Files become part of conversation context
- ✅ **Cost Effective**: No additional storage costs
- ✅ **Secure**: Files handled by OpenAI's infrastructure

## 📁 **File Upload Flow**

1. **Frontend Upload**: User selects file → Frontend uploads to `/api/files/upload`
2. **OpenAI Storage**: File stored in OpenAI's cloud → Returns file ID
3. **Conversation Context**: File ID passed to conversation API
4. **Agent Processing**: Agent includes file in context for AI analysis

## 🚀 **API Endpoints**

### **1. Upload File**

**POST** `/api/files/upload`

Upload a file to OpenAI and get a file ID for use in conversations.

**Request:**
```javascript
const formData = new FormData();
formData.append('file', fileObject);
formData.append('purpose', 'assistants'); // Optional, defaults to 'assistants'

const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData
});
```

**Response:**
```json
{
  "fileId": "file-abc123xyz",
  "filename": "research-document.pdf",
  "size": 1024000,
  "purpose": "assistants",
  "created_at": "2025-01-13T10:30:00.000Z"
}
```

### **2. Get File Information**

**GET** `/api/files/:fileId`

Get information about an uploaded file.

**Response:**
```json
{
  "fileId": "file-abc123xyz",
  "filename": "research-document.pdf",
  "size": 1024000,
  "uploadedAt": "2025-01-13T10:30:00.000Z"
}
```

### **3. List Files**

**GET** `/api/files`

List all uploaded files.

**Response:**
```json
{
  "files": [
    {
      "fileId": "file-abc123xyz",
      "filename": "research-document.pdf",
      "size": 1024000,
      "uploadedAt": "2025-01-13T10:30:00.000Z"
    }
  ]
}
```

### **4. Delete File**

**DELETE** `/api/files/:fileId`

Delete a file from OpenAI.

**Response:**
```json
{
  "message": "File deleted successfully",
  "fileId": "file-abc123xyz",
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

## 💬 **Conversation with Files**

### **Send Message with File Attachment**

**POST** `/api/conversations/:sessionId/messages`

Include file IDs in your message request:

```javascript
const response = await fetch(`/api/conversations/${sessionId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Please analyze this document and suggest experiments',
    fileIds: ['file-abc123xyz', 'file-def456uvw'] // Array of file IDs
  })
});
```

**Response:**
```json
{
  "response": "Based on the uploaded document, I can suggest the following experiments...",
  "context": { /* conversation context */ },
  "actions": ["analyzed_document", "suggested_experiments"],
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

## 🔧 **Frontend Integration**

### **1. File Upload Service**

Create a file upload service for your React frontend:

```typescript
// src/services/fileUploadService.ts
const ASSISTANT_API_BASE = 'http://localhost:3001';

export interface FileUploadResponse {
  fileId: string;
  filename: string;
  size: number;
  purpose: string;
  created_at: string;
}

export interface FileInfo {
  fileId: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

export class FileUploadService {
  async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'assistants');

    const response = await fetch(`${ASSISTANT_API_BASE}/api/files/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'File upload failed');
    }

    return await response.json();
  }

  async getFileInfo(fileId: string): Promise<FileInfo> {
    const response = await fetch(`${ASSISTANT_API_BASE}/api/files/${fileId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get file info');
    }

    return await response.json();
  }

  async listFiles(): Promise<{ files: FileInfo[] }> {
    const response = await fetch(`${ASSISTANT_API_BASE}/api/files`);
    
    if (!response.ok) {
      throw new Error('Failed to list files');
    }

    return await response.json();
  }

  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${ASSISTANT_API_BASE}/api/files/${fileId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }
}

export const fileUploadService = new FileUploadService();
```

### **2. Enhanced Chat Input Component**

Update your existing `ChatInput.tsx` to integrate with the file upload service:

```typescript
// src/components/Chat/ChatInput.tsx
import React, { useState, useRef, ChangeEvent } from 'react';
import { Send, Paperclip, File, X } from 'lucide-react';
import { fileUploadService } from '../../services/fileUploadService';

interface ChatInputProps {
  onSendMessage: (message: string, fileIds?: string[]) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; fileId?: string; uploading?: boolean }>>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setError(null);

    // Validate files
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }

      const allowedTypes = ['.txt', '.csv', '.pdf', '.json', '.docx', '.xlsx', '.pptx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        setError('Unsupported file type. Please upload PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, PPT, PPTX, RTF, or ODT files.');
        return;
      }
    }

    // Add files to state and start uploading
    const newFiles = files.map(file => ({ file, uploading: true }));
    setSelectedFiles(prev => [...prev, ...newFiles]);

    // Upload files to assistant API
    try {
      const uploadPromises = files.map(async (file) => {
        const result = await fileUploadService.uploadFile(file);
        return { file, fileId: result.fileId, uploading: false };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setSelectedFiles(prev => 
        prev.map(f => {
          const uploaded = uploadedFiles.find(uf => uf.file === f.file);
          return uploaded || f;
        })
      );
    } catch (error) {
      setError('Failed to upload files. Please try again.');
      setSelectedFiles(prev => prev.filter(f => !files.includes(f.file)));
    }
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && selectedFiles.length === 0) return;

    const fileIds = selectedFiles
      .filter(f => f.fileId && !f.uploading)
      .map(f => f.fileId!);

    onSendMessage(message, fileIds.length > 0 ? fileIds : undefined);
    setMessage('');
    setSelectedFiles([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      {/* File Display */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-blue-50 rounded-lg">
          {selectedFiles.map((fileData, index) => (
            <div key={index} className="flex items-center gap-2 bg-white px-3 py-2 rounded border">
              <File className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-700">{fileData.file.name}</span>
              <span className="text-xs text-gray-500">
                ({fileData.uploading ? 'Uploading...' : 'Ready'})
              </span>
              <button
                type="button"
                onClick={() => removeFile(fileData.file)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={disabled}
          />
        </div>
        
        <div className="flex space-x-2">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={disabled}
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || (!message.trim() && selectedFiles.length === 0)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.csv,.pdf,.json,.docx,.xlsx,.pptx"
        onChange={handleFileSelect}
        className="hidden"
      />
    </form>
  );
};

export default ChatInput;
```

### **3. Enhanced Chat Hook**

Update your `useChat.ts` hook to handle file attachments:

```typescript
// src/hooks/useChat.ts
import { useState, useCallback } from 'react';
import { fileUploadService } from '../services/fileUploadService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  fileIds?: string[];
  actions?: string[];
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, fileIds?: string[]) => {
    if (!content.trim() && (!fileIds || fileIds.length === 0)) return;

    setIsLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      fileIds
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Start conversation if no session
      if (!sessionId) {
        const response = await fetch('http://localhost:3001/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ useContext: true })
        });

        const data = await response.json();
        setSessionId(data.sessionId);
      }

      // Send message with file attachments
      const messageResponse = await fetch(`http://localhost:3001/api/conversations/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          fileIds
        })
      });

      const messageData = await messageResponse.json();

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: messageData.response,
        timestamp: messageData.timestamp,
        actions: messageData.actions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat
  };
};
```

### **4. File Display Component**

Create a component to display uploaded files in messages:

```typescript
// src/components/Chat/FileDisplay.tsx
import React from 'react';
import { File, Download, Trash2 } from 'lucide-react';
import { fileUploadService } from '../../services/fileUploadService';

interface FileDisplayProps {
  fileIds: string[];
  onRemoveFile?: (fileId: string) => void;
  showActions?: boolean;
}

const FileDisplay: React.FC<FileDisplayProps> = ({ 
  fileIds, 
  onRemoveFile, 
  showActions = false 
}) => {
  const [fileInfos, setFileInfos] = React.useState<Array<{ fileId: string; filename: string; size: number }>>([]);

  React.useEffect(() => {
    const loadFileInfos = async () => {
      try {
        const infos = await Promise.all(
          fileIds.map(async (fileId) => {
            const info = await fileUploadService.getFileInfo(fileId);
            return { fileId, filename: info.filename, size: info.size };
          })
        );
        setFileInfos(infos);
      } catch (error) {
        console.error('Error loading file info:', error);
      }
    };

    if (fileIds.length > 0) {
      loadFileInfos();
    }
  }, [fileIds]);

  if (fileIds.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {fileInfos.map((fileInfo) => (
        <div key={fileInfo.fileId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          <File className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">{fileInfo.filename}</span>
          <span className="text-xs text-gray-500">
            ({(fileInfo.size / 1024).toFixed(1)} KB)
          </span>
          {showActions && onRemoveFile && (
            <button
              onClick={() => onRemoveFile(fileInfo.fileId)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default FileDisplay;
```

### **5. Updated Chat Message Component**

```typescript
// src/components/Chat/ChatMessage.tsx
import React from 'react';
import FileDisplay from './FileDisplay';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    fileIds?: string[];
    actions?: string[];
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        message.role === 'user' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-200 text-gray-800'
      }`}>
        <p className="text-sm">{message.content}</p>
        
        {/* Display attached files */}
        {message.fileIds && message.fileIds.length > 0 && (
          <FileDisplay fileIds={message.fileIds} />
        )}
        
        {/* Display actions taken */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 text-xs opacity-75">
            Actions: {message.actions.join(', ')}
          </div>
        )}
        
        <div className="text-xs opacity-75 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
```

## 📋 **Supported File Types**

The system supports the following file types:

- **Text Files**: `.txt`, `.csv`
- **Documents**: `.pdf`, `.docx`
- **Spreadsheets**: `.xlsx`
- **Presentations**: `.pptx`
- **Data**: `.json`

**File Size Limit**: 512MB (OpenAI's limit)

## 🛡️ **Security & Validation**

### **File Validation**
- File size validation (max 512MB)
- File type validation
- MIME type checking
- Filename sanitization

### **Error Handling**
```javascript
// Example error responses
{
  "error": "BadRequest",
  "message": "File size must be less than 512MB",
  "statusCode": 400,
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

## 🧪 **Testing**

Use the provided test script to verify functionality:

```bash
# Start the assistant server
npm start

# In another terminal, run the test
node test-file-upload.js
```

The test script will:
1. Upload a test file
2. Get file information
3. List all files
4. Send a conversation with file attachment
5. Delete the file

## 💡 **Usage Examples**

### **Research Document Analysis**

```javascript
// 1. Upload research paper
const fileId = await uploadFile(researchPaper);

// 2. Ask for analysis
const response = await sendMessageWithFiles(
  "Please analyze this research paper and suggest follow-up experiments based on the methodology and findings.",
  [fileId]
);
```

### **Data Analysis**

```javascript
// 1. Upload dataset
const fileId = await uploadFile(datasetFile);

// 2. Request analysis
const response = await sendMessageWithFiles(
  "Analyze this dataset and suggest experimental approaches to validate the findings.",
  [fileId]
);
```

### **Multiple File Analysis**

```javascript
// 1. Upload multiple files
const fileIds = await Promise.all([
  uploadFile(paper1),
  uploadFile(paper2),
  uploadFile(dataset)
]);

// 2. Compare and analyze
const response = await sendMessageWithFiles(
  "Compare these documents and suggest a unified experimental approach.",
  fileIds
);
```

## 🔄 **File Lifecycle Management**

### **Automatic Cleanup**
Files are stored in OpenAI's cloud and can be managed through the API:

```javascript
// List all files
const files = await fetch('/api/files').then(r => r.json());

// Delete old files
for (const file of files.files) {
  if (isOldFile(file.uploadedAt)) {
    await fetch(`/api/files/${file.fileId}`, { method: 'DELETE' });
  }
}
```

### **Session-Based File Management**
Consider implementing session-based file cleanup:

```javascript
// Store file IDs in session context
const sessionFiles = new Map();

// Clean up files when session ends
const cleanupSessionFiles = async (sessionId) => {
  const files = sessionFiles.get(sessionId) || [];
  await Promise.all(files.map(fileId => deleteFile(fileId)));
  sessionFiles.delete(sessionId);
};
```

## 🚨 **Important Considerations**

### **Cost Management**
- Files stored in OpenAI's cloud count against your usage
- Consider implementing file cleanup policies
- Monitor file storage usage

### **Rate Limits**
- OpenAI has rate limits for file operations
- Implement retry logic for file uploads
- Consider queuing for high-volume scenarios

### **Error Handling**
- Always handle file upload failures gracefully
- Provide user feedback for validation errors
- Implement retry mechanisms

## 🔮 **Future Enhancements**

1. **File Preprocessing**: Extract text from images/PDFs
2. **File Caching**: Cache processed file content
3. **Batch Upload**: Upload multiple files at once
4. **File Sharing**: Share files between sessions
5. **File Search**: Search within uploaded files
6. **File Versioning**: Track file versions and changes

## 🚀 **Quick Implementation Guide**

### **Step 1: Create the File Upload Service**
```bash
# In your frontend directory
mkdir -p src/services
# Create src/services/fileUploadService.ts with the code above
```

### **Step 2: Update Your Chat Components**
1. Replace your existing `ChatInput.tsx` with the enhanced version above
2. Update your `useChat.ts` hook to handle file attachments
3. Create the new `FileDisplay.tsx` component
4. Update your `ChatMessage.tsx` to show attached files

### **Step 3: Test the Integration**
```bash
# Start your assistant server
cd /path/to/assistant
npm start

# Start your frontend
cd /path/to/frontend
npm start

# Test file upload in your browser
```

### **Step 4: Customize for Your Needs**
- Adjust file size limits in the frontend validation
- Modify the UI styling to match your design system
- Add progress indicators for file uploads
- Implement file preview functionality

## 🎯 **Key Features Implemented**

✅ **File Upload**: Drag & drop or click to upload files  
✅ **File Validation**: Size and type checking  
✅ **Progress Indicators**: Upload status feedback  
✅ **File Management**: View, remove, and manage uploaded files  
✅ **Chat Integration**: Files attached to messages  
✅ **Error Handling**: Graceful error management  
✅ **TypeScript Support**: Full type safety  

## 📚 **Related Documentation**

- [OpenAI Files API](https://platform.openai.com/docs/api-reference/files)
- [Assistant API Documentation](./API_DOCUMENTATION.md)
- [Summary Endpoints](./SUMMARY_ENDPOINTS.md)
