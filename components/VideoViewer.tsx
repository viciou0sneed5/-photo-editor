
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { VideoIcon, ImageIcon, DownloadIcon } from './Icons';

interface VideoViewerProps {
  startImageSrc: string | null;
  videoSrc: string | null;
  isLoading: boolean;
  loadingMessage: string;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ startImageSrc, videoSrc, isLoading, loadingMessage }) => {
  const fullImageSrc = startImageSrc ? `data:image/png;base64,${startImageSrc}` : null;
  
  return (
    <div className="bg-gray-800 rounded-2xl p-4 flex flex-col gap-3 border border-gray-700 h-full w-full">
      <div className="flex justify-between items-center h-8">
        <h3 className="text-lg font-semibold text-gray-300">Generated Video</h3>
        {videoSrc && !isLoading && (
            <a
                href={videoSrc}
                download="generated-video.mp4"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 flex items-center gap-2 text-sm text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Download Video"
            >
                <DownloadIcon className="w-4 h-4" />
            </a>
        )}
      </div>
      <div className="w-full aspect-video bg-gray-900/50 rounded-lg flex justify-center items-center overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message={loadingMessage} />
        ) : videoSrc ? (
          <video src={videoSrc} controls autoPlay loop className="w-full h-full object-contain">
            Your browser does not support the video tag.
          </video>
        ) : fullImageSrc ? (
            <img src={fullImageSrc} alt="Starting frame" className="w-full h-full object-contain" />
        ) : (
          <div className="text-center text-gray-500">
            <VideoIcon className="w-16 h-16 mx-auto mb-2"/>
            <p>Your generated video will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};