
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fileToBase64, base64toFile } from '../utils/fileUtils';
import type { ImageFile } from '../types';
import { CameraIcon, XIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface CameraCaptureProps {
  onCapture: (imageFile: ImageFile) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Camera permission denied. Please enable camera access in your browser settings.");
        } else {
           setError(`Could not start camera: ${err.message}`);
        }
      } else {
        setError("An unknown error occurred while trying to access the camera.");
      }
    }
  };

  useEffect(() => {
    startCamera();
    
    // Cleanup function to stop the stream
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleClose = () => {
    stream?.getTracks().forEach(track => track.stop());
    onClose();
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `capture-${Date.now()}.png`;
      const file = base64toFile(dataUrl, filename);
      const base64 = await fileToBase64(file);
      const imageFile: ImageFile = { file, base64 };
      onCapture(imageFile);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
            <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                <CameraIcon className="w-6 h-6 text-indigo-400" />
                Capture Image
            </h2>
            <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Close camera view"
            >
                <XIcon className="w-5 h-5" />
            </button>
        </div>

        <div className="relative aspect-video w-full bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-contain transition-opacity duration-300 ${stream ? 'opacity-100' : 'opacity-0'}`}
          />
          {!stream && (
            <div className="absolute inset-0 flex items-center justify-center">
              {error ? (
                 <div className="text-center text-red-400 p-4 max-w-md">
                   <h3 className="font-bold mb-2">Camera Error</h3>
                   <p className="text-sm">{error}</p>
                 </div>
              ) : (
                <LoadingSpinner message="Starting camera..." />
              )}
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        <div className="p-4 bg-gray-800/50 flex justify-center items-center">
            <button 
                onClick={handleCapture}
                disabled={!stream || !!error}
                className="w-20 h-20 rounded-full bg-white disabled:bg-gray-500 disabled:cursor-not-allowed group flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ring-4 ring-white/20"
                aria-label="Take photo"
            >
                <div className="w-16 h-16 rounded-full bg-white group-hover:bg-gray-200 border-2 border-gray-800 transition-colors"></div>
            </button>
        </div>
      </div>
    </div>
  );
};