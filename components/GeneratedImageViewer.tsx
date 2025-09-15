
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ImageIcon, DownloadIcon } from './Icons';

interface GeneratedImageViewerProps {
  images: string[];
  isLoading: boolean;
  loadingMessage?: string;
}

const GeneratedImage: React.FC<{ base64: string; index: number; }> = ({ base64, index }) => {
    const imageUrl = `data:image/png;base64,${base64}`;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `generated-image-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="relative group aspect-square bg-gray-900/50 rounded-lg overflow-hidden">
            <img src={imageUrl} alt={`Generated image ${index + 1}`} className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                    onClick={handleDownload}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all transform hover:scale-110"
                    aria-label={`Download image ${index + 1}`}
                >
                    <DownloadIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export const GeneratedImageViewer: React.FC<GeneratedImageViewerProps> = ({ images, isLoading, loadingMessage }) => {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 flex flex-col gap-3 border border-gray-700 h-full w-full">
      <div className="flex justify-between items-center h-8">
        <h3 className="text-lg font-semibold text-gray-300">Generated Images</h3>
      </div>
      <div className="w-full flex-grow bg-gray-900/50 rounded-lg flex justify-center items-center overflow-auto p-4">
        {isLoading ? (
          <LoadingSpinner message={loadingMessage || 'Generating images...'} />
        ) : images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
            {images.map((img, index) => (
                <GeneratedImage key={index} base64={img} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <ImageIcon className="w-16 h-16 mx-auto mb-2"/>
            <p>Your generated images will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
