import React from 'react';

interface WelcomeProps {
    setView: (view: string) => void;
    handleGuestLogin: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ setView, handleGuestLogin }) => (
    <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4 text-shadow">أهلاً بك في رحلتك نحو التعافي</h1>
        <p className="text-sky-200 mb-8 text-lg">اختر كيف تود المتابعة</p>
        <div className="space-y-4">
            <button onClick={() => setView('login')} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg border border-white/20 focus:outline-none bg-gradient-to-br from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 hover:shadow-xl hover:scale-105 active:scale-95 active:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-900/50 focus:ring-sky-400">
                تسجيل الدخول
            </button>
            <button onClick={() => setView('signup')} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg border border-white/20 focus:outline-none bg-gradient-to-br from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 hover:shadow-xl hover:scale-105 active:scale-95 active:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-900/50 focus:ring-teal-400">
                إنشاء حساب
            </button>
            <button onClick={handleGuestLogin} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg border border-white/20 focus:outline-none bg-gradient-to-br from-slate-500 to-slate-700 hover:from-slate-400 hover:to-slate-600 hover:shadow-xl hover:scale-105 active:scale-95 active:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-900/50 focus:ring-slate-400">
                دخول كضيف
            </button>
        </div>
    </div>
);

export default Welcome;
