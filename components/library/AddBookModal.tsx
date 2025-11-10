import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { Book, LibraryCategory } from '../../types.ts';
import { CloseIcon, Spinner } from '../ui/Icons.tsx';

declare const uploadcare: any;

interface EditBookModalProps {
    onClose: () => void;
    user: User;
    bookToEdit: Book | null;
    categories: LibraryCategory[];
}

const EditBookModal: React.FC<EditBookModalProps> = ({ onClose, user, bookToEdit, categories }) => {
    const [title, setTitle] = useState(bookToEdit?.title || '');
    const [description, setDescription] = useState(bookToEdit?.description || '');
    const [coverUrl, setCoverUrl] = useState<string | null>(bookToEdit?.coverUrl || null);
    const [fileUrl, setFileUrl] = useState<string | null>(bookToEdit?.fileUrl || null);
    const [categoryId, setCategoryId] = useState(bookToEdit?.categoryId || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const coverWidget = uploadcare.Widget('#cover-uploader');
        coverWidget.onUploadComplete((fileInfo: any) => {
            setCoverUrl(String(fileInfo.cdnUrl));
        });
        if (bookToEdit?.coverUrl) {
            coverWidget.value(bookToEdit.coverUrl);
        } else {
            coverWidget.value(null);
        }
    }, [bookToEdit]);

    const handleSave = async () => {
        if (!title.trim()) { setError("الرجاء إدخال عنوان الكتاب."); return; }
        if (!coverUrl) { setError("الرجاء رفع صورة غلاف."); return; }
        if (!fileUrl) { setError("الرجاء إدخال رابط تحميل الكتاب."); return; }
        if (!categoryId) { setError("الرجاء اختيار قسمًا."); return; }
        
        setError('');
        setLoading(true);

        const bookData = {
            title,
            description,
            coverUrl,
            fileUrl,
            categoryId,
            uploaderUid: user.uid,
            createdAt: bookToEdit?.createdAt || serverTimestamp(),
        };

        try {
            if (bookToEdit) {
                await updateDoc(doc(db, 'library', bookToEdit.id), bookData);
            } else {
                await addDoc(collection(db, 'library'), bookData);
            }
            onClose();
        } catch (err) {
            console.error("Error saving book:", err);
            setError("حدث خطأ أثناء حفظ الكتاب.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col h-[90vh]">
                 <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-200">{bookToEdit ? 'تعديل الكتاب' : 'إضافة كتاب جديد'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 space-y-4 overflow-y-auto">
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    
                    <input 
                        type="text" 
                        placeholder="عنوان الكتاب" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                     <textarea 
                        placeholder="وصف الكتاب (اختياري)" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full h-24 bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full bg-sky-800/60 border border-sky-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        <option value="" disabled>اختر قسمًا</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <div>
                        <label className="block text-sky-200 mb-2 font-semibold">غلاف الكتاب</label>
                        <input type="hidden" role="uploadcare-uploader" id="cover-uploader" data-images-only data-crop="1:1.4" />
                        {coverUrl && <img src={coverUrl} alt="Cover preview" className="mt-2 w-32 rounded-md" />}
                    </div>

                     <div>
                        <label htmlFor="file-url-input" className="block text-sky-200 mb-2 font-semibold">رابط تحميل الكتاب (MediaFire)</label>
                        <input
                            id="file-url-input"
                            type="url"
                            placeholder="https://www.mediafire.com/file/..."
                            value={fileUrl || ''}
                            onChange={(e) => setFileUrl(e.target.value)}
                            className="w-full bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                </main>
                 <footer className="p-4 border-t border-sky-400/30 flex-shrink-0">
                    <button onClick={handleSave} disabled={loading} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-teal-600 hover:bg-teal-500 disabled:opacity-50">
                        {loading ? <Spinner className="w-6 h-6 mx-auto" /> : 'حفظ'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default EditBookModal;