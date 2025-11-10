import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { doc, updateDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { UserProfile } from '../../types.ts';
import { ErrorAlert } from '../ui/Alert.tsx';
import { TargetIcon } from '../ui/Icons.tsx';

interface EmergencyButtonProps {
    user: User;
    userProfile: UserProfile;
    setUserProfile: (profile: UserProfile) => void;
}

const EmergencyButton: React.FC<EmergencyButtonProps> = ({ user, userProfile, setUserProfile }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [countdown, setCountdown] = useState(57);
    const [advice, setAdvice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [emergencyContent, setEmergencyContent] = useState<string[]>([]);

    useEffect(() => {
        const q = query(collection(db, "emergency_content"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const content = snapshot.docs.map(doc => doc.data().text as string);
                setEmergencyContent(content);
            } else {
                setEmergencyContent([]);
            }
        });
        return () => unsubscribe();
    }, []);


    useEffect(() => {
        if (modalOpen && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        fetchAdvice();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [modalOpen, countdown]);

    const fetchAdvice = async () => {
        setIsLoading(true);
        setAdvice('');
        setError('');
        
        try {
            if (emergencyContent.length === 0) {
                setAdvice("لا يوجد محتوى متوفر حالياً. لا تستسلم، فبداية الأشياء دائماً هي الأصعب.");
                setIsLoading(false);
                return;
            }

            const currentIndex = userProfile.emergencyIndex || 0;
            let contentToShow = emergencyContent[currentIndex % emergencyContent.length];
            
            setAdvice(contentToShow);
            
            const nextIndex = currentIndex + 1;
            if (user.isAnonymous) {
                const updatedProfile = { ...userProfile, emergencyIndex: nextIndex };
                setUserProfile(updatedProfile);
            } else {
                await updateDoc(doc(db, "users", user.uid), { emergencyIndex: nextIndex });
            }

        } catch (e) {
            console.error("Error fetching advice or updating index:", e);
            setError("هەڵەیەک ڕوویدا لە وەرگرتنی ئامۆژگاری.");
            setAdvice("لا تستسلم، فبداية الأشياء دائماً هي الأصعب.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpen = () => {
        setModalOpen(true);
        setCountdown(57);
    };
    
    const handleClose = () => {
        setModalOpen(false);
        setAdvice('');
        setIsLoading(false);
        setError('');
    };
    
    return (
        <>
            <button
                onClick={handleOpen}
                className="group w-full p-4 rounded-xl text-white flex items-center justify-between bg-sky-950/50 backdrop-blur-sm border border-sky-700/40 transition-all duration-300 hover:bg-sky-900/70 hover:border-sky-600"
            >
                <div className="text-right">
                    <h3 className="text-lg font-bold text-red-300">!النجدة</h3>
                    <p className="text-sm text-sky-400">أحتاج مساعدة فورية</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-red-500/30 transition-shadow">
                    <TargetIcon className="w-8 h-8" />
                </div>
            </button>
            {modalOpen && (
                <div className="fixed inset-0 bg-sky-950/90 backdrop-blur-lg flex flex-col items-center justify-center z-50 p-4 text-white text-center">
                    {countdown > 0 ? (
                        <div className="flex flex-col items-center justify-center animate-fade-in">
                            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/50 to-indigo-600/50 rounded-full breathing-circle border-4 border-sky-400/30">
                                   <div className="breathing-text-container">
                                        <h2 className="breathing-text inhale">شهيق</h2>
                                        <h2 className="breathing-text hold">وقف</h2>
                                        <h2 className="breathing-text exhale">زفير</h2>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-6xl font-mono font-bold text-shadow">{countdown}</p>
                        </div>
                    ) : (
                        <div className="max-w-md w-full flex-grow flex flex-col items-center justify-start overflow-y-auto pt-8 pb-24 min-h-0">
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-400 mx-auto"></div>
                            ) : error ? (
                                <ErrorAlert message={error} />
                            ) : (
                                <div className="p-2">
                                    <p className="text-2xl font-semibold leading-relaxed text-shadow mb-2">"</p>
                                    <p className="text-2xl font-semibold leading-relaxed text-shadow whitespace-pre-wrap">{advice}</p>
                                    <p className="text-2xl font-semibold leading-relaxed text-shadow mt-2">"</p>
                                </div>
                            )}
                        </div>
                    )}
                    <button onClick={handleClose} className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 font-semibold rounded-lg transition-all duration-300 ease-in-out shadow-lg border border-white/20 focus:outline-none bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-gray-500">
                        إغلاق
                    </button>
                </div>
            )}
        </>
    );
};

export default EmergencyButton;