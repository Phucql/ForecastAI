import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload as S3Upload } from '@aws-sdk/lib-storage';

interface FileUploadProps {
  accept: string;
  onUploadSuccess: (filename: string) => void;
  onUploadError: (error: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ accept, onUploadSuccess, onUploadError }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // AWS credentials (via environment variables) and bucket name
  const AWS_ACCESS_KEY = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
  const AWS_SECRET_KEY = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
  const S3_BUCKET = 'forecastai-file-upload-storage';  // Fixed bucket name

  // Basic validation for required environment variables
  if (!AWS_ACCESS_KEY || !AWS_SECRET_KEY) {
    return <div className="p-4 bg-red-100 text-red-700 rounded">Missing AWS credentials. Please check your .env or Netlify environment variables.</div>;
  }

  // Initialize the S3 client
  const s3Client = new S3Client({
    region: 'us-east-2', // Adjust if your bucket is in another region
    credentials: {
      accessKeyId: AWS_ACCESS_KEY,
      secretAccessKey: AWS_SECRET_KEY,
    }
  });

  /**
   * Upload the file to S3, placing it in a date-based folder:
   * e.g., "uploads_032825/1680022800000-filename.png"
   */
  const uploadToS3 = async (file: File) => {
    // Build a date string for the folder name: uploads_MMDDYY
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // e.g., '03'
    const day = String(date.getDate()).padStart(2, '0');       // e.g., '28'
    const year = String(date.getFullYear()).slice(-2);         // e.g., '25' for 2025
    const folderName = `uploads_${month}${day}${year}`;        // e.g., 'uploads_032825'

    // Construct the S3 object key with the folder name
    const key = `${folderName}/${Date.now()}-${file.name}`;

    console.log('Starting upload to S3...');
    console.log('Folder name:', folderName);
    console.log('Full key:', key);
    console.log('Bucket:', S3_BUCKET);

    const upload = new S3Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET,
        Key: key,
        Body: file,
        ContentType: file.type,
        ACL: 'public-read' // Adjust based on your needs
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 5,
      leavePartsOnError: false
    });

    try {
      const result = await upload.done();
      console.log('Upload completed successfully:', result);
      return key;
    } catch (err) {
      console.error('Detailed S3 Upload Error:', err);
      if (err instanceof Error) {
        if (err.message.includes('CORS')) {
          throw new Error('Upload failed due to CORS. Please check your S3 bucket CORS policy.');
        }
        if (err.message.includes('AccessDenied')) {
          throw new Error('Upload failed: Access Denied. Please check your S3 bucket permissions.');
        }
        throw new Error(`S3 Upload failed: ${err.message}`);
      }
      throw new Error('Failed to upload to S3: Unknown error');
    }
  };

  /**
   * Handle file selection (either via manual input or drag-and-drop).
   */
  const handleFileChange = useCallback(async (file: File) => {
    if (!file) return;

    // 200 MB size limit (adjust as needed)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = 'File size exceeds 200MB limit';
      setError(errorMsg);
      onUploadError(errorMsg);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const s3Key = await uploadToS3(file);
      console.log('File uploaded successfully to S3:', s3Key);

      // Mark success and notify parent
      setSuccess(true);
      onUploadSuccess(file.name);

      // **Auto-reset** the success state after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      const errorMessage = uploadError instanceof Error
        ? uploadError.message
        : 'Upload failed';
      setError(errorMessage);
      onUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess, onUploadError]);

  /**
   * Drag-and-drop event handlers.
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  }, [handleFileChange]);

  /**
   * File input change handler (for manual file selection).
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  }, [handleFileChange]);

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg shadow-sm transition-all
        ${dragActive ? 'border-2 border-orange-500 bg-orange-50' : 'border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-gray-100'}
        ${uploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !uploading && document.getElementById('file-upload')?.click()}
    >
      <div className="relative">
        {!uploading && !error && !success && (
          <Upload className="w-12 h-12 text-orange-500 mb-2" />
        )}
        {uploading && (
          <Loader2 className="w-12 h-12 text-orange-500 mb-2 animate-spin" />
        )}
        {error && (
          <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
        )}
        {success && (
          <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
        )}
      </div>

      <span className="text-sm font-medium mb-2">
        {uploading ? 'Uploading...' : 'Upload Data'}
      </span>

      {/* 
        Show drag-and-drop text only if we're NOT uploading, NOT in error, 
        and NOT in success state. 
      */}
      {!uploading && !error && !success && (
        <p className="text-sm text-gray-500 text-center">
          Drag and drop your file here or click to browse
        </p>
      )}

      {error && (
        <div className="text-sm text-red-500 mb-2 text-center">
          {error}
        </div>
      )}

      <input
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        id="file-upload"
        disabled={uploading}
      />
    </div>
  );
};
