import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { FreedomModelAudio } from '../../types.ts';
import { CloseIcon, HeadphonesIcon, PlayIcon, PauseIcon, TrashIcon, PlusIcon, Spinner, EditIcon } from '../ui/Icons.tsx';

declare const uploadcare: any;

interface FreedomModelProgramProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    isDeveloper: boolean;
}

interface UploadAudioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, textContent: string, audioUrl: string) => void;
    loading: boolean;
    error: string;
    audioToEdit: FreedomModelAudio | null;
}

const UploadAudioModal: React.FC<UploadAudioModalProps> = ({ isOpen, onClose, onSave, loading, error, audioToEdit }) => {
    const [audioTitle, setAudioTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState('');
    
    useEffect(() => {
        if (!isOpen) return;

        setAudioTitle(audioToEdit?.title || '');
        setTextContent(audioToEdit?.textContent || '');
        setAudioUrl(audioToEdit?.audioUrl || null);
        setUploadError('');

        const audioWidget = uploadcare.Widget('#audio-uploader');
        audioWidget.onUploadComplete((fileInfo: any) => {
            setAudioUrl(String(fileInfo.cdnUrl));
        });
        
        if (audioToEdit?.audioUrl) {
            audioWidget.value(audioToEdit.audioUrl);
        } else {
            audioWidget.value(null);
        }

        return () => {
            audioWidget.onUploadComplete(() => {});
        };
    }, [isOpen, audioToEdit]);

    const handleSaveClick = () => {
        if (!audioTitle.trim()) {
            setUploadError("الرجاء إدخال عنوان للملف الصوتي.");
            return;
        }
        if (!textContent.trim()) {
            setUploadError("الرجاء إدخال محتوى نصي للملف الصوتي.");
            return;
        }
        if (!audioUrl) {
            setUploadError("الرجاء رفع ملف صوتي.");
            return;
        }
        onSave(audioTitle, textContent, audioUrl);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
            <div className="w-full max-w-sm bg-sky-950 border border-sky-500/50 rounded-lg p-6 space-y-4 text-white">
                <h3 className="text-xl font-bold text-sky-300 text-center">{audioToEdit ? 'تعديل الملف الصوتي' : 'رفع ملف صوتي جديد'}</h3>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                {uploadError && <p className="text-red-400 text-sm text-center">{uploadError}</p>}
                
                <input
                    type="text"
                    placeholder="عنوان الملف الصوتي"
                    value={audioTitle}
                    onChange={(e) => setAudioTitle(e.target.value)}
                    className="w-full bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <textarea
                    placeholder="محتوى النص للملف الصوتي"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full h-32 bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                
                <div>
                    <label className="block text-sky-200 mb-2 font-semibold">الملف الصوتي</label>
                    <input type="hidden" role="uploadcare-uploader" id="audio-uploader" data-multiple="false" data-file-types="audio/*" />
                    {audioUrl && <p className="text-green-400 text-sm mt-2">تم رفع الملف بنجاح: {audioUrl.substring(0, 30)}...</p>}
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-6 py-2 font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-500">إلغاء</button>
                    <button onClick={handleSaveClick} disabled={loading} className="px-6 py-2 font-semibold text-white rounded-md bg-teal-600 hover:bg-teal-500 disabled:opacity-50">
                        {loading ? <Spinner className="w-5 h-5" /> : (audioToEdit ? 'حفظ التعديلات' : 'حفظ')}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface DeleteAudioConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
    audioTitle: string;
}

const DeleteAudioConfirmModal: React.FC<DeleteAudioConfirmModalProps> = ({ isOpen, onConfirm, onClose, audioTitle }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4">
            <div className="w-full max-w-sm bg-sky-950 border border-red-500/50 rounded-lg p-6 space-y-4 text-white">
                <h3 className="text-xl font-bold text-red-400 text-center">تأكيد الحذف</h3>
                <p className="text-sky-200 text-center">هل أنت متأكد من رغبتك في حذف الملف الصوتي "{audioTitle}"؟</p>
                <div className="flex justify-center gap-4 pt-4">
                    <button onClick={onClose} className="px-6 py-2 font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-500">إلغاء</button>
                    <button onClick={onConfirm} className="px-6 py-2 font-semibold text-white rounded-md bg-red-600 hover:bg-red-500">حذف</button>
                </div>
            </div>
        </div>
    );
};

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};


