import React, { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { UserProfile, Message, PinnedMessage, AlertType } from '../../types.ts';
import { CloseIcon, SendIcon, OptionsIcon, PinIcon, CheckIcon, TrashIcon, ChevronDownIcon, CameraIcon } from '../ui/Icons.tsx';
import MessageOptionsMenu from '../modals/MessageOptionsMenu.tsx';
import DeleteMessageModal from '../modals/DeleteMessageModal.tsx';
import UserProfileModal from '../modals/UserProfileModal.tsx';
import { REACTION_EMOJIS } from '../../constants.tsx';
import AvatarPickerModal from '../ui/AvatarPickerModal.tsx';

// Reusable Reaction List Component
const ReactionList: React.FC<{
  reactions: { [key: string]: string[] };
  currentUserId: string;
  onReactionClick: (emoji: string) => void;
}> = ({ reactions, currentUserId, onReactionClick }) => {
  if (!reactions || Object.keys(reactions).length === 0) {
    return null;
  }

  return (
    <div className="flex gap-1 mt-1 flex-wrap clear-both pt-2">
      {Object.entries(reactions).map(([emoji, uids]) => {
        if (!Array.isArray(uids) || uids.length === 0) return null;
        
        const userHasReacted = uids.includes(currentUserId);

        return (
          <button
            key={emoji}
            onClick={(e) => { e.stopPropagation(); onReactionClick(emoji); }}
            className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
              userHasReacted
                ? 'bg-sky-500 border border-sky-300 text-white'
                : 'bg-sky-700/50 hover:bg-sky-600/70 border border-transparent'
            }`}
            aria-label={`${uids.length} users reacted with ${emoji}`}
          >
            {emoji} {uids.length}
          </button>
        );
      })}
    </div>
  );
};


// Props definition
interface PublicChatProps {
    user: User;
    currentUserProfile: UserProfile;
    blockedUsers: string[];
    onStartPrivateChat: (user: UserProfile) => void;
    onBlockUser: (user: UserProfile) => void;
    onUnblockUser: (uid: string) => void;
    showAlert: (message: string, type: AlertType) => void;
    isDeveloper: boolean;
}

// Helper to format timestamp
const formatTime = (date: Date) => date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
const isValidTimestamp = (ts: any) => ts && typeof ts.toDate === 'function';


const PublicChat: React.FC<PublicChatProps> = ({ user, currentUserProfile, blockedUsers, onStartPrivateChat, onBlockUser, onUnblockUser, showAlert, isDeveloper }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [pinnedMessage, setPinnedMessage] = useState<PinnedMessage | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
    const [messageToEdit, setMessageToEdit] = useState<Message | null>(null);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
    const [userProfiles, setUserProfiles] = useState<{ [uid: string]: UserProfile }>({});
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const [userToEditAvatar, setUserToEditAvatar] = useState<UserProfile | null>(null);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    
    // Fetch messages
    useEffect(() => {
        const q = query(collection(db, 'public_chat'), orderBy('timestamp', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
            setMessages(fetchedMessages.filter(m => !blockedUsers.includes(m.uid)));
        });
        return () => unsubscribe();
    }, [blockedUsers]);

    // Fetch pinned message
    useEffect(() => {
        const pinDocRef = doc(db, 'app_config', 'pinned_message');
        const unsubscribe = onSnapshot(pinDocRef, (doc) => {
            if (doc.exists()) {
                setPinnedMessage(doc.data() as PinnedMessage);
            } else {
                setPinnedMessage(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch user profiles for messages
    useEffect(() => {
        const fetchMessageUserInfo = async () => {
            if (messages.length === 0) return;
            const uids = [...new Set(messages.map(m => m.uid))].filter((uid): uid is string => typeof uid === 'string' && !!uid);
            const profilesToFetch = uids.filter(uid => !userProfiles[uid]);

            if (profilesToFetch.length > 0) {
                const fetchedProfiles: { [uid: string]: UserProfile } = {};
                const promises = profilesToFetch.map(async (uid) => {
                    const userDocRef = doc(db, 'users', uid);
                    try {
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            fetchedProfiles[uid] = { uid, ...userDocSnap.data() } as UserProfile;
                        } else {
                             fetchedProfiles[uid] = { uid, displayName: 'مستخدم محذوف', photoURL: '', createdAt: serverTimestamp() as any, isMuted: false, role: undefined };
                        }
                    } catch (e) {
                        console.error("Error fetching user profile:", e);
                        fetchedProfiles[uid] = { uid, displayName: 'مستخدم محذوف', photoURL: '', createdAt: serverTimestamp() as any, isMuted: false, role: undefined };
                    }
                });
                await Promise.all(promises);
                setUserProfiles(prev => ({ ...prev, ...fetchedProfiles }));
            }
        };

        fetchMessageUserInfo();
    }, [messages]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); // Changed to smooth scroll
    }, [messages]);
    
    // Focus input when editing or replying
    useEffect(() => {
        if (messageToEdit || replyTo) {
            inputRef.current?.focus();
        }
    }, [messageToEdit, replyTo]);

    const handleAvatarUpdate = async (newPhotoURL: string) => {
        if (!userToEditAvatar || !isDeveloper) return;
        try {
            const userDocRef = doc(db, 'users', userToEditAvatar.uid);
            // Use setDoc with merge to create the document if it doesn't exist,
            // or update it if it does. This handles guest users or deleted users
            // who might not have a document in the 'users' collection.
            await setDoc(userDocRef, { photoURL: newPhotoURL }, { merge: true });

            // Update local profiles state for immediate UI feedback
            setUserProfiles(prev => ({
                ...prev,
                [userToEditAvatar.uid]: { ...prev[userToEditAvatar.uid], photoURL: newPhotoURL }
            }));
            
            showAlert('تم تحديث الصورة الرمزية بنجاح.', 'success');
        } catch (error) {
            console.error("Error updating avatar from chat:", error);
            showAlert('فشل تحديث الصورة الرمزية.', 'error');
        } finally {
            setShowAvatarPicker(false);
            setUserToEditAvatar(null);
        }
    };

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            // Show button if user has scrolled up more than 200px from the bottom
            const isScrolledUp = scrollHeight - scrollTop > clientHeight + 200;
            setShowScrollToBottom(isScrolledUp);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleScrollToMessage = (messageId: string) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const bubble = element.querySelector('[class*="bg-sky-"]');
            if (bubble) {
                bubble.classList.add('animate-pulse');
                setTimeout(() => {
                    bubble.classList.remove('animate-pulse');
                }, 2000);
            }
        }
    };

    // Handle sending a message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        if (currentUserProfile.isMuted) {
            showAlert("أنت ممنوع من الكتابة.", "error");
            return;
        }

        try {
            if (messageToEdit) {
                await updateDoc(doc(db, 'public_chat', messageToEdit.id), { text: newMessage });
                setMessageToEdit(null);
            } else {
                await addDoc(collection(db, 'public_chat'), {
                    text: newMessage,
                    timestamp: serverTimestamp(),
                    uid: user.uid,
                    displayName: currentUserProfile.displayName,
                    photoURL: currentUserProfile.photoURL || null,
                    replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, displayName: replyTo.displayName } : null,
                });
            }
            setNewMessage('');
            setReplyTo(null);
        } catch (error) {
            console.error("Error sending message:", error);
            showAlert("حدث خطأ أثناء إرسال الرسالة.", "error");
        }
    };
    
    const isSupervisor = currentUserProfile.role === 'supervisor';

    // Handle message actions from options menu
    const handleReply = (message: Message) => setReplyTo(message);
    const handleEdit = (message: Message) => {
        setMessageToEdit(message);
        setNewMessage(message.text);
    };
    const handleDelete = async () => {
        if (messageToDelete) {
            await deleteDoc(doc(db, 'public_chat', messageToDelete.id));
            setMessageToDelete(null);
        }
    };
    const handlePin = async (message: Message) => {
        const pinDocRef = doc(db, 'app_config', 'pinned_message');
        const profile = userProfiles[message.uid];
        const displayName = profile ? profile.displayName : message.displayName;
        await setDoc(pinDocRef, {
            id: message.id,
            text: message.text,
            uid: message.uid,
            displayName: displayName,
        });
        showAlert("تم تثبيت الرسالة بنجاح.", "success");
    };
    
    const handleUnpin = async () => {
        if (!isDeveloper && !isSupervisor) return;
        const pinDocRef = doc(db, 'app_config', 'pinned_message');
        try {
            await deleteDoc(pinDocRef);
            showAlert("تم إلغاء تثبيت الرسالة بنجاح.", "success");
        } catch (error) {
            console.error("Error unpinning message:", error);
            showAlert("حدث خطأ أثناء إلغاء تثبيت الرسالة.", "error");
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        showAlert("تم نسخ النص بنجاح.", "success");
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        const messageRef = doc(db, 'public_chat', messageId);
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        const reactions = { ...(message.reactions || {}) };
        const usersForEmoji = reactions[emoji] || [];

        if (usersForEmoji.includes(user.uid)) {
            // User is removing their reaction
            reactions[emoji] = usersForEmoji.filter(uid => uid !== user.uid);
            if (reactions[emoji].length === 0) {
                delete reactions[emoji];
            }
        } else {
            // User is adding a reaction
            reactions[emoji] = [...usersForEmoji, user.uid];
        }

        await updateDoc(messageRef, { reactions });
    };
    
    const handleOpenUserProfile = (message: Message) => {
         if (message.uid === user.uid) return;
         const profile = userProfiles[message.uid];
         if (profile) {
            setSelectedUserProfile(profile);
         }
    };

    const handleAdminAction = async (targetUser: UserProfile, action: 'mute' | 'role') => {
        const userDocRef = doc(db, 'users', targetUser.uid);
        let updateData: { isMuted: boolean } | { role: 'supervisor' | null } = { isMuted: false };
        let successMessage = '';
        
        if (action === 'mute') {
            const newMutedStatus = !targetUser.isMuted;
            updateData = { isMuted: newMutedStatus };
            successMessage = `تم ${newMutedStatus ? 'كتم' : 'إلغاء كتم'} ${targetUser.displayName} بنجاح.`;
        } else if (action === 'role') {
            const newRole = targetUser.role === 'supervisor' ? null : 'supervisor';
            updateData = { role: newRole };
            successMessage = `تم ${newRole ? 'ترقية' : 'تخفيض رتبة'} ${targetUser.displayName} بنجاح.`;
        }
        
        try {
            await updateDoc(userDocRef, updateData);
            showAlert(successMessage, 'success');
            
            setUserProfiles(prev => ({
                ...prev,
                [targetUser.uid]: { ...prev[targetUser.uid], ...updateData }
            }));
            
            setSelectedUserProfile(prev => prev ? { ...prev, ...updateData } as UserProfile : null);

        } catch (error) {
            console.error("Error performing admin action:", error);
            showAlert("حدث خطأ.", "error");
        }
    };

    const cancelEditOrReply = () => {
        setMessageToEdit(null);
        setReplyTo(null);
        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-full relative">
            {pinnedMessage && (
                <button onClick={() => handleScrollToMessage(pinnedMessage.id)} className="w-full text-left p-2 bg-sky-800/70 hover:bg-sky-800 transition-colors flex-shrink-0">
                    <div className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-start gap-2 flex-grow min-w-0">
                            <PinIcon className="w-4 h-4 text-cyan-300 mt-1 flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold text-cyan-200 truncate">رسالة مثبتة من {pinnedMessage.displayName}</p>
                                <p className="text-sky-300 truncate">{pinnedMessage.text}</p>
                            </div>
                        </div>
                        {(isDeveloper || isSupervisor) && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleUnpin(); }} 
                                className="p-1.5 text-red-400 hover:text-red-200 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                                title="إلغاء تثبيت الرسالة"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </button>
            )}
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-grow p-4 flex flex-col overflow-y-auto">
                {messages.map((msg, index) => {
                    const profile = userProfiles[msg.uid];
                    if (profile?.isMuted && !isDeveloper) return null;

                    const isMyMessage = msg.uid === user.uid;

                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

                    const isStartOfGroup = !prevMessage || prevMessage.uid !== msg.uid ||
                        !isValidTimestamp(msg.timestamp) || !isValidTimestamp(prevMessage.timestamp) ||
                        (msg.timestamp.toDate().getTime() - prevMessage.timestamp.toDate().getTime() > 5 * 60 * 1000);

                    const isEndOfGroup = !nextMessage || nextMessage.uid !== msg.uid ||
                        !isValidTimestamp(nextMessage.timestamp) || !isValidTimestamp(msg.timestamp) ||
                        (nextMessage.timestamp.toDate().getTime() - msg.timestamp.toDate().getTime() > 5 * 60 * 1000);

                    const displayName = profile ? profile.displayName : msg.displayName;
                    const photoURL = profile ? profile.photoURL : msg.photoURL;
                    
                    const position = isStartOfGroup && isEndOfGroup ? 'single' : isStartOfGroup ? 'start' : isEndOfGroup ? 'end' : 'middle';
                    
                    let bubbleClasses = 'group relative p-3 ';
                    if (isMyMessage) {
                        bubbleClasses += 'bg-sky-600 ';
                        switch (position) {
                            case 'single': bubbleClasses += 'rounded-lg rounded-br-none'; break;
                            case 'start': bubbleClasses += 'rounded-t-lg rounded-bl-lg'; break;
                            case 'middle': bubbleClasses += 'rounded-l-lg'; break;
                            case 'end': bubbleClasses += 'rounded-b-lg rounded-tl-lg rounded-br-none'; break;
                        }
                    } else {
                        bubbleClasses += 'bg-sky-800 ';
                        switch (position) {
                            case 'single': bubbleClasses += 'rounded-lg rounded-bl-none'; break;
                            case 'start': bubbleClasses += 'rounded-t-lg rounded-br-lg'; break;
                            case 'middle': bubbleClasses += 'rounded-r-lg'; break;
                            case 'end': bubbleClasses += 'rounded-b-lg rounded-tr-lg rounded-bl-none'; break;
                        }
                    }
                     if (profile?.isMuted) {
                        bubbleClasses += ' opacity-50 border-2 border-dashed border-red-500/50';
                    }

                    return (
                        <div key={msg.id} id={`msg-${msg.id}`} className={`flex items-end gap-2 ${isMyMessage ? 'flex-row-reverse' : ''} ${isStartOfGroup ? 'mt-4' : 'mt-1'}`}>
                             <div className="relative flex-shrink-0 w-8 h-8">
                                {isEndOfGroup && !isMyMessage && (
                                     <>
                                        <img
                                            src={photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=0284c7&color=fff&size=128`}
                                            alt={displayName}
                                            className="w-8 h-8 rounded-full object-cover cursor-pointer"
                                            onClick={() => handleOpenUserProfile(msg)}
                                        />
                                        {isDeveloper && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (profile) {
                                                        setUserToEditAvatar(profile);
                                                        setShowAvatarPicker(true);
                                                    }
                                                }}
                                                className="absolute -bottom-1 -right-1 bg-sky-600 p-1 rounded-full hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 ring-offset-2 ring-offset-sky-950 ring-sky-300 cursor-pointer"
                                                aria-label={`تغيير صورة ${displayName}`}
                                            >
                                                <CameraIcon className="w-4 h-4 text-white" />
                                            </button>
                                        )}
                                     </>
                                )}
                            </div>
                            <div className={`flex flex-col max-w-xs ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                {isStartOfGroup && !isMyMessage && (
                                    <div className="flex items-center gap-2 mb-1 ml-2">
                                        <p className="text-sm font-semibold text-sky-300 cursor-pointer" onClick={() => handleOpenUserProfile(msg)}>{displayName}</p>
                                        {profile?.role === 'supervisor' && <span className="text-xs font-bold text-yellow-400 bg-yellow-900/50 px-2 py-0.5 rounded-full">مشرف</span>}
                                        {profile?.isMuted && <span className="text-xs font-bold text-red-400 bg-red-900/50 px-2 py-0.5 rounded-full">مكتوم</span>}
                                    </div>
                                )}
                                <div className={bubbleClasses}>
                                    {msg.replyTo && (
                                        <a href={`#msg-${msg.replyTo.id}`} onClick={(e) => { e.preventDefault(); handleScrollToMessage(msg.replyTo.id); }} className="block p-2 mb-2 border-r-2 border-sky-400 bg-black/20 rounded text-sm text-sky-300 hover:bg-black/30 transition-colors">
                                            <p className="font-bold">{msg.replyTo.displayName}</p>
                                            <p className="line-clamp-1">{msg.replyTo.text}</p>
                                        </a>
                                    )}
                                    <p className="whitespace-pre-line break-words">{msg.text}</p>
                                    
                                    {isEndOfGroup && <span className="text-xs text-sky-300/70 float-left mt-1 ml-2">{msg.timestamp && isValidTimestamp(msg.timestamp) ? formatTime(msg.timestamp.toDate()) : ''}</span>}
                                    
                                    <ReactionList reactions={msg.reactions || {}} currentUserId={user.uid} onReactionClick={(emoji) => handleReaction(msg.id, emoji)} />

                                    <div className={`absolute top-1/2 -translate-y-1/2 p-1 rounded-full bg-sky-900/80 group-hover:opacity-100 opacity-0 transition-opacity ${isMyMessage ? 'left-[-36px]' : 'right-[-36px]'}`}>
                                        <button onClick={() => setSelectedMessage(msg)}>
                                            <OptionsIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            
            {showScrollToBottom && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-28 left-6 z-10 w-12 h-12 bg-sky-600/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-lg hover:bg-sky-500 transition-all duration-300 animate-fade-in"
                    aria-label="الانتقال إلى الأسفل"
                >
                    <ChevronDownIcon className="w-6 h-6" />
                </button>
            )}

            <footer className="p-4 border-t border-sky-400/30 flex-shrink-0">
                {(messageToEdit || replyTo) && (
                     <div className="bg-sky-800/50 p-2 rounded-t-lg flex justify-between items-center text-sm">
                        <div>
                            <p className="font-bold text-sky-200">{messageToEdit ? 'تعديل الرسالة' : `الرد على ${replyTo?.displayName}`}</p>
                            <p className="text-sky-300 line-clamp-1">{messageToEdit?.text || replyTo?.text}</p>
                        </div>
                        <button onClick={cancelEditOrReply} className="p-1 rounded-full hover:bg-white/10">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-start gap-2">
                    <textarea
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={currentUserProfile.isMuted ? "أنت ممنوع من الكتابة." : "اكتب رسالتك..."}
                        className="w-full bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none max-h-24"
                        disabled={currentUserProfile.isMuted}
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e as any);
                            }
                        }}
                    />
                    <button type="submit" className="bg-sky-600 hover:bg-sky-500 rounded-lg p-2.5 transition-colors disabled:opacity-50 flex-shrink-0" disabled={!newMessage.trim() || currentUserProfile.isMuted}>
                        {messageToEdit ? <CheckIcon className="w-6 h-6"/> : <SendIcon className="w-6 h-6" />}
                    </button>
                </form>
            </footer>

            {selectedMessage && (
                <MessageOptionsMenu 
                    message={selectedMessage}
                    user={user}
                    onClose={() => setSelectedMessage(null)}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={(msg) => setMessageToDelete(msg)}
                    onPin={handlePin}
                    onCopy={handleCopy}
                    onReaction={(emoji) => handleReaction(selectedMessage.id, emoji)}
                    canDeleteAnyMessage={isDeveloper || isSupervisor}
                    canPinMessage={isDeveloper || isSupervisor}
                />
            )}
            {messageToDelete && (
                <DeleteMessageModal 
                    onConfirm={handleDelete}
                    onClose={() => setMessageToDelete(null)}
                />
            )}
            {selectedUserProfile && (
                <UserProfileModal
                    isOpen={!!selectedUserProfile}
                    onClose={() => setSelectedUserProfile(null)}
                    userProfile={selectedUserProfile}
                    onStartPrivateChat={onStartPrivateChat}
                    onBlockUser={onBlockUser}
                    onUnblockUser={onUnblockUser}
                    isBlocked={blockedUsers.includes(selectedUserProfile.uid)}
                    isDeveloper={isDeveloper}
                    onAdminAction={handleAdminAction}
                />
            )}
             <AvatarPickerModal 
                isOpen={showAvatarPicker}
                onClose={() => {
                    setShowAvatarPicker(false);
                    setUserToEditAvatar(null);
                }}
                onSelectAvatar={handleAvatarUpdate}
            />
        </div>
    );
};

export default PublicChat;