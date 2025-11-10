import React from 'react';
import type { UserProfile } from '../../types.ts';
import { CloseIcon, SparklesIcon } from '../ui/Icons.tsx';

interface RecoveryQAModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
}

const RecoveryQAModal: React.FC<RecoveryQAModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const recoveryUrl = "https://docrecovery-4a96p2an.manus.space/";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div 
                className="w-full max-w-md h-[90vh] bg-sky-950 border border-cyan-700/50 rounded-2xl shadow-2xl p-0 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-cyan-700/50">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-cyan-300" />
                        <h3 className="text-xl font-bold text-cyan-300">سؤال في التعافي</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-sky-300 hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <main className="flex-grow overflow-hidden rounded-b-2xl">
                    <iframe
                        src={recoveryUrl}
                        title="سؤال في التعافي"
                        className="w-full h-full border-0"
                    ></iframe>
                </main>
            </div>
        </div>
    );
};

export default RecoveryQAModal;