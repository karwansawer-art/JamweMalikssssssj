

import React from 'react';
import { CloseIcon, ApproveIcon, FilterIcon } from '../ui/Icons.tsx'; // Reusing ApproveIcon for 'approved' status

interface CommunityModerationFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFilterSelect: (filter: 'all' | 'approved' | 'pending') => void;
    currentFilter: 'all' | 'approved' | 'pending';
}

const CommunityModerationFilterModal: React.FC<CommunityModerationFilterModalProps> = ({
    isOpen,
    onClose,
    onFilterSelect,
    currentFilter,
}) => {
    if (!isOpen) return null;

    const filterOptions = [
        // FIX: Replaced generic SVG with the new FilterIcon
        { key: 'all', label: 'كل المنشورات', icon: <FilterIcon className="w-6 h-6" /> },
        { key: 'approved', label: 'المنشورات الموافق عليها', icon: <ApproveIcon className="w-6 h-6" /> },
        // FIX: Changed "منشورات لە چاوەڕوانیدا" to "منشورات في انتظار الموافقة"
        { key: 'pending', label: 'منشورات في انتظار الموافقة', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="w-full max-w-sm bg-sky-950/90 border border-sky-500/50 rounded-lg text-white" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30">
                    {/* FIX: Changed "فلتەرکردنی منشورات" to "فلترة المنشورات" */}
                    <h2 className="text-xl font-bold text-sky-200">فلترة المنشورات</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-4 space-y-2">
                    {filterOptions.map(option => (
                        <button
                            key={option.key}
                            onClick={() => onFilterSelect(option.key as 'all' | 'approved' | 'pending')}
                            className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors ${
                                currentFilter === option.key ? 'bg-sky-600 text-white' : 'bg-sky-800/50 text-sky-200 hover:bg-sky-700/70'
                            }`}
                        >
                            {option.icon}
                            <span>{option.label}</span>
                        </button>
                    ))}
                </main>
            </div>
        </div>
    );
};

export default CommunityModerationFilterModal;
