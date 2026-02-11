/**
 * File upload utilities
 * @format
 */

import { uploadFile } from '@app/module/common';

export interface FileData {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

/**
 * Upload a file using the saga
 * @param file - File data object
 * @param dispatch - Redux dispatch function
 * @param onSuccess - Success callback
 * @param onError - Error callback
 */
export const uploadFileToServer = (
  file: FileData,
  dispatch: any,
  onSuccess?: (response: any) => void,
  onError?: (error: any) => void
) => {
  dispatch(uploadFile(file, onSuccess, onError));
};

/**
 * Create file data from image picker response
 * @param asset - Image picker asset
 * @param fileName - Optional custom file name
 * @returns FileData object
 */
export const createFileDataFromAsset = (
  asset: any,
  fileName?: string
): FileData => {
  return {
    uri: asset.uri!,
    type: asset.type || 'image/jpeg',
    name: fileName || asset.fileName || `file_${Date.now()}`,
    size: asset.fileSize,
  };
};

/**
 * Validate file before upload
 * @param file - File data to validate
 * @returns Validation result
 */
export const validateFile = (file: FileData): { isValid: boolean; error?: string } => {
  if (!file.uri) {
    return { isValid: false, error: 'File URI is required' };
  }

  if (!file.type) {
    return { isValid: false, error: 'File type is required' };
  }

  if (!file.name) {
    return { isValid: false, error: 'File name is required' };
  }

  // Add more validation as needed (file size, type restrictions, etc.)
  
  return { isValid: true };
}; 