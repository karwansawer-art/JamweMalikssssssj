import React from 'react';
import type { UserProfile } from '../../types';
import { CloseIcon, PrivateMessageIcon, BlockIcon, UnblockIcon, MuteIcon, UnmuteIcon, PromoteIcon, DemoteIcon } from '../ui/Icons.tsx';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onStartPrivateChat: (user: UserProfile) => void;
  onBlockUser: (user: UserProfile) => void;
  onUnblockUser: (uid: string) => void;
  isBlocked: boolean;
  isDeveloper?: boolean;
  onAdminAction?: (profile: UserProfile, action: 'mute' | 'role') => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
    isOpen, 
    onClose, 
    userProfile, 
    onStartPrivateChat, 
    onBlockUser, 
    onUnblockUser, 
    isBlocked,
    isDeveloper,
    onAdminAction
}) => {
  if (!isOpen) return null;

  const handleAction = (action: 'mute' | 'role') => {
    if (onAdminAction) {
        onAdminAction(userProfile, action);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-sky-950/90 border border-sky-500/50 rounded-lg text-white" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-sky-400/30">
          <h2 className="text-xl font-bold text-sky-200">الملف الشخصي</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 flex flex-col items-center gap-4">
          <img
            src={userProfile.photoURL || `https://ui-avatars.com/api/?name=${userProfile.displayName || ' '}&background=0ea5e9&color=fff&size=128`}
            alt={userProfile.displayName}
            className="w-24 h-24 rounded-full object-cover border-4 border-sky-400/50"
          />
          <div className="text-center">
            <h3 className="text-2xl font-bold">{userProfile.displayName}</h3>
            {userProfile.role === 'supervisor' && <p className="text-yellow-400 font-semibold">مشرف</p>}
          </div>
        </main>
        <footer className="p-4 border-t border-sky-400/30 flex flex-col gap-3">
          <button onClick={() => { onStartPrivateChat(userProfile); onClose(); }} className="flex items-center justify-center gap-3 w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-sky-600 hover:bg-sky-500">
            <PrivateMessageIcon className="w-6 h-6" />
            <span>بدء محادثة خاصة</span>
          </button>
          {isBlocked ? (
            <button onClick={() => { onUnblockUser(userProfile.uid); onClose(); }} className="flex items-center justify-center gap-3 w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-green-600 hover:bg-green-500">
              <UnblockIcon className="w-6 h-6" />
              <span>إلغاء الحظر</span>
            </button>
          ) : (
            <button onClick={() => { onBlockUser(userProfile); onClose(); }} className="flex items-center justify-center gap-3 w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-red-600 hover:bg-red-500">
              <BlockIcon className="w-6 h-6" />
              <span>حظر المستخدم</span>
            </button>
          )}

          {isDeveloper && onAdminAction && (
             <div className="border-t border-red-500/30 pt-3 space-y-3">
                <button onClick={() => handleAction('mute')} className="flex items-center justify-center gap-3 w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-orange-600 hover:bg-orange-500">
                    {userProfile.isMuted ? <UnmuteIcon className="w-6 h-6"/> : <MuteIcon className="w-6 h-6" />}
                    <span>{userProfile.isMuted ? 'إلغاء كتم المستخدم' : 'كتم المستخدم'}</span>
                </button>
                 <button onClick={() => handleAction('role')} className="flex items-center justify-center gap-3 w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-yellow-600 hover:bg-yellow-500">
                    {userProfile.role === 'supervisor' ? <DemoteIcon className="w-6 h-6"/> : <PromoteIcon className="w-6 h-6" />}
                    <span>{userProfile.role === 'supervisor' ? 'تخفيض إلى مستخدم' : 'ترقية إلى مشرف'}</span>
                </button>
             </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default UserProfileModal;