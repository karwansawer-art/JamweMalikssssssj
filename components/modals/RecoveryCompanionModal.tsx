import React from 'react';
import { CloseIcon, FriendsIcon } from '../ui/Icons.tsx';

interface RecoveryCompanionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RecoveryCompanionModal: React.FC<RecoveryCompanionModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const companionUrl = "https://rafiqrehab-jnafhdfu.manus.space/";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div 
                className="w-full max-w-md h-[90vh] bg-sky-950 border border-purple-700/50 rounded-2xl shadow-2xl p-0 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-purple-700/50">
                    <div className="flex items-center gap-3">
                        <FriendsIcon className="w-6 h-6 text-purple-300" />
                        <h3 className="text-xl font-bold text-purple-300">رفيقك في التعافي</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-sky-300 hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <main className="flex-grow overflow-hidden rounded-b-2xl">
                    <iframe
                        src={companionUrl}
                        title="رفيقك في التعافي"
                        className="w-full h-full border-0"
                    ></iframe>
                </main>
            </div>
        </div>
    );
};

export default RecoveryCompanionModal;