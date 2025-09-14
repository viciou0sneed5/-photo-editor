
import React from 'react';
import { FilmIcon, WandIcon } from './Icons';

interface VideoControlsProps {
  duration: number;
  setDuration: (value: number) => void;
  quality: string;
  setQuality: (value: string) => void;
  style: string;
  setStyle: (value: string) => void;
  effect: string;
  setEffect: (value: string) => void;
  disabled: boolean;
}

const qualityOptions = ['Standard', 'High'];
const styleOptions = ['Cinematic', 'Realistic', 'Animated', 'Time-lapse', 'Surreal', 'Dreamlike'];
const effectOptions = ['None', 'Slow-motion', 'Fast-forward', 'Cinematic Color Grade', 'Black and White', 'Vintage Film'];


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


export const VideoControls: React.FC<VideoControlsProps> = ({
  duration,
  setDuration,
  quality,
  setQuality,
  style,
  setStyle,
  effect,
  setEffect,
  disabled
}) => {
  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                <FilmIcon className="w-6 h-6" />
                3. Video Settings
            </h2>
        </div>
        <div className="space-y-4 bg-gray-700/50 p-4 rounded-lg">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label htmlFor="duration-slider" className="text-sm font-medium text-gray-300">Duration (seconds)</label>
                    <span className="text-sm font-mono bg-gray-600/50 px-2 py-0.5 rounded-md text-indigo-300">{duration}s</span>
                </div>
                <input
                    id="duration-slider"
                    type="range"
                    min="1"
                    max="180"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    disabled={disabled}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>
            <Selector label="Quality" value={quality} onChange={(e) => setQuality(e.target.value)} options={qualityOptions} disabled={disabled} />
            <Selector label="Style" value={style} onChange={(e) => setStyle(e.target.value)} options={styleOptions} disabled={disabled} />
        </div>

        <div className="mt-6">
            <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2 mb-4">
                <WandIcon className="w-6 h-6" />
                4. AI Video Effects
            </h3>
            <div className="bg-gray-700/50 p-4 rounded-lg">
                <Selector label="Apply Effect" value={effect} onChange={(e) => setEffect(e.target.value)} options={effectOptions} disabled={disabled} />
            </div>
        </div>
    </div>
  );
};