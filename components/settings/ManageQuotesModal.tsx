import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import { CloseIcon, PlusIcon, TrashIcon, Spinner } from '../ui/Icons.tsx';

interface ContentDoc {
    id: string;
    text: string;
    createdAt: Timestamp;
}

interface ManageContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    collectionName: string;
    modalTitle: string;
    placeholderText: string;
}

const ManageContentModal: React.FC<ManageContentModalProps> = ({ isOpen, onClose, collectionName, modalTitle, placeholderText }) => {
    const [content, setContent] = useState<ContentDoc[]>([]);
    const [newContent, setNewContent] = useState('');
    const [loading, setLoading] = useState(false); // For adding content
    const [error, setError] = useState('');
    const [fetchError, setFetchError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        
        setFetchError('');
        const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedContent = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentDoc));
            setContent(fetchedContent);
        }, (err) => {
            console.error(`Error fetching from ${collectionName}:`, err);
            setFetchError("حدث خطأ أثناء جلب المحتوى.");
        });
        
        return () => unsubscribe();
    }, [isOpen, collectionName]);

    const handleAddContent = async () => {
        if (newContent.trim()) {
            setLoading(true);
            setError('');
            try {
                await addDoc(collection(db, collectionName), {
                    text: newContent.trim(),
                    createdAt: serverTimestamp()
                });
                setNewContent('');
            } catch (err) {
                console.error(`Error adding to ${collectionName}:`, err);
                setError("حدث خطأ أثناء إضافة المحتوى.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDeleteContent = async (id: string) => {
        try {
            await deleteDoc(doc(db, collectionName, id));
        } catch (err) {
            console.error(`Error deleting from ${collectionName}:`, err);
        }
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col h-[90vh]">
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-200">{modalTitle}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 space-y-6 overflow-y-auto">
                    <div className="space-y-3">
                        <label htmlFor="new-content" className="font-semibold text-sky-200">إضافة محتوى جديد:</label>
                        <div className="flex gap-2">
                            <textarea
                                id="new-content"
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                placeholder={placeholderText}
                                className="w-full h-24 bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                            />
                            <button onClick={handleAddContent} disabled={loading} className="p-3 bg-sky-600 hover:bg-sky-500 rounded-lg flex-shrink-0 disabled:opacity-50 self-start">
                                {loading ? <Spinner className="w-6 h-6" /> : <PlusIcon className="w-6 h-6" />}
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
                    </div>

                    <div className="space-y-3">
                        <label className="font-semibold text-sky-200">المحتوى الحالي:</label>
                        {fetchError && <p className="text-red-400 text-sm text-center py-6">{fetchError}</p>}
                        {!fetchError && content.length > 0 ? (
                            <ul className="space-y-2">
                                {content.map((item) => (
                                    <li key={item.id} className="flex items-start justify-between p-3 bg-sky-800/50 rounded-lg">
                                        <p className="text-sky-300 break-words flex-grow whitespace-pre-wrap">{item.text}</p>
                                        <button onClick={() => handleDeleteContent(item.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-full flex-shrink-0 ml-2">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !fetchError && <p className="text-center text-sky-400 py-6">لا يوجد محتوى. أضف واحداً لتبدأ.</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ManageContentModal;
