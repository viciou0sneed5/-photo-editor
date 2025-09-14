
import React, { useRef, useCallback } from 'react';
import { fileToBase64 } from '../utils/fileUtils';
import type { ImageFile } from '../types';
import { UploadCloudIcon, CameraIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (imageFiles: ImageFile[]) => void;
  onOpenCamera: () => void;
  allowMultiple?: boolean;
  acceptedTypes?: string;
  labelText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
    onImageUpload, 
    onOpenCamera,
    allowMultiple = true, 
    acceptedTypes = "image/png, image/jpeg, image/webp",
    labelText = "Click to upload or drop image(s)"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const imageFilePromises = Array.from(files).map(async (file) => {
          const base64 = await fileToBase64(file);
          return { file, base64 };
        });
        
        const imageFiles = await Promise.all(imageFilePromises);
        onImageUpload(imageFiles);

        if (event.target) {
            event.target.value = '';
        }

      } catch (error) {
        console.error("Error converting files to base64", error);
      }
    }
  }, [onImageUpload]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={handleClick}
        className="w-full h-32 border-2 border-dashed border-gray-600 rounded-lg flex flex-col justify-center items-center text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors duration-300 cursor-pointer bg-gray-700/50"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={acceptedTypes}
          multiple={allowMultiple}
        />
        <div className="text-center">
          <UploadCloudIcon className="w-10 h-10 mx-auto mb-2"/>
          <p className="font-semibold">{labelText}</p>
          <p className="text-xs">PNG, JPG, or WEBP</p>
        </div>
      </div>
      <button 
        onClick={onOpenCamera}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-gray-300 hover:text-white transition-colors"
        >
          <CameraIcon className="w-5 h-5" />
          Use Camera
      </button>
    </div>
  );
};