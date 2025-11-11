import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { doc, updateDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { UserProfile } from '../../types.ts';
import { ScrollTextIcon } from '../ui/Icons.tsx';
import { ErrorAlert } from '../ui/Alert.tsx';

interface FaithDoseButtonProps {
    user: User;
    userProfile: UserProfile;
}

const FaithDoseButton: React.FC<FaithDoseButtonProps> = ({ user, userProfile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [story, setStory] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isThrottled, setIsThrottled] = useState(false);
    const [storiesContent, setStoriesContent] = useState<string[]>([]);

    useEffect(() => {
        const q = query(collection(db, "stories_content"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const content = snapshot.docs.map(doc => doc.data().text as string);
                setStoriesContent(content);
            } else {
                setStoriesContent([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const getNewStory = async () => {
        setIsLoading(true);
        setError('');
        setStory('');

        try {
            if (storiesContent.length === 0) {
                setStory("لا يوجد محتوى متوفر حالياً.");
                return;
            }

            const currentIndex = userProfile.storyIndex || 0;
            let contentToShow = storiesContent[currentIndex % storiesContent.length];
            
            setStory(contentToShow);
            
            const nextIndex = currentIndex + 1;
            await updateDoc(doc(db, "users", user.uid), { storyIndex: nextIndex });
        } catch (e) {
            console.error("Error fetching story or updating index:", e);
            setError("هەڵەیەک ڕوویدا لە وەرگرتنی چیرۆک.");
        } finally {
            setIsLoading(false);
        }
    };

    const getAnotherStoryWithDelay = () => {
        if (isThrottled || isLoading) return;

        setIsThrottled(true);
        setIsLoading(true);
        setStory('');

        setTimeout(() => {
            getNewStory();
            setIsThrottled(false);
        }, 4000);
    };

    const handleOpen = () => {
        setIsOpen(true);
        getNewStory();
    };

    const handleClose = () => {
        setIsOpen(false);
        setStory('');
        setError('');
        setIsThrottled(false);
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="group w-full p-4 rounded-xl text-white flex items-center justify-between bg-sky-950/50 backdrop-blur-sm border border-sky-700/40 transition-all duration-300 hover:bg-sky-900/70 hover:border-sky-600"
            >
                <div className="text-right">
                    <h3 className="text-lg font-bold text-teal-300">جرعة إيمانية</h3>
                    <p className="text-sm text-sky-400">قصص السلف الصالح</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg group-hover:shadow-teal-500/30 transition-shadow">
                    <ScrollTextIcon className="w-8 h-8" />
                </div>
            </button>
            {isOpen && (
                 <div className="fixed inset-0 bg-sky-950/90 backdrop-blur-lg flex flex-col items-center justify-center z-50 p-4 text-white text-center">
                    <div className="max-w-md w-full flex-grow flex flex-col items-center justify-start overflow-y-auto py-8 min-h-0">
                        {isLoading && <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-400 mx-auto"></div>}
                        {error && <ErrorAlert message={error} />}
                        {!isLoading && story && <p className="text-xl font-semibold leading-relaxed text-shadow whitespace-pre-wrap">{story}</p>}
                    </div>
                    <div className="w-full max-w-sm flex flex-col gap-4 pb-10 flex-shrink-0">
                        <button onClick={getAnotherStoryWithDelay} disabled={isLoading || isThrottled} className="w-full px-8 py-3 font-semibold rounded-lg transition-all duration-300 ease-in-out shadow-lg border border-white/20 focus:outline-none bg-gradient-to-br from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                            أبغى قصة ثانية
                        </button>
                        <button onClick={handleClose} className="w-full px-8 py-3 font-semibold rounded-lg transition-all duration-300 ease-in-out shadow-lg border border-white/20 focus:outline-none bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-gray-500">
                            إغلاق
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default FaithDoseButton;
