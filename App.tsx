
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ImageViewer } from './components/ImageViewer';
import { VideoViewer } from './components/VideoViewer';
import { ImageComparator } from './components/ImageComparator';
import { AdvancedControls } from './components/AdvancedControls';
import { VideoControls } from './components/VideoControls';
import { CameraCapture } from './components/CameraCapture';
import { ImageGeneratorControls } from './components/ImageGeneratorControls';
import { GeneratedImageViewer } from './components/GeneratedImageViewer';
import { editImage, generateVideo, generateImages } from './services/geminiService';
import type { ImageFile } from './types';
import { UploadIcon, SparklesIcon, LightbulbIcon, UndoIcon, RedoIcon, DownloadIcon, LayoutColumnsIcon, LayoutGridIcon, ImagesIcon, TrashIcon, CameraIcon, VideoIcon, ImagePlusIcon } from './components/Icons';

type EditorMode = 'photo' | 'video' | 'generation';
type ViewMode = 'side-by-side' | 'slider';
type ImageHistory = { edits: string[]; currentIndex: number; };
type HistoryState = Record<number, ImageHistory>;

const photoSuggestions = [
  'Transform into a detailed Japanese Ukiyo-e woodblock print',
  'Reimagine this as a colorful fauvist painting',
  'Apply a pop-art effect with bold outlines and vibrant colors',
  'Make it look like a delicate watercolor sketch',
  'Give it a dramatic, film noir look with deep shadows and high contrast',
  'Drench the scene in neon-noir, cyberpunk city lights',
  'Add a moody, atmospheric fog or mist',
  'Surround the subject with magical, glowing particles',
  'Place the scene on a fantastical alien planet with two moons',
  'Apply a faded, 1970s polaroid photo effect',
  'Give it a grainy, sepia-toned old-timey photo look',
  'Add a glitchy, 80s VHS tape aesthetic',
];

const videoSuggestions = [
  'An epic cinematic shot of a car driving through a neon-lit city at night',
  'A time-lapse of a flower blooming in hyper-detail',
  'A cute, animated character waving hello',
  'A drone shot flying over a majestic mountain range at sunrise',
  'Slow motion shot of a single drop of rain hitting a puddle',
  'A futuristic robot assembling a complex device',
  'A cozy, crackling fireplace scene, looping',
  'A magical portal opening up in a forest',
  'A fleet of spaceships flying through an asteroid field',
  'An abstract animation of flowing liquid colors',
  'A chef expertly tossing a pizza in the air, slow motion',
  'A time-lapse of clouds moving across the sky',
];

const imageGenerationSuggestions = [
  'A hyper-realistic photo of a cat astronaut on the moon',
  'A surreal oil painting of a whale swimming in a cloudy sky',
  'A logo for a coffee shop named "The Starship Brew"',
  'Pixel art of a fantasy castle on a floating island',
  'A cinematic 8k photo of a futuristic cyberpunk city in the rain',
  'A watercolor illustration of a fox reading a book in a forest',
  'A 3D render of a delicious, colorful donut with sprinkles',
  'A vintage travel poster for a trip to Mars',
  'An abstract pattern of geometric shapes in pastel colors',
  'A detailed vector illustration of a robotic hummingbird',
  'A cute sticker of a smiling avocado with sunglasses',
  'A dramatic concept art of a knight facing a dragon',
];


const loadingMessages = [
    "Generating your video...",
    "This can take over a minute on the free service...",
    "The AI model might be warming up...",
    "Thanks for your patience...",
];

const photoModels = [
    { id: 'gemini-2.5-flash-image-preview', name: 'Creative Edit' },
    { id: 'gemini-2.5-flash-image-preview', name: 'Subtle Adjust (Concept)' }, // NOTE: Uses the same model for demo purposes
];

