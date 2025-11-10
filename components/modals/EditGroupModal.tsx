import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { Group } from '../../types.ts';
import { CloseIcon, CameraIcon } from '../ui/Icons.tsx';
import AvatarPickerModal from '../ui/AvatarPickerModal.tsx';


interface EditGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: Group;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({ isOpen, onClose, group }) => {
    const [groupName, setGroupName] = useState(group.name);
    const [description, setDescription] = useState(group.description || '');
    const [photoURL, setPhotoURL] = useState<string | null>(group.photoURL || null);
    const [groupType, setGroupType] = useState<'public' | 'private'>(group.type);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    const handlePhotoChange = () => {
        setShowAvatarPicker(true);
    };

    const handleSave = async () => {
        if (!groupName.trim()) {
            setError('اسم المجموعة لا يمكن أن يكون فارغًا.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const groupDocRef = doc(db, 'groups', group.id);
            await updateDoc(groupDocRef, {
                name: groupName,
                description: description,
                photoURL: photoURL,
                type: groupType
            });
            onClose();
        } catch (err) {
            console.error("Error updating group:", err);
            setError('حدث خطأ أثناء تحديث المجموعة.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col">
                    <header className="flex items-center justify-between p-4 border-b border-sky-400/30">
                        <h2 className="text-xl font-bold text-sky-200">تعديل المجموعة</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
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
                    <footer className="p-4 border-t border-sky-400/30 flex justify-end gap-4">
                         <button onClick={onClose} className="px-4 py-2 font-semibold text-white rounded-md transition-all duration-300 ease-in-out shadow-md border border-white/20 focus:outline-none bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-gray-500">إلغاء</button>
                        <button onClick={handleSave} disabled={loading} className="px-4 py-2 font-semibold text-white rounded-md transition-all duration-300 ease-in-out shadow-md border border-white/20 focus:outline-none bg-gradient-to-br from-sky-600 to-sky-800 hover:from-sky-500 hover:to-sky-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-sky-500 disabled:opacity-50">
                            {loading ? 'جارِ الحفظ...' : 'حفظ التغييرات'}
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

export default EditGroupModal;