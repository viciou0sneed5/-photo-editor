
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ImageIcon } from './Icons';

interface ImageViewerProps {
  title: string;
  imageSrc: string | null;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ title, imageSrc, isLoading = false, children }) => {
  const fullImageSrc = imageSrc ? `data:image/png;base64,${imageSrc}` : null;
  
  return (
    <div className="bg-gray-800 rounded-2xl p-4 flex flex-col gap-3 border border-gray-700 h-full">
      <div className="flex justify-between items-center h-8">
        <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
        {children && <div>{children}</div>}
      </div>
      <div className="w-full aspect-square bg-gray-900/50 rounded-lg flex justify-center items-center overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : fullImageSrc ? (
          <img src={fullImageSrc} alt={title} className="w-full h-full object-contain" />
        ) : (
          <div className="text-center text-gray-500">
            <ImageIcon className="w-16 h-16 mx-auto mb-2"/>
            <p>Your {title.toLowerCase()} image will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};