export default function App() {
  // Common state
  const [editorMode, setEditorMode] = useState<EditorMode>('photo');
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  
  // Photo-specific state
  const [originalImages, setOriginalImages] = useState<ImageFile[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [histories, setHistories] = useState<HistoryState>({});
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [selectedModel, setSelectedModel] = useState(photoModels[0].id);


  // Video-specific state
  const [videoStartImage, setVideoStartImage] = useState<ImageFile | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(5);
  const [videoQuality, setVideoQuality] = useState<string>('High');
  const [videoStyle, setVideoStyle] = useState<string>('Cinematic');
  const [videoEffect, setVideoEffect] = useState<string>('None');

  // Image Generation-specific state
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');


  // Photo derived state
  const activeHistory = activeImageIndex !== null ? histories[activeImageIndex] : null;
  const currentEditedImage = activeHistory?.edits[activeHistory.currentIndex] ?? null;
  const canUndo = activeHistory ? activeHistory.currentIndex > 0 : false;
  const canRedo = activeHistory ? activeHistory.currentIndex < activeHistory.edits.length - 1 : false;
  const activeOriginalImage = activeImageIndex !== null ? originalImages[activeImageIndex] : null;
  const originalImageForDisplay = activeHistory?.edits[0] ?? null;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading && editorMode === 'video') {
      setLoadingMessage(loadingMessages[0]);
      let i = 1;
      interval = setInterval(() => {
        setLoadingMessage(loadingMessages[i % loadingMessages.length]);
        i++;
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isLoading, editorMode]);
  
  // Effect to clean up resources
  useEffect(() => {
    return () => {
      // Revoke blob URL to prevent memory leaks
      if (generatedVideoUrl && generatedVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(generatedVideoUrl);
      }
    };
  }, [generatedVideoUrl]);

  const resetAdjustments = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
  };
  
  const resetState = () => {
    setPrompt('');
    setIsLoading(false);
    setError(null);
    setResponseText(null);
    setShowSuggestions(false);
    
    setOriginalImages([]);
    setActiveImageIndex(null);
    setHistories({});
    setViewMode('side-by-side');
    resetAdjustments();
    setSelectedModel(photoModels[0].id);
    
    setVideoStartImage(null);
    setGeneratedVideoUrl(null);
    setVideoDuration(5);
    setVideoQuality('High');
    setVideoStyle('Cinematic');
    setVideoEffect('None');

    setGeneratedImages([]);
    setNumberOfImages(1);
    setAspectRatio('1:1');
  };

  const handleModeChange = (mode: EditorMode) => {
    if (mode !== editorMode) {
      resetState();
      setEditorMode(mode);
    }
  };

  const handleImageUpload = (imageFiles: ImageFile[]) => {
    if (editorMode === 'photo') {
      const newImages = [...originalImages, ...imageFiles];
      const newHistories: HistoryState = { ...histories };
      const firstNewIndex = originalImages.length;
  
      imageFiles.forEach((imageFile, index) => {
        const newImageIndex = firstNewIndex + index;
        newHistories[newImageIndex] = {
          edits: [imageFile.base64],
          currentIndex: 0,
        };
      });
  
      setOriginalImages(newImages);
      setHistories(newHistories);
      setActiveImageIndex(firstNewIndex);
    }
    // Note: Video mode no longer uses direct image uploads from here.
    
    setError(null);
    setResponseText(null);
  };

  const handleCapture = (imageFile: ImageFile) => {
    handleImageUpload([imageFile]);
    setShowCamera(false);
  };

  const handleImageRemove = (indexToRemove: number) => {
    const newOriginalImages = originalImages.filter((_, i) => i !== indexToRemove);
    const newHistories: HistoryState = {};
    let newActiveIndex = activeImageIndex;

    let currentNewIndex = 0;
    for (let i = 0; i < originalImages.length; i++) {
        if (i !== indexToRemove) {
            newHistories[currentNewIndex] = histories[i];
            currentNewIndex++;
        }
    }

    if (activeImageIndex === indexToRemove) {
        if (newOriginalImages.length === 0) newActiveIndex = null;
        else if (indexToRemove >= newOriginalImages.length) newActiveIndex = newOriginalImages.length - 1;
        else newActiveIndex = indexToRemove;
    } else if (activeImageIndex !== null && activeImageIndex > indexToRemove) {
        newActiveIndex = activeImageIndex - 1;
    }

    setOriginalImages(newOriginalImages);
    setHistories(newHistories);
    setActiveImageIndex(newActiveIndex);
  };

  const handleEditRequest = useCallback(async () => {
    if (activeImageIndex === null || !activeOriginalImage || !prompt.trim()) {
      setError('Please select an image and provide an editing prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponseText(null);
    
    const imageToEdit = histories[activeImageIndex].edits[histories[activeImageIndex].currentIndex];
    const originalMimeType = activeOriginalImage.file.type;

    // Construct the adjustment prompt part
    const adjustments = [];
    if (brightness !== 0) adjustments.push(`brightness: ${brightness > 0 ? '+' : ''}${brightness}%`);
    if (contrast !== 0) adjustments.push(`contrast: ${contrast > 0 ? '+' : ''}${contrast}%`);
    if (saturation !== 0) adjustments.push(`saturation: ${saturation > 0 ? '+' : ''}${saturation}%`);
    
    const adjustmentPrompt = adjustments.length > 0 ? ` Apply the following adjustments: ${adjustments.join(', ')}.` : '';
    const fullPrompt = `${prompt.trim()}.${adjustmentPrompt}`;

    try {
      const result = await editImage(imageToEdit, originalMimeType, fullPrompt, selectedModel);
      if (result.newImageBase64) {
        const currentHistory = histories[activeImageIndex];
        const newHistoryEdits = [...currentHistory.edits.slice(0, currentHistory.currentIndex + 1), result.newImageBase64];
        
        setHistories(prev => ({
          ...prev,
          [activeImageIndex]: {
            edits: newHistoryEdits,
            currentIndex: newHistoryEdits.length - 1,
          }
        }));
      } else {
         setError('The AI did not return an image. It might have refused the request. Please try a different prompt.');
      }
      setResponseText(result.text);

    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [activeImageIndex, activeOriginalImage, prompt, histories, brightness, contrast, saturation, selectedModel]);
  
  const handleGenerateVideoRequest = useCallback(async () => {
    if (!prompt.trim()) {
        setError('Please provide a prompt to generate a video.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setResponseText(null);
    setGeneratedVideoUrl(null);

    try {
        const corePrompt = `a ${videoDuration}-second video of: ${prompt.trim()}`;
        const styleAndQuality = `in a ${videoStyle.toLowerCase()} style and ${videoQuality.toLowerCase()} quality`;

        let finalPrompt = '';
        switch (videoEffect) {
            case 'None': finalPrompt = `${corePrompt}, ${styleAndQuality}.`; break;
            case 'Slow-motion': finalPrompt = `A slow-motion version of ${corePrompt}, ${styleAndQuality}.`; break;
            case 'Fast-forward': finalPrompt = `A fast-forward version of ${corePrompt}, ${styleAndQuality}.`; break;
            case 'Cinematic Color Grade': finalPrompt = `${corePrompt} with a cinematic color grade, ${styleAndQuality}.`; break;
            case 'Black and White': finalPrompt = `A black and white version of ${corePrompt}, ${styleAndQuality}.`; break;
            case 'Vintage Film': finalPrompt = `${corePrompt} with a vintage film effect, ${styleAndQuality}.`; break;
            default: finalPrompt = `${corePrompt}, ${styleAndQuality}.`;
        }
        
        const videoUrl = await generateVideo(finalPrompt);
        setGeneratedVideoUrl(videoUrl);

    } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred during video generation.');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [prompt, videoDuration, videoQuality, videoStyle, videoEffect]);

  const handleGenerateImageRequest = useCallback(async () => {
    if (!prompt.trim()) {
        setError('Please provide a prompt to generate an image.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setResponseText(null);
    setGeneratedImages([]);

    try {
        const images = await generateImages(prompt, numberOfImages, aspectRatio);
        if (images && images.length > 0) {
            setGeneratedImages(images);
        } else {
            setError('The AI did not return any images. It might have refused the request. Please try a different prompt.');
        }
    } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred during image generation.');
    } finally {
        setIsLoading(false);
    }
  }, [prompt, numberOfImages, aspectRatio]);


  const handleUndo = () => {
    if (canUndo && activeImageIndex !== null) {
      setHistories(prev => ({ ...prev, [activeImageIndex]: { ...prev[activeImageIndex], currentIndex: prev[activeImageIndex].currentIndex - 1 } }));
    }
  };

  const handleRedo = () => {
    if (canRedo && activeImageIndex !== null) {
      setHistories(prev => ({ ...prev, [activeImageIndex]: { ...prev[activeImageIndex], currentIndex: prev[activeImageIndex].currentIndex + 1 } }));
    }
  };
  
  const handleDownload = () => {
    if (!currentEditedImage) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${currentEditedImage}`;
    link.download = 'edited-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPhotoEditingReady = activeOriginalImage !== null;
  const isButtonDisabled = (
    (editorMode === 'photo' && (!isPhotoEditingReady || !prompt.trim())) || 
    (editorMode === 'video' && !prompt.trim()) || 
    (editorMode === 'generation' && !prompt.trim()) || 
    isLoading
  );
  const isEdited = activeHistory ? activeHistory.currentIndex > 0 : false;
  const suggestions = editorMode === 'photo' ? photoSuggestions : (editorMode === 'video' ? videoSuggestions : imageGenerationSuggestions);
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <Header />
      
      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <main className="flex-grow container mx-auto p-4 lg:p-8 flex flex-col lg:flex-row gap-8">
        {/* Control Panel */}
        <div className="lg:w-1/3 flex flex-col gap-6 bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
            <div>
              <div className="flex bg-gray-700/50 rounded-lg p-1 mb-6">
                  <button onClick={() => handleModeChange('photo')} className={`w-1/3 py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-md transition-colors ${editorMode === 'photo' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                      <CameraIcon className="w-5 h-5"/> Photo Editor
                  </button>
                  <button onClick={() => handleModeChange('generation')} className={`w-1/3 py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-md transition-colors ${editorMode === 'generation' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                      <ImagePlusIcon className="w-5 h-5"/> Image Generator
                  </button>
                   <button onClick={() => handleModeChange('video')} className={`w-1/3 py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-md transition-colors ${editorMode === 'video' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                      <VideoIcon className="w-5 h-5"/> Video Generator
                  </button>
              </div>
              {editorMode === 'photo' && (
                <div>
                  <h2 className="text-xl font-bold text-indigo-400 mb-3 flex items-center gap-2">
                    <UploadIcon className="w-6 h-6" />
                    1. Upload Your Image(s)
                  </h2>
                  <ImageUploader 
                      onImageUpload={handleImageUpload} 
                      onOpenCamera={() => setShowCamera(true)}
                      allowMultiple={true} 
                      acceptedTypes={'image/png, image/jpeg, image/webp'} 
                      labelText={'Click to upload or drop image(s)'}
                  />
                </div>
              )}
            </div>
            
          {editorMode === 'photo' && originalImages.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-indigo-400 mb-3 flex items-center gap-2">
                <ImagesIcon className="w-6 h-6" /> Your Images
              </h2>
              <div className="flex overflow-x-auto gap-3 pb-2 -mx-2 px-2">
                {originalImages.map((image, index) => (
                  <div key={`${image.file.name}-${index}`} className="relative flex-shrink-0 group">
                    <button onClick={() => setActiveImageIndex(index)} className={`w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === index ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-600 hover:border-indigo-400'}`}>
                      <img src={`data:${image.file.type};base64,${image.base64}`} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                    <button onClick={() => handleImageRemove(index)} className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 transition-all transform opacity-0 group-hover:opacity-100 hover:scale-110 focus:opacity-100" aria-label={`Remove image ${index + 1}`}>
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
           
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6" />
                {editorMode === 'photo' && '2. Describe Your Edit'}
                {editorMode === 'video' && '1. Describe Your Video'}
                {editorMode === 'generation' && '1. Describe Your Image'}
              </h2>
              <button onClick={() => setShowSuggestions(!showSuggestions)} className="flex items-center gap-1.5 py-1 px-3 text-sm text-indigo-300 bg-gray-700/50 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-expanded={showSuggestions} aria-controls="suggestion-panel">
                <LightbulbIcon className="w-4 h-4" />
                <span>Suggestions</span>
              </button>
            </div>

            {editorMode === 'photo' && (
              <div className="mb-4">
                  <label htmlFor="model-select" className="text-sm font-medium text-gray-300 block mb-2">AI Model</label>
                  <select
                      id="model-select"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      disabled={isLoading || activeImageIndex === null}
                      className="w-full p-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 disabled:opacity-50"
                  >
                      {photoModels.map(model => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                  </select>
              </div>
            )}
            
            {showSuggestions && (
              <div id="suggestion-panel" className="mb-3 flex flex-wrap gap-2" role="region">
                {suggestions.map((suggestion, index) => (
                  <button key={index} onClick={() => { setPrompt(suggestion); setShowSuggestions(false); }} className="bg-gray-700 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-indigo-600 hover:text-white transition-colors duration-200">
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={
                editorMode === 'photo' ? "e.g., 'add a futuristic city in the background'" : 
                editorMode === 'video' ? "e.g., 'a cinematic shot of a cat driving a car'" :
                "e.g., 'a hyper-realistic photo of a cat astronaut'"
            } className="w-full h-32 p-3 bg-gray-700 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none placeholder-gray-400" disabled={isLoading || (editorMode === 'photo' && activeImageIndex === null)} />
          </div>
          
          {editorMode === 'photo' && isPhotoEditingReady && (
             <AdvancedControls 
                brightness={brightness}
                setBrightness={setBrightness}
                contrast={contrast}
                setContrast={setContrast}
                saturation={saturation}
                setSaturation={setSaturation}
                onReset={resetAdjustments}
                disabled={isLoading}
             />
          )}

          {editorMode === 'video' && (
            <VideoControls
              duration={videoDuration}
              setDuration={setVideoDuration}
              quality={videoQuality}
              setQuality={setVideoQuality}
              style={videoStyle}
              setStyle={setVideoStyle}
              effect={videoEffect}
              setEffect={setVideoEffect}
              disabled={isLoading}
            />
          )}

          {editorMode === 'generation' && (
            <ImageGeneratorControls
              numberOfImages={numberOfImages}
              setNumberOfImages={setNumberOfImages}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              disabled={isLoading}
            />
          )}

          <button onClick={
            editorMode === 'photo' ? handleEditRequest : 
            editorMode === 'video' ? handleGenerateVideoRequest : 
            handleGenerateImageRequest
          } disabled={isButtonDisabled} className={`w-full flex items-center justify-center gap-3 py-3 px-6 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 ${isButtonDisabled ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/50'}`}>
            {isLoading ? (
                editorMode === 'photo' ? 'Editing...' :
                editorMode === 'video' ? 'Generating...' :
                'Generating...'
            ) : (
                editorMode === 'photo' ? 'Generate Edit' :
                editorMode === 'video' ? 'Generate Video' :
                'Generate Image(s)'
            )}
            <SparklesIcon className="w-5 h-5" />
          </button>

          {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-lg text-center">{error}</div>}
        </div>

        {/* Display Area */}
        <div className="lg:w-2/3 flex flex-col gap-4">
          {editorMode === 'photo' ? (
            <>
              {isEdited && (
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-2 flex items-center justify-center gap-2 self-center">
                      <button onClick={() => setViewMode('side-by-side')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${viewMode === 'side-by-side' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                          <LayoutGridIcon className="w-5 h-5 inline-block mr-2"/> Side-by-Side
                      </button>
                      <button onClick={() => setViewMode('slider')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${viewMode === 'slider' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                          <LayoutColumnsIcon className="w-5 h-5 inline-block mr-2"/> Slider
                      </button>
                  </div>
              )}
              {viewMode === 'side-by-side' || !isEdited ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                      <ImageViewer title="Original" imageSrc={originalImageForDisplay} />
                      <ImageViewer title="Edited" imageSrc={currentEditedImage === originalImageForDisplay ? null : currentEditedImage} isLoading={isLoading}>
                          <div className="flex items-center gap-2">
                               <button onClick={handleDownload} disabled={!isEdited || isLoading} className="p-2 text-sm text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700/50" aria-label="Download">
                                  <DownloadIcon className="w-4 h-4" />
                              </button>
                              <button onClick={handleUndo} disabled={!canUndo || isLoading} className="p-2 text-sm text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700/50" aria-label="Undo">
                                  <UndoIcon className="w-4 h-4" />
                              </button>
                              <button onClick={handleRedo} disabled={!canRedo || isLoading} className="p-2 text-sm text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700/50" aria-label="Redo">
                                  <RedoIcon className="w-4 h-4" />
                              </button>
                          </div>
                      </ImageViewer>
                  </div>
              ) : (
                  <ImageComparator 
                      originalSrc={originalImageForDisplay ? `data:image/png;base64,${originalImageForDisplay}` : ''}
                      editedSrc={currentEditedImage ? `data:image/png;base64,${currentEditedImage}` : ''}
                  />
              )}
            </>
          ) : editorMode === 'video' ? (
            <VideoViewer
                startImageSrc={videoStartImage?.base64 ?? null}
                videoSrc={generatedVideoUrl}
                isLoading={isLoading}
                loadingMessage={loadingMessage}
            />
          ) : (
            <GeneratedImageViewer
                images={generatedImages}
                isLoading={isLoading}
            />
          )}
        </div>
      </main>
      {responseText && (
        <footer className="container mx-auto p-4 lg:px-8">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="font-semibold text-indigo-400 mb-2">AI Response:</h3>
                <p className="text-gray-300 text-sm">{responseText}</p>
            </div>
        </footer>
      )}
    </div>
  );
}
