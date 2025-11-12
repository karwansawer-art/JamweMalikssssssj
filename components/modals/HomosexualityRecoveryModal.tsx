import React from 'react';
import { CloseIcon, BrainCircuitIcon } from '../ui/Icons.tsx'; // Use the new icon

interface HomosexualityRecoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HomosexualityRecoveryModal: React.FC<HomosexualityRecoveryModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const recoveryUrl = "https://altaafi-ai-ljg3lmej.manus.space/";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div 
                className="w-full max-w-md h-[90vh] bg-sky-950 border border-teal-700/50 rounded-2xl shadow-2xl p-0 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-teal-700/50">
                    <div className="flex items-center gap-3">
                        <BrainCircuitIcon className="w-6 h-6 text-teal-300" />
                        <h3 className="text-xl font-bold text-teal-300">التعافي من الشذوذ الجنسية</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-sky-300 hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <main className="flex-grow overflow-hidden rounded-b-2xl">
                    <iframe
                        src={recoveryUrl}
                        title="التعافي من الشذوذ الجنسية"
                        className="w-full h-full border-0"
                    ></iframe>
                </main>
            </div>
        </div>
    );
};

export default HomosexualityRecoveryModal;
