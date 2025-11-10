import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { LibraryCategory } from '../../types.ts';
import { CloseIcon, TrashIcon, Spinner } from '../ui/Icons.tsx';

interface ManageCategoriesModalProps {
    onClose: () => void;
}

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({ onClose }) => {
    const [categories, setCategories] = useState<LibraryCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'library_categories'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryCategory));
            setCategories(fetchedCategories);
        });
        return () => unsubscribe();
    }, []);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            setError("الاسم لا يمكن أن يكون فارغًا.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            await addDoc(collection(db, 'library_categories'), {
                name: newCategoryName,
                createdAt: serverTimestamp(),
            });
            setNewCategoryName('');
        } catch (err) {
            console.error("Error adding category:", err);
            setError("حدث خطأ.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        // Note: This doesn't handle books within the category. You might want to add logic
        // to either delete them, un-categorize them, or prevent deletion if not empty.
        try {
            await deleteDoc(doc(db, 'library_categories', categoryId));
        } catch (err) {
            console.error("Error deleting category:", err);
            setError("حدث خطأ أثناء الحذف.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col h-[70vh]">
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-200">إدارة الأقسام</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 space-y-4 overflow-y-auto flex-grow">
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div className="space-y-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-2 bg-sky-800/50 rounded-lg">
                                <span className="font-semibold">{cat.name}</span>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-full">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </main>
                <footer className="p-4 border-t border-sky-400/30 flex-shrink-0 space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="اسم القسم الجديد"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            className="w-full bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button onClick={handleAddCategory} disabled={loading} className="px-4 py-2 font-semibold text-white rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50">
                            {loading ? <Spinner className="w-5 h-5" /> : 'إضافة'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ManageCategoriesModal;
