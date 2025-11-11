import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../services/firebase.ts';
import type { UserProfile } from '../types.ts';
import { ErrorAlert } from './ui/Alert.tsx';
import { CameraIcon, LogoutIcon, TrashIcon, ShieldCheckIcon, BlockIcon, CloseIcon, InfoIcon, EditIcon, QuoteIcon, TargetIcon, LightningBoltIcon, BookOpenIcon } from './ui/Icons.tsx';
import SetPinModal from './modals/SetPinModal.tsx';
import BlockedUsers from './settings/BlockedUsers.tsx';
import { getErrorMessage } from '../constants.tsx';
import ManageContentModal from './settings/ManageQuotesModal.tsx';
import AvatarPickerModal from './ui/AvatarPickerModal.tsx';

// Helper components for new structured layout
const SettingsGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="px-4 pb-2 text-sm font-semibold text-sky-400">{title}</h3>
        <div className="bg-sky-900/30 rounded-lg">
            {children}
        </div>
    </div>
);

const SettingsItem: React.FC<{
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
    isDanger?: boolean;
    children?: React.ReactNode;
}> = ({ icon: Icon, label, onClick, isDanger = false, children }) => {
    const itemClasses = `flex justify-between items-center w-full p-4 ${isDanger ? 'text-red-300' : 'text-sky-200'}`;
    const wrapperClasses = "w-full text-right transition-colors duration-200 hover:bg-sky-800/50 first:rounded-t-lg last:rounded-b-lg";

    const content = (
        <div className={itemClasses}>
            <div className="flex items-center gap-4">
                <Icon className={`w-6 h-6 ${isDanger ? 'text-red-400' : 'text-sky-300'}`} />
                <span>{label}</span>
            </div>
            {children ? children : (onClick && <span className="text-sky-400 text-xl transform -scale-x-100">›</span>)}
        </div>
    );

    return onClick ? (
        <button onClick={onClick} className={wrapperClasses}>
            {content}
        </button>
    ) : (
        <div className={wrapperClasses}>{content}</div>
    );
};


