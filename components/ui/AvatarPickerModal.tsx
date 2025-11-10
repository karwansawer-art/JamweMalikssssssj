import React from 'react';
import { CloseIcon } from './Icons.tsx';

export const AVATAR_OPTIONS = [
    // A fresh set of reliable nature landscape images
    'https://images.unsplash.com/photo-1434725039720-aaad6dd32dfe?q=80&w=400&auto=format&fit=crop', // 1. Misty mountains
    'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=400&auto=format&fit=crop', // 2. Green forest path
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=400&auto=format&fit=crop', // 3. Beach with rock (Replaced)
    'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=400&auto=format&fit=crop', // 4. Desert landscape
    'https://images.unsplash.com/photo-1487088678257-3a541e6e3922?q=80&w=400&auto=format&fit=crop', // 5. Starry night sky
    'https://images.unsplash.com/photo-1598449356475-b9f71db7d847?q=80&w=400&auto=format&fit=crop', // 6. Green terraced hills
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=400&auto=format&fit=crop', // 7. Lakeside mountain view (Replaced)
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=400&auto=format&fit=crop', // 8. Snowy mountain peak
    'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?q=80&w=400&auto=format&fit=crop', // 9. Pink sunset over water (Replaced)
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=400&auto=format&fit=crop', // 10. Northern Lights (Aurora)
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=400&auto=format&fit=crop', // 11. Majestic waterfall (Replaced)
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=400&auto=format&fit=crop'  // 12. Autumn forest
];


interface AvatarPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectAvatar: (url: string) => void;
}

const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ isOpen, onClose, onSelectAvatar }) => {
    if (!isOpen) return null;

    const handleSelect = (url: string) => {
        onSelectAvatar(url);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={onClose}>
            <div 
                className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col h-[70vh]"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-200">اختر صورة رمزية</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-4 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-4">
                        {AVATAR_OPTIONS.map((url, index) => (
                            <button key={index} onClick={() => handleSelect(url)} className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-sky-400 focus:border-sky-400 focus:outline-none transition">
                                <img src={url} alt={`Avatar option ${index + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AvatarPickerModal;