
import React from 'react';
import { SlidersHorizontalIcon, RotateCcwIcon } from './Icons';

interface AdvancedControlsProps {
  brightness: number;
  setBrightness: (value: number) => void;
  contrast: number;
  setContrast: (value: number) => void;
  saturation: number;
  setSaturation: (value: number) => void;
  onReset: () => void;
  disabled: boolean;
}

const Slider: React.FC<{
    label: string;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled: boolean;
}> = ({ label, value, onChange, disabled }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label htmlFor={`${label}-slider`} className="text-sm font-medium text-gray-300">{label}</label>
            <span className="text-sm font-mono bg-gray-600/50 px-2 py-0.5 rounded-md text-indigo-300">{value}</span>
        </div>
        <input
            id={`${label}-slider`}
            type="range"
            min="-100"
            max="100"
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
    </div>
);


export const AdvancedControls: React.FC<AdvancedControlsProps> = ({
  brightness,
  setBrightness,
  contrast,
  setContrast,
  saturation,
  setSaturation,
  onReset,
  disabled
}) => {
  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                <SlidersHorizontalIcon className="w-6 h-6" />
                3. Advanced Adjustments
            </h2>
            <button 
                onClick={onReset}
                disabled={disabled}
                className="flex items-center gap-1.5 py-1 px-3 text-sm text-indigo-300 bg-gray-700/50 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                <RotateCcwIcon className="w-4 h-4" />
                <span>Reset</span>
            </button>
        </div>
        <div className="space-y-4 bg-gray-700/50 p-4 rounded-lg">
            <Slider label="Brightness" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} disabled={disabled} />
            <Slider label="Contrast" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} disabled={disabled} />
            <Slider label="Saturation" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} disabled={disabled} />
        </div>
    </div>
  );
};