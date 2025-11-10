import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Group } from '../../types';
import { CloseIcon, CameraIcon } from '../ui/Icons.tsx';
import AvatarPickerModal from '../ui/AvatarPickerModal.tsx';


interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onGroupCreated: (group: Group) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, user, onGroupCreated }) => {
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [groupType, setGroupType] = useState<'public' | 'private'>('public');
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    
    const handlePhotoChange = () => {
        setShowAvatarPicker(true);
    };

    const handleClose = () => {
        setGroupName('');
        setDescription('');
        setGroupType('public');
        setPhotoURL(null);
        setError('');
        setLoading(false);
        onClose();
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            setError('الرجاء إدخال اسم للمجموعة.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const members = [user.uid];
            // Data to be sent to Firestore, using serverTimestamp sentinel
            const groupData = {
                name: groupName,
                description: description,
                type: groupType,
                photoURL: photoURL,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                members: members,
                supervisors: [user.uid],
                lastMessage: 'تم إنشاء المجموعة',
                lastMessageTimestamp: serverTimestamp()
            };
            const groupRef = await addDoc(collection(db, 'groups'), groupData);

            // Data for immediate local state update. Use a concrete Timestamp
            // to match the type and avoid issues. `serverTimestamp()` sentinels cause
            // circular reference errors if they get into React state.
            // The snapshot listener will soon replace this with the real server-generated timestamp.
            const now = Timestamp.now();
            const newGroup: Group = {
                id: groupRef.id,
                name: groupName,
                description: description,
                type: groupType,
                photoURL: photoURL,
                createdBy: user.uid,
                createdAt: now,
                members: members,
                supervisors: [user.uid],
                lastMessage: 'تم إنشاء المجموعة',
                lastMessageTimestamp: now,
            };

            onGroupCreated(newGroup);
            handleClose();

        } catch (err) {
            console.error("Error creating group:", err);
            setError('حدث خطأ أثناء إنشاء المجموعة.');
            setLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <>
             <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col">
                    <header className="flex items-center justify-between p-4 border-b border-sky-400/30">
                        <h2 className="text-xl font-bold text-sky-200">إنشاء مجموعة جديدة</h2>
                        <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                    </header>
                    <main className="p-6 space-y-4 overflow-y-auto">
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                 <img src={photoURL || `https://ui-avatars.com/api/?name=${groupName || ' '}&background=0369a1&color=fff&size=128`} alt="صورة المجموعة" className="w-24 h-24 rounded-full object-cover border-4 border-sky-400/50" />
                                 <button onClick={handlePhotoChange} className="absolute bottom-0 right-0 bg-sky-600 p-2 rounded-full hover:bg-sky-500"><CameraIcon className="w-5 h-5 text-white" /></button>
                            </div>
                            <input type="text" placeholder="اسم المجموعة" value={groupName} onChange={e => setGroupName(e.target.value)} className="w-full bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                            <textarea placeholder="وصف المجموعة (اختياري)" value={description} onChange={e => setDescription(e.target.value)} className="w-full h-24 bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                        </div>
                         <div>
                            <span className="text-sm text-sky-300">نوع المجموعة:</span>
                            <div className="flex items-center justify-around mt-2 p-1 bg-sky-800/60 rounded-lg border border-sky-700">
                                <button onClick={() => setGroupType('public')} className={`w-1/2 py-2 rounded-md transition-colors ${groupType === 'public' ? 'bg-sky-600' : 'hover:bg-sky-700/50'}`}>عامة</button>
                                <button onClick={() => setGroupType('private')} className={`w-1/2 py-2 rounded-md transition-colors ${groupType === 'private' ? 'bg-sky-600' : 'hover:bg-sky-700/50'}`}>خاصة</button>
                            </div>
                        </div>
                    </main>
                    <footer className="p-4 border-t border-sky-400/30">
                        <button onClick={handleCreateGroup} disabled={loading} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-sky-600 hover:bg-sky-500 disabled:opacity-50">
                            {loading ? 'جارِ الإنشاء...' : 'إنشاء المجموعة'}
                        </button>
                    </footer>
                </div>
             </div>
             <AvatarPickerModal
                isOpen={showAvatarPicker}
                onClose={() => setShowAvatarPicker(false)}
                onSelectAvatar={setPhotoURL}
             />
        </>
    );
};

export default CreateGroupModal;