import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase.ts';
import { ErrorAlert } from '../ui/Alert.tsx';
import { UserIcon, EmailIcon, LockIcon, BackIcon, EyeOpenIcon, EyeClosedIcon, Spinner, ShieldCheckIcon } from '../ui/Icons.tsx';
import { getErrorMessage } from '../../constants.tsx';
import { AVATAR_OPTIONS } from '../ui/AvatarPickerModal.tsx';

interface SignupProps {
    setView: (view: string) => void;
}

const Signup: React.FC<SignupProps> = ({ setView }) => {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                // Select a default avatar based on UID to make it pseudo-random but deterministic
                const avatarIndex = userCredential.user.uid.charCodeAt(0) % AVATAR_OPTIONS.length;
                const defaultAvatarUrl = AVATAR_OPTIONS[avatarIndex];

                await updateProfile(userCredential.user, { 
                    displayName,
                    photoURL: defaultAvatarUrl 
                });
                await userCredential.user.sendEmailVerification();
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    displayName,
                    email,
                    photoURL: defaultAvatarUrl,
                    createdAt: serverTimestamp(),
                    isAdmin: false,
                    isMuted: false,
                    commitmentDocument: "",
                });
            }
            setSuccess(true);
        } catch (err: any) {
            setError(getErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-2xl p-8 shadow-2xl relative">
             <button onClick={() => setView('main')} className="absolute top-4 left-4 p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500" aria-label="العودة">
                <BackIcon className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 mb-8">إنشاء حساب جديد</h2>
            {success ? (
                <div className="text-center text-white">
                    <ShieldCheckIcon className="w-16 h-16 mx-auto text-teal-400 mb-4" />
                    <h3 className="text-xl font-bold mb-2">تم إنشاء حسابك بنجاح!</h3>
                    <p className="mb-6 text-slate-300">تم إرسال رسالة التحقق إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد ومجلد الرسائل غير المرغوب فيها.</p>
                    <button onClick={() => setView('login')} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg focus:outline-none bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 hover:shadow-teal-500/30 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-400">
                        الذهاب إلى صفحة الدخول
                    </button>
                </div>
            ) : (
                <form className="space-y-6" onSubmit={handleSignup}>
                    {error && <ErrorAlert message={error} />}
                    <div className="relative">
                       <UserIcon className="w-5 h-5 text-slate-400 absolute top-1/2 -translate-y-1/2 right-4" />
                       <input type="text" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="الاسم الكامل" aria-label="الاسم الكامل" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
                    </div>
                    <div className="relative">
                        <EmailIcon className="w-5 h-5 text-slate-400 absolute top-1/2 -translate-y-1/2 right-4" />
                        <input type="email" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="البريد الإلكتروني" aria-label="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="relative">
                        <LockIcon className="w-5 h-5 text-slate-400 absolute top-1/2 -translate-y-1/2 right-4" />
                        <input type={showPassword ? 'text' : 'password'} className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-3 pr-12 pl-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="كلمة المرور" aria-label="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} required />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 left-4 p-1 text-slate-400 hover:text-white transition-colors focus:outline-none" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                            {showPassword ? <EyeClosedIcon className="w-6 h-6" /> : <EyeOpenIcon className="w-6 h-6" />}
                        </button>
                    </div>
                     <div className="relative">
                        <LockIcon className="w-5 h-5 text-slate-400 absolute top-1/2 -translate-y-1/2 right-4" />
                        <input type={showConfirmPassword ? 'text' : 'password'} className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-3 pr-12 pl-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="تأكيد كلمة المرور" aria-label="تأكيد كلمة المرور" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute top-1/2 -translate-y-1/2 left-4 p-1 text-slate-400 hover:text-white transition-colors focus:outline-none" aria-label={showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                            {showConfirmPassword ? <EyeClosedIcon className="w-6 h-6" /> : <EyeOpenIcon className="w-6 h-6" />}
                        </button>
                    </div>
                    <button type="submit" disabled={loading} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg focus:outline-none bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 hover:shadow-teal-500/30 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none">
                        {loading ? <Spinner className="w-6 h-6 mx-auto"/> : 'إنشاء الحساب'}
                    </button>
                    <p className="text-center text-sm text-slate-400 pt-4">لديك حساب بالفعل؟ <button type="button" onClick={() => setView('login')} className="font-semibold text-teal-300 hover:text-teal-200 hover:underline">تسجيل الدخول</button></p>
                </form>
            )}
        </div>
    );
};

export default Signup;