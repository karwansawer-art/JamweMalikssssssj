import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { Notification } from '../../types.ts';
import { CloseIcon, PlusIcon, TrashIcon, EditIcon } from '../ui/Icons.tsx';
import { ErrorAlert } from '../ui/Alert.tsx';

const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "الآن";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `قبل ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `قبل ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `قبل ${days} يوم`;
    const months = Math.floor(days / 30);
    return months < 12 ? `قبل ${months} شهر` : `قبل ${Math.floor(months / 12)} سنة`;
};

const DeleteNotificationModal: React.FC<{ onConfirm: () => void; onClose: () => void; }> = ({ onConfirm, onClose }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="w-full max-w-sm bg-sky-950 border border-red-500/50 rounded-lg p-6 space-y-4 text-white">
            <h3 className="text-xl font-bold text-red-400 text-center">تأكيد حذف الإشعار</h3>
            <p className="text-sky-200 text-center">هل أنت متأكد من رغبتك في حذف هذا الإشعار بشكل دائم؟</p>
            <div className="flex justify-center gap-4 pt-4">
                <button onClick={onClose} className="px-6 py-2 font-semibold text-white rounded-md transition-all duration-300 ease-in-out shadow-md border border-white/20 focus:outline-none bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-gray-500">إلغاء</button>
                <button onClick={onConfirm} className="px-6 py-2 font-semibold text-white rounded-md transition-all duration-300 ease-in-out shadow-md border border-white/20 focus:outline-none bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-red-500">حذف</button>
            </div>
        </div>
    </div>
);


interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDeveloper: boolean;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, isDeveloper }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setShowForm(false);
            setEditingNotification(null);
            setError('');
            setTitle('');
            setMessage('');
            return;
        };

        const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(fetchedNotifications);
        }, (error) => {
            console.error("Error fetching notifications:", error);
        });

        return () => unsubscribe();
    }, [isOpen]);

    const handleNewClick = () => {
        setEditingNotification(null);
        setTitle('');
        setMessage('');
        setShowForm(true);
    };

    const handleEditClick = (notification: Notification) => {
        setEditingNotification(notification);
        setTitle(notification.title);
        setMessage(notification.message);
        setShowForm(true);
    };
    
    const handleBackToList = () => {
        setShowForm(false);
        setEditingNotification(null);
        setError('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            setError("يجب ملء حقل العنوان والرسالة.");
            return;
        }

        setLoading(true);
        setError('');
        try {
            if (editingNotification) {
                await updateDoc(doc(db, 'notifications', editingNotification.id), { title, message });
            } else {
                await addDoc(collection(db, 'notifications'), {
                    title,
                    message,
                    timestamp: serverTimestamp()
                });
            }
            handleBackToList();
        } catch (error) {
            console.error("Error saving notification:", error);
            setError("حدث خطأ أثناء حفظ الإشعار.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleDelete = async () => {
        if (notificationToDelete) {
            setLoading(true);
            try {
                await deleteDoc(doc(db, 'notifications', notificationToDelete.id));
                setNotificationToDelete(null);
            } catch (error) {
                 console.error("Error deleting notification:", error);
                 setError("حدث خطأ أثناء حذف الإشعار.");
            } finally {
                setLoading(false);
            }
        }
    };


    if (!isOpen) return null;

    const listContent = (
        <div className="p-4 space-y-4">
            {isDeveloper && (
                <button onClick={handleNewClick} className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg border border-white/20 focus:outline-none bg-gradient-to-br from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 hover:shadow-xl hover:scale-105 active:scale-95 active:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-900/50 focus:ring-teal-400">
                    <PlusIcon className="w-6 h-6" />
                    <span>إشعار جديد</span>
                </button>
            )}
            {notifications.length > 0 ? notifications.map(notif => (
                <div key={notif.id} className="bg-sky-900/50 p-4 rounded-lg border border-sky-400/20">
                     <div className="flex justify-between items-start gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-sky-200">{notif.title}</h3>
                            <p className="text-sm text-sky-400 mt-1 mb-2 whitespace-pre-wrap">{notif.message}</p>
                            <p className="text-xs text-sky-500">{notif.timestamp ? formatTimeAgo(notif.timestamp.toDate()) : '...'}</p>
                        </div>
                        {isDeveloper && (
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => handleEditClick(notif)} className="p-2 text-yellow-300 hover:text-yellow-100 hover:bg-white/10 rounded-full transition-colors">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => setNotificationToDelete(notif)} className="p-2 text-red-400 hover:text-red-200 hover:bg-white/10 rounded-full transition-colors">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )) : <p className="text-center text-sky-400 py-8">لا توجد إشعارات حالياً.</p>}
        </div>
    );
    
    const formContent = (
         <form onSubmit={handleSave} className="p-6 space-y-6">
            {error && <ErrorAlert message={error} />}
            <div className="relative z-0">
                <input id="notif_title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="block py-2.5 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-sky-400/30 appearance-none focus:outline-none focus:ring-0 focus:border-sky-300 peer" placeholder=" " required/>
                <label htmlFor="notif_title" className="absolute text-lg text-sky-200 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[100%] peer-focus:origin-[100%] peer-focus:right-0 peer-focus:text-sky-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">العنوان</label>
            </div>
            <div className="relative z-0">
                <textarea id="notif_message" value={message} onChange={(e) => setMessage(e.target.value)} className="block py-2.5 px-0 w-full h-32 text-lg text-white bg-transparent border-0 border-b-2 border-sky-400/30 appearance-none focus:outline-none focus:ring-0 focus:border-sky-300 peer" placeholder=" " required />
                <label htmlFor="notif_message" className="absolute text-lg text-sky-200 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[100%] peer-focus:origin-[100%] peer-focus:right-0 peer-focus:text-sky-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">الرسالة</label>
            </div>
             <div className="flex justify-end gap-4 pt-4">
                 <button type="button" onClick={handleBackToList} className="px-4 py-2 font-semibold text-white rounded-md transition-all duration-300 ease-in-out shadow-md border border-white/20 focus:outline-none bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-gray-500">إلغاء</button>
                 <button type="submit" disabled={loading} className="px-4 py-2 font-semibold text-white rounded-md transition-all duration-300 ease-in-out shadow-md border border-white/20 focus:outline-none bg-gradient-to-br from-sky-600 to-sky-800 hover:from-sky-500 hover:to-sky-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed">
                     {loading ? 'جارِ الحفظ...' : 'حفظ'}
                 </button>
            </div>
        </form>
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="w-full h-full max-w-md bg-sky-950/90 text-white flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-200 text-shadow">{showForm ? (editingNotification ? 'تعديل الإشعار' : 'إشعار جديد') : 'الإشعارات'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-grow overflow-y-auto">
                    {showForm ? formContent : listContent}
                </main>
            </div>
            {notificationToDelete && <DeleteNotificationModal onConfirm={handleDelete} onClose={() => setNotificationToDelete(null)} />}
        </div>
    );
};

export default NotificationsModal;