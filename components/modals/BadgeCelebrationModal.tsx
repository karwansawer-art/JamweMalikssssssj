import React, { useEffect } from 'react';
import type { Badge } from '../../types.ts';
import { CloseIcon } from '../ui/Icons.tsx';

interface BadgeCelebrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    badge: Badge;
}

const BadgeCelebrationModal: React.FC<BadgeCelebrationModalProps> = ({ isOpen, onClose, badge }) => {
    useEffect(() => {
        if (isOpen) {
            // Optional: trigger confetti or other effects
        }
    }, [isOpen]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <style>
                {`
                    @keyframes fade-in {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    .animate-fade-in { animation: fade-in 0.3s ease-out; }
                    
                    @keyframes pop-in {
                        0% { transform: scale(0.5); opacity: 0; }
                        80% { transform: scale(1.1); opacity: 1; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    .animate-pop-in { animation: pop-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
                    
                    @keyframes slide-up {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .animate-slide-up { animation: slide-up 0.5s ease-out 0.2s forwards; opacity: 0; }
                `}
            </style>
            <div className="w-full max-w-sm bg-gradient-to-br from-sky-900 to-slate-900 border-2 border-yellow-400/50 rounded-2xl p-8 text-center shadow-2xl shadow-yellow-500/20 relative" onClick={e => e.stopPropagation()}>
                <div className="animate-pop-in">
                    <h2 className="text-2xl font-bold text-yellow-300 mb-2">تهانينا!</h2>
                    <p className="text-sky-200 mb-6">لقد حصلت على وسام جديد!</p>
                    
                    <div className="bg-yellow-400/10 rounded-lg p-6 flex flex-col items-center gap-4">
                        <span className="text-7xl">{badge.icon}</span>
                        <h3 className="text-3xl font-bold text-yellow-200">{badge.name}</h3>
                        <p className="text-yellow-300 font-semibold">للوصول إلى {badge.days} أيام</p>
                    </div>
                    {badge.message && (
                        <p className="mt-4 text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200">"{badge.message}"</p>
                    )}
                </div>
                 <button onClick={onClose} className="animate-slide-up mt-8 w-full text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 bg-yellow-600/50 hover:bg-yellow-500/70 border border-yellow-400/60">
                    رائع!
                </button>
            </div>
        </div>
    );
};

export default BadgeCelebrationModal;
