import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase.ts';
import { ErrorAlert } from '../ui/Alert.tsx';
import { EmailIcon, BackIcon, Spinner, ShieldCheckIcon } from '../ui/Icons.tsx';
import { getErrorMessage } from '../../constants.tsx';

interface ForgotPasswordProps {
    setView: (view: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ setView }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
  
    const handleReset = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        setSuccess(true);
      } catch (err: any) {
        if(err.code === 'auth/user-not-found') {
            // To prevent user enumeration, we show success even if user is not found.
            setSuccess(true);
        } else {
            setError(getErrorMessage(err.code));
        }
      } finally {
        setLoading(false);
      }
    };
  
    return (
        <div className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-2xl p-8 shadow-2xl relative">
            <button onClick={() => setView('login')} className="absolute top-4 left-4 p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500" aria-label="العودة">
                <BackIcon className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 mb-6">إعادة تعيين كلمة المرور</h2>
            
            {success ? (
                <div className="text-center text-white">
                     <ShieldCheckIcon className="w-16 h-16 mx-auto text-teal-400 mb-4" />
                    <h3 className="text-xl font-bold mb-2">تم إرسال الرابط</h3>
                    <p className="mb-6 text-slate-300">
                        إذا كان بريدك الإلكتروني مسجلاً لدينا، فستصلك رسالة لإعادة التعيين. يرجى التحقق من صندوق الوارد والرسائل غير المرغوب فيها.
                    </p>
                    <button onClick={() => setView('login')} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg focus:outline-none bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 hover:shadow-teal-500/30 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-400">
                       العودة لتسجيل الدخول
                    </button>
                </div>
            ) : (
                <form className="space-y-6" onSubmit={handleReset}>
                    {error && <ErrorAlert message={error} />}
                    <p className="text-center text-slate-300">أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.</p>
                    <div className="relative">
                        <EmailIcon className="w-5 h-5 text-slate-400 absolute top-1/2 -translate-y-1/2 right-4" />
                        <input type="email" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="البريد الإلكتروني" aria-label="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <button type="submit" disabled={loading} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg focus:outline-none bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 hover:shadow-teal-500/30 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none">
                        {loading ? <Spinner className="w-6 h-6 mx-auto"/> : 'إرسال رابط إعادة التعيين'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default ForgotPassword;