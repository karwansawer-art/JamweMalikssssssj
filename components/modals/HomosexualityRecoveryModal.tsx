import React from 'react';
import { CloseIcon, DoctorIcon } from '../ui/Icons.tsx';

interface DrTaafiModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DrTaafiModal: React.FC<DrTaafiModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const recoveryUrl = "https://draltaafi-vjbwt7gk.manus.space/";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div 
                className="w-full max-w-md h-[90vh] bg-sky-950 border border-blue-700/50 rounded-2xl shadow-2xl p-0 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-blue-700/50">
                    <div className="flex items-center gap-3">
                        <DoctorIcon className="w-6 h-6 text-blue-300" />
                        <h3 className="text-xl font-bold text-blue-300">دكتور التعافي</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-sky-300 hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <main className="flex-grow overflow-hidden rounded-b-2xl">
                    <iframe
                        src={recoveryUrl}
                        title="دكتور التعافي"
                        className="w-full h-full border-0"
                    ></iframe>
                </main>
            </div>
        </div>
    );
};

export default DrTaafiModal;