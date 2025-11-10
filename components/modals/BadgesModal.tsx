import React from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile, Badge } from '../../types.ts';
import { BADGES } from '../../services/badges.ts';
import { CloseIcon, MedalIcon } from '../ui/Icons.tsx';

interface BadgesModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
    currentUser: User;
}

const BadgesModal: React.FC<BadgesModalProps> = ({ isOpen, onClose, userProfile, currentUser }) => {
    if (!isOpen || !userProfile) return null;

    const userDays = userProfile.startDate
        ? Math.floor((new Date().getTime() - userProfile.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
        
    const isViewingOwnProfile = currentUser.uid === userProfile.uid;

    const unlockedBadges = BADGES.filter(badge => userDays >= badge.days);

    const BadgeCard: React.FC<{badge: Badge, isUnlocked: boolean}> = ({ badge, isUnlocked }) => (
        <div className={`
            flex flex-col items-center justify-center text-center p-4 rounded-lg transition-all duration-300
            ${isUnlocked 
                ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 border border-yellow-400/50 shadow-lg shadow-yellow-500/10' 
                : 'bg-slate-700/30 border border-slate-600/50 grayscale opacity-60'}
        `}>
            <div className={`relative w-20 h-20 flex items-center justify-center rounded-full mb-3 ${isUnlocked ? 'bg-yellow-500/20' : 'bg-slate-600/20'}`}>
                <span className="text-5xl transition-transform duration-300 transform scale-100">
                    {badge.icon}
                </span>
            </div>
            <h3 className={`font-bold ${isUnlocked ? 'text-yellow-200' : 'text-slate-400'}`}>{badge.name}</h3>
            <p className={`text-sm ${isUnlocked ? 'text-yellow-300' : 'text-slate-500'}`}>
                {badge.days} أيام
            </p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] transition-opacity duration-300">
            <div className="w-full h-full max-w-md bg-sky-950/90 text-white flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <MedalIcon className="w-7 h-7 text-yellow-300" />
                        <h2 className="text-xl font-bold text-sky-200 text-shadow truncate">
                             {isViewingOwnProfile ? 'أوسمتي' : `أوسمة ${userProfile.displayName}`}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-grow overflow-y-auto p-4">
                    {isViewingOwnProfile ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {BADGES.map(badge => (
                                <BadgeCard key={badge.days} badge={badge} isUnlocked={userDays >= badge.days} />
                            ))}
                        </div>
                    ) : unlockedBadges.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {unlockedBadges.map(badge => (
                                <BadgeCard key={badge.days} badge={badge} isUnlocked={true} />
                            ))}
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center text-sky-400">
                            <MedalIcon className="w-24 h-24 text-sky-700 mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold text-sky-300">لم يحصل هذا المستخدم على أي أوسمة بعد</h3>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default BadgesModal;