// Modals
const EditProfileModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User;
    showAlert: (message: string, type: 'success' | 'error') => void;
}> = ({ isOpen, onClose, user, showAlert }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [photoURL, setPhotoURL] = useState<string | null>(user.photoURL || null);
    const [loading, setLoading] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    useEffect(() => {
      if (isOpen) {
        setDisplayName(user.displayName || '');
        setPhotoURL(user.photoURL || null);
      }
    }, [isOpen, user]);

    const handleProfileUpdate = async () => {
        if (displayName === (user.displayName || '') && photoURL === (user.photoURL || null)) {
            onClose();
            return;
        }
        
        setLoading(true);
        try {
            await updateProfile(user, { displayName, photoURL });
            await updateDoc(doc(db, 'users', user.uid), { displayName, photoURL });
            showAlert('تم تحديث الملف الشخصي بنجاح!', 'success');
            onClose();
        } catch (error: any) {
            console.error("Error updating profile: ", error);
            showAlert("حدث خطأ أثناء تحديث الملف الشخصي.", 'error');
        } finally {
            setLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="w-full max-w-sm bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col">
                    <header className="flex items-center justify-between p-4 border-b border-sky-400/30">
                        <h2 className="text-xl font-bold text-sky-200">تعديل الملف الشخصي</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                    </header>
                    <main className="p-6 space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                <img
                                    src={photoURL || `https://ui-avatars.com/api/?name=${displayName || 'زائر'}&background=0ea5e9&color=fff&size=128`}
                                    alt="الملف الشخصي"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-sky-400/50"
                                />
                                <button onClick={() => setShowAvatarPicker(true)} className="absolute bottom-0 right-0 bg-sky-600 p-2 rounded-full hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-300" aria-label="تغيير الصورة">
                                    <CameraIcon className="w-6 h-6 text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="relative z-0 pt-4">
                            <input id="displayName" type="text" className="block py-2.5 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-sky-400/30 appearance-none focus:outline-none focus:ring-0 focus:border-sky-300 peer" placeholder=" " value={displayName} onChange={e => setDisplayName(e.target.value)} />
                            <label htmlFor="displayName" className="absolute text-lg text-sky-200 duration-300 transform -translate-y-6 scale-75 top-7 -z-10 origin-[100%] peer-focus:origin-[100%] peer-focus:right-0 peer-focus:text-sky-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">الاسم</label>
                        </div>
                    </main>
                     <footer className="p-4 border-t border-sky-400/30">
                        <button onClick={handleProfileUpdate} disabled={loading} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg border border-white/20 focus:outline-none bg-gradient-to-br from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 hover:shadow-xl hover:scale-105 active:scale-95 active:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-900/50 focus:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed">
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

const BlockedUsersModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    blockedUids: string[];
    onUnblock: (uid: string) => void;
}> = ({ isOpen, onClose, blockedUids, onUnblock }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col h-[70vh]">
                 <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-200">المستخدمون المحظورون</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-4 overflow-y-auto">
                     <BlockedUsers blockedUids={blockedUids} onUnblock={onUnblock} />
                </main>
            </div>
        </div>
    );
};

const AboutDeveloperModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col h-[90vh]">
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-200">حول مطور التطبيق</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 overflow-y-auto text-sky-200 leading-relaxed space-y-4">
                    <p className="font-bold text-center">بسم الله الرحمن الرحيم</p>
                    <p>الهدف الاساسي من انشاء هذا التطبيق هو ان نكون سندا وعونا حقيقيا لكل شخص قرر بشجاعة ان يبدا صفحة جديدة في حياته ويتخلص من قيود الادمان اللي كبلته لفترة طويلة.</p>
                    <p>شفنا ولامسنا كيف ان كثير من التطبيقات والمصادر اللي المفروض تكون داعمة في رحلة التعافي تحولت مع الوقت لخدمات تجارية بحتة تتطلب اشتراكات ومبالغ مالية كبيرة وهالشي يشكل عائق كبير قدام ناس كثير امكانياتهم المادية بسيطة او يمكن يكونون في بداية طريقهم وما عندهم القدرة على دفع هالتكاليف ونحن نؤمن ايمان كامل بان المساعدة والدعم النفسي والتحفيزي لازم يكون حق للجميع متاح في كل وقت وبدون اي مقابل او عوائق مادية.</p>
                    <p>من هذا المنطلق جات فكرة اطلاق هذا التطبيق ليكون بمثابة الرفيق والصديق في رحلة التعافي مساحة آمنة وداعمة ومجانية بشكل كامل مئة بالمئة حاولنا نجمع فيه كل الادوات والمميزات اللي ممكن يحتاجها المتعافي من متابعة ايام التعافي وتحديات تحفيزية ومحتوى ملهم يساعده على الثبات والصمود في وجه اي انتكاسة محتملة ويشجعه على الاستمرار في طريقه نحو حياة افضل واكثر اشراقا وطمانينة.</p>
                    <p>طموحنا كبير وامنيتنا ان يصل هذا الجهد المتواضع الى اكبر عدد ممكن من الناس في كل مكان وان يكون له اثر ايجابي ملموس في حياتهم وان يكون سببا ولو بسيطا في تغيير مسار حياتهم نحو الافضل والاجمل.</p>
                    <p>نسال الله العظيم رب العرش العظيم ان يجعل هذا العمل خالصا لوجهه الكريم وان يتقبله منا وان ينفع به كل من حمله واستخدمه وان يثبت كل من يسعى في طريق التعافي ويجزيه خير الجزاء.</p>
                </main>
            </div>
        </div>
    );
};


interface SettingsProps {
    user: User;
    userProfile: UserProfile;
    handleSignOut: () => void;
    setAppLocked: (locked: boolean) => void;
    showAlert: (message: string, type: 'success' | 'error') => void;
    isDeveloper: boolean;
}