const FreedomModelProgram: React.FC<FreedomModelProgramProps> = ({ isOpen, onClose, user, isDeveloper }) => {
    const [audioFiles, setAudioFiles] = useState<FreedomModelAudio[]>([]);
    const [loadingAudios, setLoadingAudios] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [audioToDelete, setAudioToDelete] = useState<FreedomModelAudio | null>(null);
    const [audioToEdit, setAudioToEdit] = useState<FreedomModelAudio | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [selectedAudioFile, setSelectedAudioFile] = useState<FreedomModelAudio | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.preload = 'auto';
        }
        const audio = audioRef.current;

        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            setCurrentTime(audio.currentTime);
            if (isPlaying) {
                audio.play().catch(e => console.error("Error playing audio after metadata loaded:", e));
            }
        };
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
        };
    }, []); 


    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (selectedAudioFile && audio.src !== selectedAudioFile.audioUrl) {
            audio.src = selectedAudioFile.audioUrl;
            audio.load();
        } else if (!selectedAudioFile) {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';
            audio.load();
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            return;
        }

        if (isPlaying && audio.paused) {
            audio.play().catch(e => {
                console.error("Error attempting to play audio (manual toggle or initial play):", e);
                setIsPlaying(false);
            });
        } else if (!isPlaying && !audio.paused) {
            audio.pause();
        }

    }, [selectedAudioFile, isPlaying]);


    const resetAudioPlayerState = useCallback(() => {
        setSelectedAudioFile(null);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            resetAudioPlayerState();
            return;
        }

        setLoadingAudios(true);
        const q = query(collection(db, 'freedom_model_audio'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAudios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FreedomModelAudio));
            setAudioFiles(fetchedAudios);
            setLoadingAudios(false);
        }, (error) => {
            console.error("Error fetching audio files:", error);
            setLoadingAudios(false);
        });
        return () => unsubscribe();
    }, [isOpen, resetAudioPlayerState]);


    const handlePlayPause = (audioFile: FreedomModelAudio) => {
        if (selectedAudioFile?.id === audioFile.id) {
            setIsPlaying(prev => !prev);
        } else {
            setSelectedAudioFile(audioFile);
            setIsPlaying(true);
        }
    };

    const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
        if (audioRef.current && duration > 0) {
            const progressBar = event.currentTarget;
            const clickPosition = event.clientX - progressBar.getBoundingClientRect().left;
            const percentage = clickPosition / progressBar.offsetWidth;
            audioRef.current.currentTime = duration * percentage;
        }
    };
    
    const handleSaveAudio = async (title: string, textContent: string, audioUrl: string) => {
        setUploadingAudio(true);
        setUploadError('');
        try {
            if (audioToEdit) {
                const audioDocRef = doc(db, 'freedom_model_audio', audioToEdit.id);
                await updateDoc(audioDocRef, { title, textContent, audioUrl });
            } else {
                await addDoc(collection(db, 'freedom_model_audio'), {
                    title,
                    textContent,
                    audioUrl,
                    uploaderUid: user.uid,
                    createdAt: serverTimestamp(),
                });
            }
            setShowUploadModal(false);
            setUploadError('');
        } catch (err) {
            console.error("Error saving audio file:", err);
            setUploadError("حدث خطأ أثناء حفظ الملف الصوتي.");
        } finally {
            setUploadingAudio(false);
        }
    };

    const handleDeleteAudio = async () => {
        if (audioToDelete) {
            try {
                if (selectedAudioFile?.id === audioToDelete.id) {
                    setSelectedAudioFile(null);
                }
                await deleteDoc(doc(db, 'freedom_model_audio', audioToDelete.id));
            } catch (error) {
                console.error("Error deleting audio file:", error);
            } finally {
                setAudioToDelete(null);
            }
        }
    };

    const handleAddClick = () => {
        setAudioToEdit(null);
        setShowUploadModal(true);
    };

    const handleEditClick = (audio: FreedomModelAudio) => {
        setAudioToEdit(audio);
        setShowUploadModal(true);
    };

    if (!isOpen) return null;

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col h-[90vh]">
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-200 text-shadow">برنامج نموذج الحرية</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="إغلاق">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-grow overflow-y-auto p-6 space-y-6">
                    <div className="bg-sky-900/50 p-4 rounded-lg border border-sky-700/50 text-white text-center animate-fade-in">
                        <p className="text-lg font-semibold leading-relaxed mb-4">
                            كثير يسألونني: كيف تعافيت؟ الجواب بفضل الله ثم في برنامج نموذج الحرية سجلته من 12 حلقة، خلاصة رحلتي وطريقتي الخاصة في التحرر من الإباحية والعادة السرية.
                        </p>
                        <p className="text-lg font-semibold leading-relaxed mb-4">
                            أزعم أن من يطبقها بصدق قلبٍ وإرادةٍ حقيقية سيبلغ التعافي بإذن الله. 💪
                        </p>
                        <p className="text-lg font-bold text-yellow-300 mb-4">
                            🔥 برنامج سيغيّر نظرتك للإدمان وللحياة كلها.
                        </p>
                        <p className="text-lg font-bold text-teal-300">
                            ابدأ من الآن، فالحرية تنتظرك. 🚀
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-sky-200">الملفات الصوتية</h3>
                        {isDeveloper && (
                            <button
                                onClick={handleAddClick}
                                className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 px-4 rounded-lg transition-colors bg-teal-600 hover:bg-teal-500 disabled:opacity-50"
                                aria-label="رفع ملف صوتي جديد"
                            >
                                <PlusIcon className="w-6 h-6" />
                                <span>رفع ملف صوتي جديد</span>
                            </button>
                        )}
                        {loadingAudios ? (
                            <p className="text-center text-sky-300 py-10">جارِ تحميل الملفات الصوتية...</p>
                        ) : audioFiles.length > 0 ? (
                            <ul className="space-y-3">
                                {audioFiles.map(audio => (
                                    <li
                                        key={audio.id}
                                        className={`flex flex-col p-3 rounded-lg border transition-colors cursor-pointer
                                                    ${selectedAudioFile?.id === audio.id
                                                        ? 'bg-sky-700/70 border-sky-400 shadow-md'
                                                        : 'bg-sky-800/50 border-sky-700/50 hover:bg-sky-700/60'
                                                    }`}
                                        onClick={() => setSelectedAudioFile(audio)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-grow min-w-0">
                                                <HeadphonesIcon className="w-6 h-6 text-sky-300 flex-shrink-0" />
                                                <p className="font-semibold text-sky-200 truncate">{audio.title}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {isDeveloper && (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditClick(audio); }}
                                                            className="p-2 rounded-full text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                                                            aria-label={`تعديل ${audio.title}`}
                                                        >
                                                            <EditIcon className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setAudioToDelete(audio); }}
                                                            className="p-2 rounded-full text-red-400 hover:bg-red-500/20 transition-colors"
                                                            aria-label={`حذف ${audio.title}`}
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-sky-400 py-10">لا توجد ملفات صوتية بعد.</p>
                        )}
                    </div>

                    {selectedAudioFile && (
                        <div className="bg-sky-900/50 p-4 rounded-lg border border-sky-700/50 space-y-4 animate-fade-in">
                            <h3 className="text-xl font-bold text-sky-200">{selectedAudioFile.title}</h3>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handlePlayPause(selectedAudioFile)}
                                    className={`p-3 rounded-full transition-colors flex-shrink-0 ${
                                        isPlaying ? 'bg-red-500 hover:bg-red-400' : 'bg-sky-600 hover:bg-sky-500'
                                    }`}
                                    aria-label={isPlaying ? `إيقاف ${selectedAudioFile.title}` : `تشغيل ${selectedAudioFile.title}`}
                                >
                                    {isPlaying ? <PauseIcon className="w-6 h-6 text-white" /> : <PlayIcon className="w-6 h-6 text-white" />}
                                </button>
                                <div className="flex-grow">
                                    <div
                                        className="w-full h-2 bg-sky-700 rounded-full cursor-pointer overflow-hidden"
                                        onClick={handleSeek}
                                        aria-label="شريط التقدم"
                                        role="progressbar"
                                        aria-valuenow={progressPercentage}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                    >
                                        <div
                                            className="h-full bg-teal-400 rounded-full transition-all duration-100 ease-linear"
                                            style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-sky-400 mt-1">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sky-300 whitespace-pre-wrap break-words">{selectedAudioFile.textContent}</p>
                        </div>
                    )}
                </main>
            </div>
            <UploadAudioModal 
                isOpen={showUploadModal}
                onClose={() => {
                    setShowUploadModal(false);
                    setAudioToEdit(null);
                }}
                onSave={handleSaveAudio}
                loading={uploadingAudio}
                error={uploadError}
                audioToEdit={audioToEdit}
            />
            {audioToDelete && (
                <DeleteAudioConfirmModal
                    isOpen={!!audioToDelete}
                    onConfirm={handleDeleteAudio}
                    onClose={() => setAudioToDelete(null)}
                    audioTitle={audioToDelete.title}
                />
            )}
        </div>
    );
};

export default FreedomModelProgram;