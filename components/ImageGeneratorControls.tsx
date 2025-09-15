
import React from 'react';
import { SlidersHorizontalIcon } from './Icons';

interface ImageGeneratorControlsProps {
  numberOfImages: number;
  setNumberOfImages: (value: number) => void;
  aspectRatio: string;
  setAspectRatio: (value: string) => void;
  disabled: boolean;
}

const aspectRatioOptions = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const Selector: React.FC<{
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    disabled: boolean;
}> = ({ label, value, onChange, options, disabled }) => (
     <div>
        <label htmlFor={`${label}-select`} className="text-sm font-medium text-gray-300 block mb-2">{label}</label>
        <select
            id={`${label}-select`}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full p-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 disabled:opacity-50"
        >
            {options.map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    </div>
);

export const ImageGeneratorControls: React.FC<ImageGeneratorControlsProps> = ({
  numberOfImages,
  setNumberOfImages,
  aspectRatio,
  setAspectRatio,
  disabled
}) => {
  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                <SlidersHorizontalIcon className="w-6 h-6" />
                2. Generation Settings
            </h2>
        </div>
        <div className="space-y-4 bg-gray-700/50 p-4 rounded-lg">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label htmlFor="numberOfImages-slider" className="text-sm font-medium text-gray-300">Number of Images</label>
                    <span className="text-sm font-mono bg-gray-600/50 px-2 py-0.5 rounded-md text-indigo-300">{numberOfImages}</span>
                </div>
                <input
                    id="numberOfImages-slider"
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={numberOfImages}
                    onChange={(e) => setNumberOfImages(parseInt(e.target.value))}
                    disabled={disabled}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>
            <Selector label="Aspect Ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} options={aspectRatioOptions} disabled={disabled} />
        </div>
    </div>
  );
};
