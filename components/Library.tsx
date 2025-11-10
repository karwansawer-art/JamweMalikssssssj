import React, { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase.ts';
import type { Book, LibraryCategory } from '../types.ts';
import { PlusIcon, TrashIcon, EditIcon, SettingsIcon, SearchIcon } from './ui/Icons.tsx';
import EditBookModal from './library/AddBookModal.tsx';
import ManageCategoriesModal from './library/ManageCategoriesModal.tsx';

interface LibraryProps {
    user: User;
    isDeveloper: boolean;
}

const Library: React.FC<LibraryProps> = ({ user, isDeveloper }) => {
    const [books, setBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<LibraryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
    const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
    const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

    useEffect(() => {
        const booksQuery = query(collection(db, 'library'), orderBy('createdAt', 'asc'));
        const unsubscribeBooks = onSnapshot(booksQuery, (snapshot) => {
            const fetchedBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
            setBooks(fetchedBooks);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching books:", error);
            setLoading(false);
        });

        const categoriesQuery = query(collection(db, 'library_categories'), orderBy('createdAt', 'asc'));
        const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
            const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryCategory));
            setCategories(fetchedCategories);
        });

        return () => {
            unsubscribeBooks();
            unsubscribeCategories();
        };
    }, []);

    const handleAddClick = () => {
        setBookToEdit(null);
        setShowEditModal(true);
    };

    const handleEditClick = (book: Book) => {
        setBookToEdit(book);
        setShowEditModal(true);
    };

    const confirmDeleteBook = async () => {
        if (bookToDelete) {
            try {
                await deleteDoc(doc(db, 'library', bookToDelete.id));
            } catch (error) {
                console.error("Error deleting book:", error);
            } finally {
                setBookToDelete(null);
            }
        }
    };

    const filteredBooks = useMemo(() => {
        let booksToShow = books;

        if (selectedCategoryId !== 'all') {
            booksToShow = booksToShow.filter(book => book.categoryId === selectedCategoryId);
        }

        if (searchTerm.trim() !== '') {
            const lowercasedTerm = searchTerm.toLowerCase();
            booksToShow = booksToShow.filter(book =>
                book.title.toLowerCase().includes(lowercasedTerm) ||
                (book.description && book.description.toLowerCase().includes(lowercasedTerm))
            );
        }

        return booksToShow;
    }, [books, selectedCategoryId, searchTerm]);

    return (
        <div className="text-white pb-20">
            <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-sm z-10 flex justify-between items-center p-4 bg-sky-950/80 backdrop-blur-sm">
                {isDeveloper ? <div className="w-10"></div> : <div/>}
                <h1 className="text-2xl font-bold text-white text-shadow">المكتبة</h1>
                {isDeveloper && (
                    <button onClick={() => setShowManageCategoriesModal(true)} className="p-2 rounded-full hover:bg-white/10" aria-label="إدارة الأقسام">
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                )}
            </header>

            <div className="pt-20 px-4">
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="ابحث عن كتاب..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-sky-800/60 border border-sky-700 rounded-full py-2 pr-10 pl-4 text-white placeholder-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-sky-400" />
                    </div>
                </div>
                <div className="flex space-x-2 overflow-x-auto pb-4 -mx-4 px-4" dir="rtl">
                    <button
                        onClick={() => setSelectedCategoryId('all')}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${selectedCategoryId === 'all' ? 'bg-sky-500 text-white' : 'bg-sky-800/60 text-sky-300 hover:bg-sky-700/60'}`}
                    >
                        الكل
                    </button>
                    {categories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategoryId(category.id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${selectedCategoryId === category.id ? 'bg-sky-500 text-white' : 'bg-sky-800/60 text-sky-300 hover:bg-sky-700/60'}`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>
            
            <main className="grid grid-cols-2 gap-4 p-4">
                {loading ? (
                    <p className="col-span-2 text-center text-sky-300 py-10">جارِ تحميل الكتب...</p>
                ) : filteredBooks.length > 0 ? (
                    filteredBooks.map(book => (
                        <div key={book.id} className="group relative bg-sky-900/40 rounded-lg overflow-hidden border border-sky-700/50 shadow-lg flex flex-col">
                            <a href={book.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={book.coverUrl} alt={book.title} className="w-full aspect-[3/4] object-cover transition-transform duration-300 group-hover:scale-105" />
                            </a>
                            <div className="p-3 flex flex-col flex-grow">
                                <h3 className="font-bold text-sm text-sky-200 truncate text-center">{book.title}</h3>
                                <div className="flex justify-around items-center mt-auto pt-2">
                                    <a href={book.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold bg-sky-600/80 hover:bg-sky-500/80 px-4 py-1 rounded-full transition-colors text-center">
                                        عرض
                                    </a>
                                     <a href={book.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold bg-teal-600/80 hover:bg-teal-500/80 px-4 py-1 rounded-full transition-colors text-center">
                                        تحميل
                                    </a>
                                </div>
                            </div>
                            {isDeveloper && (
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditClick(book)} className="p-2 bg-yellow-600/80 hover:bg-yellow-500 rounded-full">
                                        <EditIcon className="w-5 h-5 text-white" />
                                    </button>
                                    <button onClick={() => setBookToDelete(book)} className="p-2 bg-red-600/80 hover:bg-red-500 rounded-full">
                                        <TrashIcon className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-16 px-4">
                        <h3 className="mt-4 text-xl font-semibold text-sky-300">لم يتم العثور على كتب</h3>
                        <p className="mt-2 text-sky-400">حاول تغيير الفئة أو مصطلح البحث.</p>
                    </div>
                )}
            </main>

            {isDeveloper && (
                <button 
                    onClick={handleAddClick} 
                    className="fixed z-40 left-6 bottom-20 w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-lg hover:scale-110 transition-transform duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950/50 focus:ring-teal-400" 
                    aria-label="إضافة كتاب جديد"
                >
                    <PlusIcon className="w-8 h-8" />
                </button>
            )}

            {showEditModal && <EditBookModal onClose={() => setShowEditModal(false)} user={user} bookToEdit={bookToEdit} categories={categories} />}
            {showManageCategoriesModal && <ManageCategoriesModal onClose={() => setShowManageCategoriesModal(false)} />}
            
            {bookToDelete && (
                 <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                    <div className="w-full max-w-sm bg-sky-950 border border-red-500/50 rounded-lg p-6 space-y-4 text-white">
                        <h3 className="text-xl font-bold text-red-400 text-center">تأكيد الحذف</h3>
                        <p className="text-sky-200 text-center">هل أنت متأكد من رغبتك في حذف كتاب "{bookToDelete.title}"؟</p>
                        <div className="flex justify-center gap-4 pt-4">
                            <button onClick={() => setBookToDelete(null)} className="px-6 py-2 font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-500">إلغاء</button>
                            <button onClick={confirmDeleteBook} className="px-6 py-2 font-semibold text-white rounded-md bg-red-600 hover:bg-red-500">حذف</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Library;