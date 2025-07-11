import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

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

  // Remove AWS credentials and S3 logic

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
      // Upload to backend
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const msg = (await res.json()).error || 'Upload failed';
        throw new Error(msg);
      }
      setSuccess(true);
      onUploadSuccess(file.name);
      setTimeout(() => { setSuccess(false); }, 3000);
    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';
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
