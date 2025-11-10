import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase.ts';
import { ErrorAlert } from '../ui/Alert.tsx';
import { EmailIcon, LockIcon, BackIcon, EyeOpenIcon, EyeClosedIcon, Spinner } from '../ui/Icons.tsx';
import { getErrorMessage } from '../../constants.tsx';

interface LoginProps {
    setView: (view: string) => void;
}

const Login: React.FC<LoginProps> = ({ setView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
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
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 mb-8">تسجيل الدخول</h2>
            <form className="space-y-6" onSubmit={handleLogin}>
                {error && <ErrorAlert message={error} />}
                <div className="relative">
                    <EmailIcon className="w-5 h-5 text-slate-400 absolute top-1/2 -translate-y-1/2 right-4" />
                    <input type="email" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="البريد الإلكتروني" aria-label="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="relative">
                    <LockIcon className="w-5 h-5 text-slate-400 absolute top-1/2 -translate-y-1/2 right-4" />
                    <input type={showPassword ? 'text' : 'password'} className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-3 pr-12 pl-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="كلمة المرور" aria-label="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 left-4 p-1 text-slate-400 hover:text-white transition-colors focus:outline-none" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                        {showPassword ? <EyeClosedIcon className="w-6 h-6" /> : <EyeOpenIcon className="w-6 h-6" />}
                    </button>
                </div>
                 <div className="text-left">
                    <button type="button" onClick={() => setView('forgot-password')} className="text-sm font-semibold text-teal-300 hover:text-teal-200 hover:underline focus:outline-none transition">
                        نسيت كلمة المرور؟
                    </button>
                </div>
                <button type="submit" disabled={loading} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg focus:outline-none bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 hover:shadow-teal-500/30 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none">
                    {loading ? <Spinner className="w-6 h-6 mx-auto"/> : 'تسجيل الدخول'}
                </button>
                <p className="text-center text-sm text-slate-400 pt-4">ليس لديك حساب؟ <button type="button" onClick={() => setView('signup')} className="font-semibold text-teal-300 hover:text-teal-200 hover:underline">إنشاء حساب</button></p>
            </form>
        </div>
    );
};

export default Login;