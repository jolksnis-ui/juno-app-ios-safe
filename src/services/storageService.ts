import { APIClient, TokenExpiredError } from '../utils/apiClient';
import { AttachmentFile } from '../types/payment';

// Despite the naming, this supports all file types, not just images
interface PresignedUrlRequest {
  imgcount: string;  // File identifier like "file0", "file1"
  imageType: string;  // 'clientPayout' or other types based on transaction
  transactionImage: string;  // Unique identifier for the file
}

interface PresignedUrlResponse {
  data: string[];  // Array of presigned URLs from Google Storage
}

interface UploadResult {
  originalFile: AttachmentFile;
  presignedUrl: string;
  documentUrl: string;  // Clean URL for transaction API
}

/**
 * Get presigned URL from the server for uploading files to Google Storage
 */
export const getClientPresignedUrl = async (params: PresignedUrlRequest): Promise<PresignedUrlResponse> => {
  try {
    console.log('Requesting presigned URL with params:', JSON.stringify(params));
    const response = await APIClient.post<PresignedUrlResponse>('/get-client-presigned-url', params);
    
    if (!response.data || !response.data.data || response.data.data.length === 0) {
      throw new Error('Failed to get presigned URL from server');
    }
    
    console.log('Received presigned URL response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to get presigned URL:', error);
    console.error('Request params were:', params);
    throw error;
  }
};

/**
 * Upload a file to Google Storage using the presigned URL
 * Supports any file type (documents, images, PDFs, etc.)
 */
export const uploadFileToGoogleStorage = async (
  presignedUrl: string, 
  file: AttachmentFile
): Promise<void> => {
  try {
    // Read the file from the URI
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    // Upload to Google Storage using PUT request
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file to Google Storage: ${uploadResponse.status}`);
    }
    
    console.log(`File uploaded successfully: ${file.name}`);
  } catch (error) {
    console.error('Failed to upload file to Google Storage:', error);
    throw error;
  }
};

/**
 * Extract the clean document URL from a presigned URL
 * Converts Google Storage presigned URL to the format needed for transaction API
 */
export const extractDocumentUrl = (presignedUrl: string): string => {
  try {
    // Extract the path before the query parameters
    const baseUrl = presignedUrl.split('?')[0];
    
    // Convert Google Storage URL to our API format
    // From: https://storage.googleapis.com/cryptonpay-assets-dev/images/client-payout/file0/transactionImage875023/documents?...
    // To: https://dev.junomoney.org/images/client-payout/file0/transactionImage875023/documents
    
    if (baseUrl.includes('storage.googleapis.com')) {
      // Extract the path after the bucket name
      const pathMatch = baseUrl.match(/cryptonpay-assets-[^\/]+\/(.+)$/);
      if (pathMatch && pathMatch[1]) {
        return `https://dev.junomoney.org/${pathMatch[1]}`;
      }
    }
    
    // Fallback: return the base URL without query params
    return baseUrl;
  } catch (error) {
    console.error('Failed to extract document URL:', error);
    return presignedUrl.split('?')[0];
  }
};

/**
 * Upload multiple attachments for a transaction
 * Returns array of clean document URLs to include in transaction request
 */
export const uploadAttachmentsForTransaction = async (
  attachments: AttachmentFile[],
  transactionType: string,  // 'clientPayout', 'clientWithdrawal', etc.
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const documentUrls: string[] = [];
  const errors: Array<{ file: string; error: string }> = [];
  
  for (let i = 0; i < attachments.length; i++) {
    try {
      const file = attachments[i];
      
      // Update progress
      if (onProgress) {
        onProgress(i, attachments.length);
      }
      
      // Generate unique identifier for this file
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const transactionImage = `transactionFile${timestamp}${randomId}`;
      
      // Get presigned URL
      console.log(`Getting presigned URL for ${file.name}...`);
      const presignedResponse = await getClientPresignedUrl({
        imgcount: `file${i}`,
        imageType: "clientPayout",
        transactionImage,
      });
      
      const presignedUrl = presignedResponse.data[0];
      
      // Upload file to Google Storage
      console.log(`Uploading ${file.name} to Google Storage...`);
      await uploadFileToGoogleStorage(presignedUrl, file);
      
      // Extract clean document URL for transaction
      const documentUrl = extractDocumentUrl(presignedUrl);
      documentUrls.push(documentUrl);
      
      console.log(`Successfully uploaded ${file.name}: ${documentUrl}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ file: attachments[i].name, error: errorMessage });
      console.error(`Failed to upload ${attachments[i].name}:`, error);
      
      // Throw error to stop the process if any upload fails
      throw new Error(`Failed to upload ${attachments[i].name}: ${errorMessage}`);
    }
  }
  
  // Final progress update
  if (onProgress) {
    onProgress(attachments.length, attachments.length);
  }
  
  if (errors.length > 0) {
    const errorMessage = errors.map(e => `${e.file}: ${e.error}`).join(', ');
    throw new Error(`Failed to upload files: ${errorMessage}`);
  }
  
  return documentUrls;
};

/**
 * Validate file before upload
 */
export const validateFile = (file: AttachmentFile, maxSizeInMB: number = 10): string | null => {
  // Check file size (convert MB to bytes)
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return `File size exceeds ${maxSizeInMB}MB limit`;
  }
  
  // File type validation can be added here if needed
  // For now, we accept all file types as per requirement
  
  return null; // Valid file
};