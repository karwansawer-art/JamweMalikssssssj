import React from 'react';

const ProgressBar: React.FC<{ label: string; progress: number; colorClass?: string; colorStyle?: React.CSSProperties }> = ({ label, progress, colorClass, colorStyle }) => (
    <div className="flex-grow h-12 bg-black/40 rounded-lg p-1 relative">
        <div 
            className={`${colorClass || ''} h-full rounded-md transition-width duration-100 ease-linear`}
            style={{ width: `${progress}%`, ...colorStyle }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-start pr-4">
            <span className="text-white font-bold text-lg text-shadow">{label}</span>
        </div>
    </div>
);

export default ProgressBar;