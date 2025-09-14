const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface FileUploadResponse {
  success: boolean;
  file_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  keywords: string[];
  text_preview: string;
  message: string;
}

export interface FileUploadError {
  error: string;
  detail?: string;
}

export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to upload file. Please try again.'
    );
  }
};

export const getFileInfo = async (fileId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get file info error:', error);
    throw new Error('Failed to get file information');
  }
};

export const deleteFile = async (fileId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Delete file error:', error);
    throw new Error('Failed to delete file');
  }
};
