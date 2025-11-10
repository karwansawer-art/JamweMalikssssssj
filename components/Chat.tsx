import React, { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, where, getDocs, setDoc, arrayUnion, arrayRemove, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase.ts';
import type { UserProfile, Message, PinnedMessage, Conversation, Group, AlertContent, AlertType } from '../types.ts';
import {
    CloseIcon,
    PrivateMessageIcon,
    BlockIcon,
    UnblockIcon,
    PinIcon,
    CopyIcon,
    EditIcon,
    TrashIcon,
    ReplyIcon,
    PlusIcon
} from './ui/Icons.tsx';
import { REACTION_EMOJIS, ADMIN_UIDS } from '../constants.tsx';
import PublicChat from './chat/PublicChat.tsx';
import PrivateChatList from './chat/PrivateChatList.tsx';
import GroupChatList from './chat/GroupChatList.tsx';
import PrivateChatModal from './modals/PrivateChatModal.tsx';
import GroupChatModal from './modals/GroupChatModal.tsx';

interface ChatProps {
    onClose: () => void;
    user: User;
    currentUserProfile: UserProfile;
    showAlert: (message: string, type: AlertType) => void;
    isDeveloper: boolean;
}

const Chat: React.FC<ChatProps> = ({ onClose, user, currentUserProfile, showAlert, isDeveloper }) => {
    const [activeChatTab, setActiveChatTab] = useState('public');
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    const handleStartPrivateChat = (otherUser: UserProfile) => {
        setSelectedConversation({
            uid: otherUser.uid,
            displayName: otherUser.displayName,
            photoURL: otherUser.photoURL,
            lastMessageTimestamp: Timestamp.now(), // Use a concrete Timestamp for local state
            hasUnread: false
        });
        setActiveChatTab('private');
    };
    
    const handleStartGroupChat = (group: Group) => {
        setSelectedGroup(group);
        setActiveChatTab('groups');
    };

    const handleBlockUser = async (userToBlock: UserProfile) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                blockedUsers: arrayUnion(userToBlock.uid)
            });
            showAlert(`تم حظر ${userToBlock.displayName} بنجاح.`, 'success');
        } catch (error) {
            console.error("Error blocking user:", error);
            showAlert('حدث خطأ أثناء حظر المستخدم.', 'error');
        }
    };
    
    const handleUnblockUser = async (uidToUnblock: string) => {
         if (!user) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                blockedUsers: arrayRemove(uidToUnblock)
            });
            showAlert('تم إلغاء حظر المستخدم.', 'success');
        } catch (error) {
            console.error("Error unblocking user:", error);
             showAlert('حدث خطأ أثناء إلغاء الحظر.', 'error');
        }
    };
    
    const handleBackToList = () => {
        setSelectedConversation(null);
        setSelectedGroup(null);
    };

    return (
        <div className="w-full h-full max-w-md bg-sky-950/90 text-white flex flex-col">
            <header className="p-4 border-b border-sky-400/30 flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-sky-200 text-shadow">الدردشة</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {!(selectedConversation || selectedGroup) && (
                     <div className="flex border border-sky-600 rounded-lg p-1">
                        <button onClick={() => setActiveChatTab('public')} className={`w-1/3 py-2 rounded-md text-sm font-semibold transition-colors ${activeChatTab === 'public' ? 'bg-sky-600 text-white' : 'text-sky-300 hover:bg-sky-700/50'}`}>الدردشة العامة</button>
                        <button onClick={() => setActiveChatTab('groups')} className={`w-1/3 py-2 rounded-md text-sm font-semibold transition-colors ${activeChatTab === 'groups' ? 'bg-sky-600 text-white' : 'text-sky-300 hover:bg-sky-700/50'}`}>المجموعات</button>
                        <button onClick={() => setActiveChatTab('private')} className={`w-1/3 py-2 rounded-md text-sm font-semibold transition-colors relative ${activeChatTab === 'private' ? 'bg-sky-600 text-white' : 'text-sky-300 hover:bg-sky-700/50'}`}>
                            المحادثات الخاصة
                        </button>
                    </div>
                )}
            </header>
            
            <main className="flex-grow overflow-y-auto">
                {activeChatTab === 'public' && (
                    <PublicChat 
                        user={user} 
                        currentUserProfile={currentUserProfile}
                        blockedUsers={currentUserProfile.blockedUsers || []}
                        onStartPrivateChat={handleStartPrivateChat}
                        onBlockUser={handleBlockUser}
                        onUnblockUser={handleUnblockUser}
                        showAlert={showAlert}
                        isDeveloper={isDeveloper}
                    />
                )}
                {activeChatTab === 'private' && !selectedConversation && (
                    <PrivateChatList user={user} onConversationSelect={setSelectedConversation} />
                )}
                {selectedConversation && (
                    <PrivateChatModal 
                        isOpen={!!selectedConversation} 
                        onClose={handleBackToList} 
                        user={user} 
                        otherUser={selectedConversation} 
                        isBlocked={(currentUserProfile.blockedUsers || []).includes(selectedConversation.uid)}
                        onBlockUser={handleBlockUser}
                        onUnblockUser={handleUnblockUser}
                    />
                )}
                {activeChatTab === 'groups' && !selectedGroup && (
                    <GroupChatList user={user} onGroupSelect={setSelectedGroup} />
                )}
                 {selectedGroup && (
                    <GroupChatModal 
                        isOpen={!!selectedGroup}
                        onClose={handleBackToList}
                        user={user}
                        currentUserProfile={currentUserProfile}
                        group={selectedGroup}
                        isDeveloper={isDeveloper}
                    />
                )}
            </main>
        </div>
    );
};

export default Chat;