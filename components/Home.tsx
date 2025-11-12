

import React, { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile, Tab } from '../types.ts';
import { db } from '../services/firebase.ts';
import { doc, setDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { getPlural, getTimeDifference } from '../utils/time.ts';

import { SettingsIcon, ChatIcon, BellIcon, UserIcon as ProfileIcon, CounterIcon, LeaderboardIcon, MedalIcon, QuoteIcon, TelegramIcon, SparklesIcon, BrainCircuitIcon } from './ui/Icons.tsx';
import EmergencyButton from './home/EmergencyButton.tsx';
import IntenseUrgeButton from './home/IntenseUrgeButton.tsx';
import FaithDoseButton from './home/FaithDoseButton.tsx';
import CommitmentDocument from './home/CommitmentDocument.tsx';
import ProgressBar from './ui/ProgressBar.tsx';
import FreedomModelProgram from './home/FreedomModelProgram.tsx'; // Import the new component
import RecoveryCompanionModal from './modals/RecoveryCompanionModal.tsx';
import HomosexualityRecoveryModal from './modals/HomosexualityRecoveryModal.tsx';

const quotes = [
    {
        quote: "الخطوة الأولى نحو الوصول إلى أي مكان هي أن تقرر أنك لن تبقى في مكانك الحالي.",
        author: "جي بي مورغان"
    },
    {
        quote: "قوتك الحقيقية ليست في عدم السقوط، بل في النهوض في كل مرة تسقط فيها.",
        author: "كونفوشيوس"
    },
    {
        quote: "التغيير صعب في البداية، فوضوي في المنتصف، ورائع في النهاية.",
        author: "روبن شارما"
    },
    {
        quote: "لا تخف من المضي ببطء، خف فقط من الوقوف ساكناً.",
        author: "مثل صيني"
    },
    {
        quote: "كل يوم جديد هو فرصة أخرى لتغيير حياتك.",
    },
    {
        quote: "الشخص الوحيد الذي من المقدر أن تكونه هو الشخص الذي تقرر أن تكونه.",
        author: "رالف والدو إمرسون"
    },
    {
        quote: "لا تدع الأمس يستهلك الكثير من اليوم.",
        author: "ويل روجرز"
    },
    {
        quote: "النجاح هو مجموع الجهود الصغيرة التي تتكرر يوماً بعد يوم.",
        author: "روبرت كولير"
    },
    {
        quote: "أنت أقوى من إدمانك.",
    },
    {
        quote: "التعافي ليس لؤلؤة تجدها، بل هو فكرة تزرعها وتنميها.",
    }
];

interface HomeProps {
  user: User;
  userProfile: UserProfile;
  setActiveTab: (tab: Tab) => void;
  setShowNotifications: (show: boolean) => void;
  setShowLeaderboard: (show: boolean) => void;
  setShowBadges: (show: boolean) => void;
}

const defaultCounterImage = 'https://images.unsplash.com/photo-1542496658-e3962b04f762?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const Home: React.FC<HomeProps> = ({
  user,
  setActiveTab,
  setShowNotifications,
  setShowLeaderboard,
  setShowBadges,
  userProfile,
}) => {
    const startDate = userProfile.startDate;
    const [globalCounterImage, setGlobalCounterImage] = useState<string | null>(null);
    const [now, setNow] = useState(() => new Date());
    const [showFreedomModelProgram, setShowFreedomModelProgram] = useState(false); // New state for the Freedom Model Program
    const [showRecoveryCompanionModal, setShowRecoveryCompanionModal] = useState(false);
    const [showHomosexualityRecoveryModal, setShowHomosexualityRecoveryModal] = useState(false);

    const [globalQuotes, setGlobalQuotes] = useState<{ quote: string; author?: string; }[]>(() => {
        try {
            const cached = localStorage.getItem('motivational_quotes');
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            console.error("Failed to parse quotes from localStorage", e);
            return [];
        }
    });

    useEffect(() => {
        const q = query(collection(db, "motivational_quotes"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const fetchedQuotes = snapshot.docs.map(doc => ({ quote: doc.data().text, author: doc.data().author }));
                setGlobalQuotes(fetchedQuotes);
                try {
                    localStorage.setItem('motivational_quotes', JSON.stringify(fetchedQuotes));
                } catch (e) {
                    console.error("Failed to save quotes to localStorage", e);
                }
            } else {
                setGlobalQuotes([]); 
                localStorage.removeItem('motivational_quotes');
            }
        });
        return () => unsubscribe();
    }, []);

    const quotesSource = useMemo(() => {
        if (globalQuotes.length > 0) {
            return globalQuotes;
        }
        return quotes; // Fallback to default quotes
    }, [globalQuotes]);

    const [quoteIndex, setQuoteIndex] = useState(() => {
        const initialSource = (() => {
            try {
                const cached = localStorage.getItem('motivational_quotes');
                const parsed = cached ? JSON.parse(cached) : [];
                return parsed.length > 0 ? parsed : quotes;
            } catch {
                return quotes;
            }
        })();
        return initialSource.length > 0 ? Math.floor(Math.random() * initialSource.length) : 0;
    });
    const [isQuoteVisible, setIsQuoteVisible] = useState(true);

    useEffect(() => {
        if (quotesSource.length === 0) return;
        const quoteTimer = setInterval(() => {
            setIsQuoteVisible(false); // Start fade out
            setTimeout(() => {
                setQuoteIndex(prevIndex => (prevIndex + 1) % quotesSource.length);
                setIsQuoteVisible(true); // Start fade in
            }, 500); // Wait for fade out to complete
        }, 10000); // Change quote every 10 seconds

        return () => clearInterval(quoteTimer);
    }, [quotesSource.length]);

    useEffect(() => {
        const configDocRef = doc(db, "app_config", "global_settings");
        const unsubscribe = onSnapshot(configDocRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().counterImage) {
                setGlobalCounterImage(docSnap.data().counterImage);
            } else {
                setGlobalCounterImage(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!startDate) return;
        
        const intervalId = setInterval(() => {
            setNow(new Date());
        }, 1000); // Update every second for better performance

        return () => clearInterval(intervalId);
    }, [startDate]);

    const handleStartCounter = () => {
        const now = new Date();
        setDoc(doc(db, "users", user.uid), { startDate: now }, { merge: true });
    };

    const diff = startDate ? getTimeDifference(startDate, now) : { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
    const today = new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const currentCounterImage = globalCounterImage || defaultCounterImage;
    const containerStyle = { backgroundImage: `url(${currentCounterImage})` };
    const overlayClass = globalCounterImage ? 'bg-black/40' : 'bg-black/60'; // Darker for default image, lighter if custom might be light
    const counterContainerClasses = `w-full max-w-sm mx-auto p-4 rounded-2xl border border-white/10 relative overflow-hidden transition-all duration-500 bg-cover bg-center`;


    const currentQuote = quotesSource.length > 0 ? quotesSource[quoteIndex % quotesSource.length] : { quote: "جارِ تحميل الاقتباسات...", author: "" };

    const motivationalQuoteSection = (
        <div className="mt-6 p-4 rounded-xl bg-sky-950/50 backdrop-blur-sm border border-sky-700/40 text-center">
            <QuoteIcon className="w-8 h-8 mx-auto text-sky-400/70 mb-3" />
            <div className={`transition-opacity duration-500 ease-in-out min-h-[100px] flex flex-col justify-center ${isQuoteVisible ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-lg font-semibold text-sky-200">"{currentQuote.quote}"</p>
                {currentQuote.author && <p className="text-sm text-sky-400 mt-2">- {currentQuote.author}</p>}
            </div>
        </div>
    );
    
    const recoveryCompanionButton = (
        <button
            onClick={() => setShowRecoveryCompanionModal(true)}
            className="group w-full p-4 rounded-xl text-white flex items-center justify-between bg-sky-950/50 backdrop-blur-sm border border-sky-700/40 transition-all duration-300 hover:bg-sky-900/70 hover:border-sky-600"
            aria-label="رفيقك في التعافي"
        >
            <div className="text-right">
                <h3 className="text-lg font-bold text-purple-300">رفيقك في التعافي</h3>
                <p className="text-sm text-sky-400">رفيقك الذكي للإجابة على جميع تساؤلاتك</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/30 transition-shadow">
                <SparklesIcon className="w-8 h-8" />
            </div>
        </button>
    );

    const homosexualityRecoveryButton = (
        <button
            onClick={() => setShowHomosexualityRecoveryModal(true)}
            className="group w-full p-4 rounded-xl text-white flex items-center justify-between bg-sky-950/50 backdrop-blur-sm border border-sky-700/40 transition-all duration-300 hover:bg-sky-900/70 hover:border-sky-600"
            aria-label="التعافي من الشذوذ الجنسية"
        >
            <div className="text-right">
                <h3 className="text-lg font-bold text-teal-300">التعافي من الشذوذ الجنسية</h3>
                <p className="text-sm text-sky-400">مساعدك للتغلب على الميول المثلية</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:shadow-teal-500/30 transition-shadow">
                <BrainCircuitIcon className="w-8 h-8" />
            </div>
        </button>
    );

    if (!startDate) {
      return (
          <div className="text-white">
            <header className="flex justify-between items-center w-full pt-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>مرحباً، {user.displayName || 'زائر'}</h1>
                    <p className="text-sm text-sky-300">{today}</p>
                </div>
                 <div className="flex items-center gap-1">
                    <button onClick={() => setShowBadges(true)} title="الأوسمة" className="p-2 rounded-full hover:bg-white/10 transition-colors"><MedalIcon className="w-6 h-6" /></button>
                    <button onClick={() => setShowLeaderboard(true)} title="لوحة الصدارة" className="p-2 rounded-full hover:bg-white/10 transition-colors"><LeaderboardIcon className="w-6 h-6" /></button>
                    <button onClick={() => setShowNotifications(true)} title="الإشعارات" className="p-2 rounded-full hover:bg-white/10 transition-colors"><BellIcon className="w-6 h-6" /></button>
                    <a href="https://t.me/ta3fi_channel" target="_blank" rel="noopener noreferrer" title="قناة التليجرام" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <TelegramIcon className="w-6 h-6" />
                    </a>
                    <button onClick={() => setActiveTab('settings')} title="الملف الشخصي / الإعدادات" className="p-2 rounded-full hover:bg-white/10 transition-colors"><ProfileIcon className="w-6 h-6" /></button>
                </div>
            </header>
            <main className="pt-8">
              <div style={containerStyle} className={`${counterContainerClasses} min-h-[350px] flex flex-col`}>
                <div className={`absolute inset-0 ${overlayClass} rounded-2xl`}></div> {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <CounterIcon className="w-36 h-36 text-white/10" />
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center flex-grow">
                    <div className="flex-grow flex flex-col items-center justify-center">
                        <h2 className="text-4xl font-bold text-shadow mb-4 animate-fade-in">رحلتك نحو التعافي تبدأ الآن</h2>
                        <p className="text-sky-200 text-lg mb-8 animate-fade-in animate-delay-100">كل يوم هو فرصة جديدة، انطلق نحوها!</p>
                    </div>
                    <button
                        onClick={handleStartCounter}
                        className="w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg border border-white/20 focus:outline-none bg-gradient-to-br from-sky-500 to-sky-700 hover:shadow-xl hover:shadow-sky-500/30 hover:scale-105 active:scale-95 active:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-900/50 focus:ring-sky-400 animate-pulse"
                    >
                        ابدأ حساب الأيام
                    </button>
                </div>
              </div>
              {motivationalQuoteSection}
              <button
                  onClick={() => setShowFreedomModelProgram(true)}
                  className="w-full mt-6 p-4 rounded-xl text-white text-right bg-sky-950/50 backdrop-blur-sm border border-sky-700/40 transition-all duration-300 hover:bg-sky-900/70 hover:border-sky-600"
                  aria-label="برنامج التعافي - نموذج الحرية"
              >
                  <h3 className="text-lg font-bold text-teal-300">برنامج التعافي – من إعداد الأستاذ محمد عبد الله</h3>
                  <p className="text-sm text-sky-400">نموذج الحرية – كيف تتخلص من الإباحية والعادة السرية؟</p>
              </button>
              <div className="mt-8 flex flex-col gap-4 pb-20">
                {recoveryCompanionButton}
                {homosexualityRecoveryButton}
                <IntenseUrgeButton user={user} userProfile={userProfile} />
                <EmergencyButton user={user} userProfile={userProfile} />
                <CommitmentDocument user={user} userProfile={userProfile} />
                <FaithDoseButton user={user} userProfile={userProfile} />
              </div>
            </main>
            {showFreedomModelProgram && (
                <FreedomModelProgram
                    isOpen={showFreedomModelProgram}
                    onClose={() => setShowFreedomModelProgram(false)}
                    user={user}
                    isDeveloper={user.uid && ['sytCf4Ru91ZplxTeXYfvqGhDnn12'].includes(user.uid)}
                />
            )}
            {showRecoveryCompanionModal && <RecoveryCompanionModal isOpen={showRecoveryCompanionModal} onClose={() => setShowRecoveryCompanionModal(false)} />}
            {showHomosexualityRecoveryModal && <HomosexualityRecoveryModal isOpen={showHomosexualityRecoveryModal} onClose={() => setShowHomosexualityRecoveryModal(false)} />}
          </div>
      );
    }
    
    return (
        <div className="text-white">
            <header className="flex justify-between items-center w-full pt-4">
                 <div>
                    <h1 className="text-xl font-bold" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>مرحباً، {user.displayName || 'زائر'}</h1>
                    <p className="text-sm text-sky-300">{today}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setShowBadges(true)} title="الأوسمة" className="p-2 rounded-full hover:bg-white/10 transition-colors"><MedalIcon className="w-6 h-6" /></button>
                    <button onClick={() => setShowLeaderboard(true)} title="لوحة الصدارة" className="p-2 rounded-full hover:bg-white/10 transition-colors"><LeaderboardIcon className="w-6 h-6" /></button>
                    <button onClick={() => setShowNotifications(true)} title="الإشعارات" className="p-2 rounded-full hover:bg-white/10 transition-colors"><BellIcon className="w-6 h-6" /></button>
                    <a href="https://t.me/ta3fi_channel" target="_blank" rel="noopener noreferrer" title="قناة التليجرام" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <TelegramIcon className="w-6 h-6" />
                    </a>
                    <button onClick={() => setActiveTab('settings')} title="الملف الشخصي / الإعدادات" className="p-2 rounded-full hover:bg-white/10 transition-colors"><ProfileIcon className="w-6 h-6" /></button>
                </div>
            </header>
            <main className="pt-8">
                <div style={containerStyle} className={counterContainerClasses}>
                    <div className={`absolute inset-0 ${overlayClass} rounded-2xl`}></div> {/* Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <CounterIcon className="w-36 h-36 text-white/10" />
                    </div>
                    <div className="relative z-10">
                        <div className="space-y-3">
                            <div className="flex items-center justify-end pl-2 h-10">
                               <button onClick={() => setActiveTab('counter-settings')} className="p-2 rounded-full hover:bg-white/10"><SettingsIcon className="w-6 h-6 text-white" /></button>
                            </div>
                            <ProgressBar label={`${diff.months} ${getPlural(diff.months, 'month')}`} progress={((diff.months % 12) / 12) * 100} colorClass="bg-orange-500" />
                            <ProgressBar label={`${diff.days} ${getPlural(diff.days, 'day')}`} progress={(diff.days / 30) * 100} colorClass="bg-lime-500" />
                            <ProgressBar label={`${diff.hours} ${getPlural(diff.hours, 'hour')}`} progress={(diff.hours / 24) * 100} colorClass="bg-blue-500" />
                            <ProgressBar label={`${diff.minutes} ${getPlural(diff.minutes, 'minute')}`} progress={(diff.minutes / 60) * 100} colorClass="bg-pink-500" />
                            <ProgressBar label={`${diff.seconds} ${getPlural(diff.seconds, 'second')}`} progress={(diff.seconds / 60) * 100} colorClass="bg-yellow-500" />
                        </div>
                    </div>
                </div>
                {motivationalQuoteSection}
                <button
                    onClick={() => setShowFreedomModelProgram(true)}
                    className="w-full mt-6 p-4 rounded-xl text-white text-right bg-sky-950/50 backdrop-blur-sm border border-sky-700/40 transition-all duration-300 hover:bg-sky-900/70 hover:border-sky-600"
                    aria-label="برنامج التعافي - نموذج الحرية"
                >
                    <h3 className="text-lg font-bold text-teal-300">برنامج التعافي – من إعداد الأستاذ محمد عبد الله</h3>
                    <p className="text-sm text-sky-400">نموذج الحرية – كيف تتخلص من الإباحية والعادة السرية؟</p>
                </button>
                <div className="mt-8 flex flex-col gap-4 pb-20">
                    {recoveryCompanionButton}
                    {homosexualityRecoveryButton}
                    <IntenseUrgeButton user={user} userProfile={userProfile} />
                    <EmergencyButton user={user} userProfile={userProfile} />
                    <CommitmentDocument user={user} userProfile={userProfile} />
                    <FaithDoseButton user={user} userProfile={userProfile} />
                </div>
            </main>
            {showFreedomModelProgram && (
                <FreedomModelProgram
                    isOpen={showFreedomModelProgram}
                    onClose={() => setShowFreedomModelProgram(false)}
                    user={user}
                    isDeveloper={user.uid && ['sytCf4Ru91ZplxTeXYfvqGhDnn12'].includes(user.uid)}
                />
            )}
            {showRecoveryCompanionModal && <RecoveryCompanionModal isOpen={showRecoveryCompanionModal} onClose={() => setShowRecoveryCompanionModal(false)} />}
            {showHomosexualityRecoveryModal && <HomosexualityRecoveryModal isOpen={showHomosexualityRecoveryModal} onClose={() => setShowHomosexualityRecoveryModal(false)} />}
        </div>
    );
};

export default Home;