const Settings: React.FC<SettingsProps> = ({ user, userProfile, handleSignOut, setAppLocked, showAlert, isDeveloper }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [appLockEnabled, setAppLockEnabled] = useState(!!localStorage.getItem('appLockPin'));
    const [showSetPinModal, setShowSetPinModal] = useState(false);
    const [showGuestSignOutConfirm, setShowGuestSignOutConfirm] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showBlockedUsersModal, setShowBlockedUsersModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showManageQuotesModal, setShowManageQuotesModal] = useState(false);
    const [showManageEmergencyModal, setShowManageEmergencyModal] = useState(false);
    const [showManageUrgeModal, setShowManageUrgeModal] = useState(false);
    const [showManageStoriesModal, setShowManageStoriesModal] = useState(false);
    
     const handleSignOutClick = () => {
        if (user.isAnonymous) {
            setShowGuestSignOutConfirm(true);
        } else {
            handleSignOut();
        }
    };
    
    const confirmSignOut = () => {
        setShowGuestSignOutConfirm(false);
        handleSignOut();
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'حذف') {
            setError('الرجاء كتابة "حذف" للتأكيد.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await user.delete();
        } catch (error: any) {
            setError(getErrorMessage(error.code));
            setShowDeleteConfirm(false);
        } finally {
            setLoading(false);
        }
    };
    
    const handleAppLockToggle = () => {
        if (appLockEnabled) {
            localStorage.removeItem('appLockPin');
            setAppLockEnabled(false);
        } else {
            setShowSetPinModal(true);
        }
    };

    const handlePinSet = (pin: string) => {
        localStorage.setItem('appLockPin', pin);
        setAppLockEnabled(true);
        setAppLocked(true); // Ensure app gets locked immediately after setting a PIN
        setShowSetPinModal(false);
    };
    
    const handleUnblockUser = async (uidToUnblock: string) => {
        if (!userProfile.blockedUsers?.includes(uidToUnblock)) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                blockedUsers: arrayRemove(uidToUnblock)
            });
            showAlert('تم إلغاء حظر المستخدم بنجاح.', 'success');
        } catch (error) {
            console.error("Error unblocking user: ", error);
            showAlert('حدث خطأ أثناء إلغاء الحظر.', 'error');
        }
    };
    
    const AppLockToggle = () => (
         <label htmlFor="app-lock-toggle" className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="app-lock-toggle" className="sr-only peer" checked={appLockEnabled} onChange={handleAppLockToggle} />
            <div className="w-11 h-6 bg-gray-500 rounded-full peer peer-focus:ring-2 peer-focus:ring-sky-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
        </label>
    );

    return (
        <div className="text-white space-y-8 pb-24">
            <header>
                <h1 className="text-2xl font-bold text-center text-white text-shadow">الإعدادات</h1>
            </header>

            <div className="flex flex-col items-center space-y-4">
                 <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'زائر'}&background=0ea5e9&color=fff&size=128`}
                    alt="الملف الشخصي"
                    className="w-24 h-24 rounded-full object-cover border-4 border-sky-400/50"
                />
                <div className="text-center">
                    <h2 className="text-2xl font-bold">{user.displayName}</h2>
                    <p className="text-base text-sky-300">{user.email || 'حساب زائر'}</p>
                </div>
                <button 
                    onClick={() => setShowEditProfileModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-sky-200 bg-sky-700/50 hover:bg-sky-600/70 rounded-full transition-colors"
                >
                    <EditIcon className="w-4 h-4" />
                    <span>تعديل الملف الشخصي</span>
                </button>
            </div>

            {error && <ErrorAlert message={error} />}

            <div className="space-y-6">
                <SettingsGroup title="الأمان والخصوصية">
                    <SettingsItem icon={ShieldCheckIcon} label="قفل التطبيق">
                        <AppLockToggle />
                    </SettingsItem>
                    <div className="h-px bg-sky-700/50 w-11/12 mx-auto"></div>
                    <SettingsItem icon={BlockIcon} label="المستخدمون المحظورون" onClick={() => setShowBlockedUsersModal(true)} />
                </SettingsGroup>
                
                {isDeveloper && (
                  <SettingsGroup title="إدارة المحتوى">
                      <SettingsItem icon={QuoteIcon} label="إدارة الاقتباسات الملهمة" onClick={() => setShowManageQuotesModal(true)} />
                      <div className="h-px bg-sky-700/50 w-11/12 mx-auto"></div>
                      <SettingsItem icon={TargetIcon} label="إدارة محتوى النجدة" onClick={() => setShowManageEmergencyModal(true)} />
                       <div className="h-px bg-sky-700/50 w-11/12 mx-auto"></div>
                      <SettingsItem icon={LightningBoltIcon} label="إدارة محتوى الرغبة الشديدة" onClick={() => setShowManageUrgeModal(true)} />
                       <div className="h-px bg-sky-700/50 w-11/12 mx-auto"></div>
                      <SettingsItem icon={BookOpenIcon} label="إدارة محتوى الجرعة الإيمانية" onClick={() => setShowManageStoriesModal(true)} />
                  </SettingsGroup>
                )}

                <SettingsGroup title="حول">
                    <SettingsItem icon={InfoIcon} label="حول مطور التطبيق" onClick={() => setShowAboutModal(true)} />
                </SettingsGroup>
                
                <SettingsGroup title="إجراءات الحساب">
                    <SettingsItem icon={LogoutIcon} label="تسجيل الخروج" onClick={handleSignOutClick} />
                    {!user.isAnonymous && (
                        <>
                            <div className="h-px bg-sky-700/50 w-11/12 mx-auto"></div>
                            <SettingsItem icon={TrashIcon} label="حذف الحساب" onClick={() => setShowDeleteConfirm(true)} isDanger />
                        </>
                    )}
                </SettingsGroup>
            </div>
            
            {/* --- Modals --- */}
            <EditProfileModal isOpen={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} user={user} showAlert={showAlert} />
            <BlockedUsersModal isOpen={showBlockedUsersModal} onClose={() => setShowBlockedUsersModal(false)} blockedUids={userProfile.blockedUsers || []} onUnblock={handleUnblockUser} />
            {showSetPinModal && <SetPinModal onPinSet={handlePinSet} onClose={() => setShowSetPinModal(false)} />}
            <AboutDeveloperModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
            <ManageContentModal 
                isOpen={showManageQuotesModal} 
                onClose={() => setShowManageQuotesModal(false)}
                collectionName="motivational_quotes"
                modalTitle="إدارة الاقتباسات الملهمة"
                placeholderText="اكتب الاقتباس هنا..."
            />
            <ManageContentModal 
                isOpen={showManageEmergencyModal} 
                onClose={() => setShowManageEmergencyModal(false)}
                collectionName="emergency_content"
                modalTitle="إدارة محتوى النجدة"
                placeholderText="اكتب نص النجدة هنا..."
            />
            <ManageContentModal 
                isOpen={showManageUrgeModal} 
                onClose={() => setShowManageUrgeModal(false)}
                collectionName="urge_content"
                modalTitle="إدارة محتوى الرغبة الشديدة"
                placeholderText="اكتب نص الرغبة الشديدة هنا..."
            />
            <ManageContentModal 
                isOpen={showManageStoriesModal} 
                onClose={() => setShowManageStoriesModal(false)}
                collectionName="stories_content"
                modalTitle="إدارة محتوى الجرعة الإيمانية"
                placeholderText="اكتب القصة هنا..."
            />
            
            {showGuestSignOutConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                    <div className="w-full max-w-sm bg-sky-950 border border-yellow-500/50 rounded-lg p-6 space-y-4 text-white">
                        <h3 className="text-xl font-bold text-yellow-400 text-center">تنبيه تسجيل الخروج</h3>
                        <p className="text-sky-200 text-center">
                            هل أنت متأكد؟ إذا قمت بتسجيل الخروج، ستفقد حساب الزائر الحالي بشكل دائم.
                        </p>
                        <div className="flex justify-center gap-4 pt-4">
                            <button onClick={() => setShowGuestSignOutConfirm(false)} className="px-6 py-2 font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-500">إلغاء</button>
                            <button onClick={confirmSignOut} className="px-6 py-2 font-semibold text-white rounded-md bg-yellow-600 hover:bg-yellow-500">تأكيد الخروج</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-sm bg-sky-950 border border-red-500/50 rounded-lg p-6 space-y-4">
                        <h3 className="text-xl font-bold text-red-400">تأكيد حذف الحساب</h3>
                        <p className="text-sky-200">هل أنت متأكد؟ سيتم حذف جميع بياناتك بشكل دائم ولا يمكن التراجع عن هذا الإجراء.</p>
                        <p className="text-sm text-sky-300">للتأكيد، يرجى كتابة <span className="font-bold text-red-400">حذف</span> في المربع أدناه.</p>
                        <input type="text" className="w-full bg-black/30 border border-red-400/50 rounded-md p-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-red-500" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} />
                        <div className="flex justify-end gap-4">
                             <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-500">إلغاء</button>
                             <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'حذف' || loading} className="px-4 py-2 font-semibold text-white rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-50">
                                {loading ? 'جارِ الحذف...' : 'تأكيد الحذف'}
                             </button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default Settings;
