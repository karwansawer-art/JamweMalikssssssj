import React, { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, arrayUnion, arrayRemove, deleteDoc, setDoc, deleteField, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { Message, Group, UserProfile, PinnedMessage } from '../../types.ts';
import { CloseIcon, SendIcon, CheckIcon, LeaveIcon, UserGroupIcon, BackIcon, OptionsIcon, PinIcon, KickIcon, TrashIcon, SettingsIcon, LockIcon, PromoteIcon, DemoteIcon } from '../ui/Icons.tsx';
import MessageOptionsMenu from './MessageOptionsMenu.tsx';
import DeleteMessageModal from './DeleteMessageModal.tsx';
import EditGroupModal from './EditGroupModal.tsx';
import { ADMIN_UIDS, REACTION_EMOJIS } from '../../constants.tsx';

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


// Helper to format timestamp
const formatTime = (date: Date): string => date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
const isValidTimestamp = (ts: any) => ts && typeof ts.toDate === 'function';

// Confirmation Modals (defined inside to keep changes minimal)
const LeaveGroupConfirmModal: React.FC<{onConfirm: () => void, onClose: () => void}> = ({ onConfirm, onClose }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
      <div className="w-full max-w-sm bg-sky-950 border border-red-500/50 rounded-lg p-6 space-y-4 text-white">
        <h3 className="text-xl font-bold text-red-400 text-center">مغادرة المجموعة</h3>
        <p className="text-sky-200 text-center">هل أنت متأكد من رغبتك في مغادرة هذه المجموعة؟</p>
        <div className="flex justify-center gap-4 pt-4">
          <button onClick={onClose} className="px-6 py-2 font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-500">إلغاء</button>
          <button onClick={onConfirm} className="px-6 py-2 font-semibold text-white rounded-md bg-red-600 hover:bg-red-500">مغادرة</button>
        </div>
      </div>
    </div>
);

const KickMemberConfirmModal: React.FC<{ memberName: string, onConfirm: () => void, onClose: () => void}> = ({ memberName, onConfirm, onClose }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4">
      <div className="w-full max-w-sm bg-sky-950 border border-red-500/50 rounded-lg p-6 space-y-4 text-white">
        <h3 className="text-xl font-bold text-red-400 text-center">تأكيد الطرد</h3>
        <p className="text-sky-200 text-center">هل أنت متأكد من رغبتك في طرد {memberName} من المجموعة؟</p>
        <div className="flex justify-center gap-4 pt-4">
          <button onClick={onClose} className="px-6 py-2 font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-500">إلغاء</button>
          <button onClick={onConfirm} className="px-6 py-2 font-semibold text-white rounded-md bg-red-600 hover:bg-red-500">طرد</button>
        </div>
      </div>
    </div>
);

const DeleteGroupConfirmModal: React.FC<{onConfirm: () => void, onClose: () => void}> = ({ onConfirm, onClose }) => {
    const [confirmText, setConfirmText] = useState('');
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="w-full max-w-sm bg-sky-950 border border-red-500/50 rounded-lg p-6 space-y-4 text-white">
            <h3 className="text-xl font-bold text-red-400 text-center">حذف المجموعة</h3>
            <p className="text-sky-200 text-center">هل أنت متأكد من رغبتك في حذف هذه المجموعة بشكل دائم؟ لا يمكن التراجع عن هذا الإجراء.</p>
             <p className="text-sm text-sky-300 text-center">للتأكيد، يرجى كتابة <span className="font-bold text-red-400">حذف</span> في المربع أدناه.</p>
            <input
                type="text"
                className="w-full bg-black/30 border border-red-400/50 rounded-md p-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                autoFocus
            />
            <div className="flex justify-center gap-4 pt-2">
              <button onClick={onClose} className="px-6 py-2 font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-500">إلغاء</button>
              <button 
                onClick={onConfirm}
                disabled={confirmText !== 'حذف'}
                className="px-6 py-2 font-semibold text-white rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
    );
};


interface GroupChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    currentUserProfile: UserProfile;
    group: Group;
    isDeveloper: boolean;
}

const GroupChatModal: React.FC<GroupChatModalProps> = ({ isOpen, onClose, user, currentUserProfile, group: initialGroup, isDeveloper }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [messageToEdit, setMessageToEdit] = useState<Message | null>(null);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [userProfiles, setUserProfiles] = useState<{ [uid: string]: UserProfile }>({});
    const [currentGroup, setCurrentGroup] = useState<Group>(initialGroup);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [view, setView] = useState<'chat' | 'members'>('chat');
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
    const [memberToKick, setMemberToKick] = useState<UserProfile | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const isActualMember = currentGroup.members.includes(user.uid);
    const isOwner = user.uid === currentGroup.createdBy;
    const isGroupSupervisor = currentGroup.supervisors?.includes(user.uid);
    const canManageMessages = isOwner || isGroupSupervisor;
    const canManageMembers = isOwner || isDeveloper;
    const canEditGroup = isOwner || isGroupSupervisor || isDeveloper;
    const hasPendingRequests = canManageMembers && currentGroup.joinRequests && currentGroup.joinRequests.length > 0;

    useEffect(() => {
        if (!isOpen) return;
        
        const groupDocRef = doc(db, 'groups', initialGroup.id);
        const unsubscribeGroup = onSnapshot(groupDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setCurrentGroup({ id: docSnap.id, ...docSnap.data() } as Group);
            } else {
                onClose(); // Group was deleted
            }
        });

        const markAsRead = async () => {
            if (isActualMember) {
                 await updateDoc(groupDocRef, { [`unreadStatus.${user.uid}`]: false }).catch(console.warn);
            }
        };
        markAsRead();

        if (isActualMember || isDeveloper) {
            const messagesCollection = collection(db, 'groups', initialGroup.id, 'messages');
            const q = query(messagesCollection, orderBy('timestamp'));
            const unsubscribeMessages = onSnapshot(q, (snapshot) => {
                const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
                setMessages(fetchedMessages);
            });
            return () => {
                unsubscribeGroup();
                unsubscribeMessages();
            };
        }

        return () => unsubscribeGroup();
    }, [isOpen, initialGroup.id, user.uid, isActualMember, isDeveloper, onClose]);
    
    useEffect(() => {
        const uidsToFetch = new Set<string>();
        messages.forEach(m => uidsToFetch.add(m.uid));
        if (view === 'members' || !isActualMember) {
            currentGroup.members.forEach(m => uidsToFetch.add(m));
        }
        if (hasPendingRequests) {
            currentGroup.joinRequests?.forEach(uid => uidsToFetch.add(uid));
        }

        const fetchUserProfiles = async () => {
            const profilesToFetch = Array.from(uidsToFetch).filter(uid => !userProfiles[uid]);
            if (profilesToFetch.length > 0) {
                const fetchedProfiles: { [uid: string]: UserProfile } = {};
                const promises = profilesToFetch.map(async (uid) => {
                    const userDocRef = doc(db, 'users', uid);
                    try {
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            fetchedProfiles[uid] = { uid: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
                        }
                    } catch(e) { console.error("Error fetching user profile:", e); }
                });
                await Promise.all(promises);
                setUserProfiles(prev => ({ ...prev, ...fetchedProfiles }));
            }
        };

        fetchUserProfiles();
    }, [messages, view, currentGroup.members, currentGroup.joinRequests, hasPendingRequests, isActualMember]);


    useEffect(() => {
        if(view === 'chat' && isActualMember) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages, view, isActualMember]);

    useEffect(() => { // Focus input when editing or replying
        if (messageToEdit || replyTo) {
            inputRef.current?.focus();
            // Adjust textarea height
            if (inputRef.current) {
                inputRef.current.style.height = 'auto';
                inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
            }
        }
    }, [messageToEdit, replyTo]);

    // Auto-growing textarea handler
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        e.currentTarget.style.height = 'auto';
        e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !isActualMember) return;

        const messagesCollection = collection(db, 'groups', currentGroup.id, 'messages');
        const timestamp = serverTimestamp();
        
        try {
            if (messageToEdit) {
                 await updateDoc(doc(messagesCollection, messageToEdit.id), { text: newMessage });
                 setMessageToEdit(null);
            } else {
                 await addDoc(messagesCollection, {
                    text: newMessage,
                    timestamp: timestamp,
                    uid: user.uid,
                    displayName: user.displayName,
                    photoURL: user.photoURL || null,
                    replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, displayName: replyTo.displayName } : null,
                });
            }
            
            const newUnreadStatus = { ...(currentGroup.unreadStatus || {}) };
            currentGroup.members.forEach(memberId => {
                if (memberId !== user.uid) newUnreadStatus[memberId] = true;
            });
            newUnreadStatus[user.uid] = false;

             await updateDoc(doc(db, 'groups', currentGroup.id), {
                lastMessage: messageToEdit ? currentGroup.lastMessage : newMessage, // Don't update last message on edit
                lastMessageTimestamp: timestamp,
                unreadStatus: newUnreadStatus,
            });

            setNewMessage('');
            setReplyTo(null);
        } catch (error) {
            console.error("Error sending group message:", error);
        }
    };
    
    const handleJoinPublicGroup = async () => {
        await updateDoc(doc(db, 'groups', currentGroup.id), { members: arrayUnion(user.uid) });
    };

    const handleRequestToJoin = async () => {
        await updateDoc(doc(db, 'groups', currentGroup.id), { joinRequests: arrayUnion(user.uid) });
    };
    
    const handleLeaveGroup = async () => {
        await updateDoc(doc(db, 'groups', currentGroup.id), { members: arrayRemove(user.uid) });
        setShowLeaveConfirm(false);
        onClose();
    };
    
    const handleManageRequest = async (requesterUid: string, action: 'accept' | 'decline') => {
        const groupDocRef = doc(db, 'groups', currentGroup.id);
        if (action === 'accept') {
            await updateDoc(groupDocRef, {
                members: arrayUnion(requesterUid),
                joinRequests: arrayRemove(requesterUid)
            });
        } else { // decline
            await updateDoc(groupDocRef, {
                joinRequests: arrayRemove(requesterUid)
            });
        }
    };

    const handleKickMember = async () => {
        if (!memberToKick || !canManageMembers) return;
        await updateDoc(doc(db, 'groups', currentGroup.id), { members: arrayRemove(memberToKick.uid) });
        setMemberToKick(null);
    };

    const handleDeleteGroup = async () => {
        if (!isOwner && !isDeveloper) return;
        try {
            const groupDocRef = doc(db, 'groups', currentGroup.id);
            const messagesCollectionRef = collection(db, 'groups', currentGroup.id, 'messages');
            
            const messagesSnapshot = await getDocs(messagesCollectionRef);
            const batch = writeBatch(db);
            
            messagesSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            batch.delete(groupDocRef);
            
            await batch.commit();
            
            setShowDeleteConfirm(false);
            onClose();
        } catch (error) {
            console.error("Error deleting group:", error);
        }
    };
    
    const handleToggleSupervisorStatus = async (profileToUpdate: UserProfile) => {
        if (!canManageMembers) return;
        const isCurrentlySupervisor = currentGroup.supervisors?.includes(profileToUpdate.uid);
        const groupDocRef = doc(db, 'groups', currentGroup.id);
        await updateDoc(groupDocRef, {
            supervisors: isCurrentlySupervisor ? arrayRemove(profileToUpdate.uid) : arrayUnion(profileToUpdate.uid)
        });
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        const messageRef = doc(db, 'groups', currentGroup.id, 'messages', messageId);
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

    const handleReply = (message: Message) => { setSelectedMessage(null); setReplyTo(message); };
    const handleEdit = (message: Message) => { setSelectedMessage(null); setMessageToEdit(message); setNewMessage(message.text); };
    const handleDelete = async () => {
        if (messageToDelete) {
            await deleteDoc(doc(db, 'groups', currentGroup.id, 'messages', messageToDelete.id));
            setMessageToDelete(null);
        }
    };
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setSelectedMessage(null);
    };
    const handlePin = async (message: Message) => {
        const profile = userProfiles[message.uid];
        const displayName = profile ? profile.displayName : message.displayName;
        const pinnedMessage: PinnedMessage = {
            id: message.id, text: message.text, uid: message.uid, displayName: displayName
        };
        await updateDoc(doc(db, 'groups', currentGroup.id), { pinnedMessage });
        setSelectedMessage(null);
    };
    const handleUnpin = async () => {
        await updateDoc(doc(db, 'groups', currentGroup.id), { pinnedMessage: deleteField() });
    };
    
    const cancelEditOrReply = () => {
        setMessageToEdit(null);
        setReplyTo(null);
        setNewMessage('');
    };
    
    if (!isOpen) return null;

    const renderChatView = () => (
        <>
            {currentGroup.pinnedMessage && (
                 <button onClick={() => handleScrollToMessage(currentGroup.pinnedMessage.id)} className="w-full text-left p-2 bg-sky-800/70 hover:bg-sky-800 transition-colors flex-shrink-0">
                    <div className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-start gap-2 flex-grow min-w-0">
                            <PinIcon className="w-4 h-4 text-cyan-300 mt-1 flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold text-cyan-200 truncate">رسالة مثبتة من {currentGroup.pinnedMessage.displayName}</p>
                                <p className="text-sky-300 truncate">{currentGroup.pinnedMessage.text}</p>
                            </div>
                        </div>
                        {canManageMessages && (
                            <button onClick={(e) => {e.stopPropagation(); handleUnpin();}} className="p-1.5 text-red-400 hover:text-red-200 rounded-full hover:bg-white/10 transition-colors" title="إلغاء تثبيت الرسالة">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </button>
            )}
            <div className="flex-grow p-4 flex flex-col overflow-y-auto">
                 {messages.map((msg, index) => {
                    const isMyMessage = msg.uid === user.uid;

                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

                    const isStartOfGroup = !prevMessage || prevMessage.uid !== msg.uid ||
                        !isValidTimestamp(msg.timestamp) || !isValidTimestamp(prevMessage.timestamp) ||
                        (msg.timestamp.toDate().getTime() - prevMessage.timestamp.toDate().getTime() > 5 * 60 * 1000);

                    const isEndOfGroup = !nextMessage || nextMessage.uid !== msg.uid ||
                        !isValidTimestamp(nextMessage.timestamp) || !isValidTimestamp(msg.timestamp) ||
                        (nextMessage.timestamp.toDate().getTime() - msg.timestamp.toDate().getTime() > 5 * 60 * 1000);

                    const profile = userProfiles[msg.uid];
                    const displayName = profile ? profile.displayName : 'مستخدم محذوف';
                    const photoURL = profile ? profile.photoURL : '';

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

                    return (
                        <div key={msg.id} id={`msg-${msg.id}`} className={`flex items-end gap-2 ${isMyMessage ? 'flex-row-reverse' : ''} ${isStartOfGroup ? 'mt-4' : 'mt-1'}`}>
                            <div className="flex-shrink-0 w-8 h-8">
                                {isEndOfGroup && !isMyMessage && (
                                     <img src={photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=0284c7&color=fff&size=128`} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
                                )}
                            </div>
                            <div className={`flex flex-col max-w-xs ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                {isStartOfGroup && !isMyMessage && <p className="text-sm font-semibold text-sky-300 mb-1 ml-2">{displayName}</p>}
                                <div className={bubbleClasses}>
                                    {msg.replyTo && (
                                        <a href={`#msg-${msg.replyTo.id}`} onClick={(e) => { e.preventDefault(); handleScrollToMessage(msg.replyTo.id); }} className="block p-2 mb-2 border-r-2 border-sky-400 bg-black/20 rounded text-sm text-sky-300 hover:bg-black/30 transition-colors">
                                            <p className="font-bold">{msg.replyTo.displayName}</p>
                                            <p className="line-clamp-1">{msg.replyTo.text}</p>
                                        </a>
                                    )}
                                    <p className="whitespace-pre-line break-words">{msg.text}</p>
                                    {isEndOfGroup && <span className="text-xs text-sky-300/70 float-left mt-1 ml-2">{isValidTimestamp(msg.timestamp) ? formatTime(msg.timestamp.toDate()) : ''}</span>}
                                    
                                    <ReactionList reactions={msg.reactions || {}} currentUserId={user.uid} onReactionClick={(emoji) => handleReaction(msg.id, emoji)} />

                                    <div className={`absolute top-1/2 -translate-y-1/2 p-1 rounded-full bg-sky-900/80 group-hover:opacity-100 opacity-0 transition-opacity ${isMyMessage ? 'left-[-36px]' : 'right-[-36px]'}`}>
                                        <button onClick={() => setSelectedMessage(msg)}><OptionsIcon className="w-5 h-5 text-sky-300" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        </>
    );

    const renderMembersView = () => (
        <div className="p-4 space-y-3 overflow-y-auto">
            {hasPendingRequests && (
                <div className="mb-4">
                    <h4 className="font-semibold text-yellow-300 mb-2 px-2">طلبات الانضمام ({currentGroup.joinRequests?.length})</h4>
                    <div className="space-y-2">
                        {currentGroup.joinRequests?.map(uid => {
                            const profile = userProfiles[uid];
                            if (!profile) return null;
                            return (
                                <div key={uid} className="flex items-center justify-between p-2 rounded-lg bg-sky-800/70">
                                    <div className="flex items-center gap-3">
                                        <img src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}&background=0369a1&color=fff&size=128`} alt={profile.displayName} className="w-10 h-10 rounded-full object-cover" />
                                        <p className="font-semibold">{profile.displayName}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleManageRequest(uid, 'decline')} className="px-3 py-1 text-sm bg-red-600 hover:bg-red-500 rounded-md">رفض</button>
                                        <button onClick={() => handleManageRequest(uid, 'accept')} className="px-3 py-1 text-sm bg-green-600 hover:bg-green-500 rounded-md">قبول</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            
            {currentGroup.description && (
                <div className="p-4 mb-3 bg-sky-900/50 rounded-lg">
                    <h4 className="font-semibold text-sky-300 mb-1">الوصف</h4>
                    <p className="text-sky-200 whitespace-pre-wrap break-words">{currentGroup.description}</p>
                </div>
            )}
            <h4 className="font-semibold text-sky-300 px-2">الأعضاء</h4>
            {currentGroup.members.map(uid => {
                const profile = userProfiles[uid];
                if (!profile) return <div key={uid} className="h-14 bg-sky-800/50 rounded-lg animate-pulse"></div>;
                const isProfileOwner = profile.uid === currentGroup.createdBy;
                const isProfileSupervisor = currentGroup.supervisors?.includes(profile.uid);

                return (
                    <div key={uid} className="flex items-center justify-between p-2 rounded-lg hover:bg-sky-800/50">
                        <div className="flex items-center gap-3">
                            <img src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || ' '}&background=0369a1&color=fff&size=128`} alt={profile.displayName} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <p className="font-semibold">{profile.displayName}</p>
                                {isProfileOwner && <p className="text-xs text-yellow-400">مالک</p>}
                                {isProfileSupervisor && !isProfileOwner && <p className="text-xs text-yellow-400">مشرف</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {canManageMembers && !isProfileOwner && user.uid !== profile.uid && (
                                 <button 
                                    onClick={() => handleToggleSupervisorStatus(profile)} 
                                    className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-full transition-colors"
                                    title={isProfileSupervisor ? "تخفيض إلى عضو" : "ترقية إلى مشرف"}
                                >
                                    {isProfileSupervisor ? <DemoteIcon className="w-6 h-6"/> : <PromoteIcon className="w-6 h-6"/>}
                                </button>
                            )}
                            {canManageMembers && !isProfileOwner && user.uid !== profile.uid && (
                                <button onClick={() => setMemberToKick(profile)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-full transition-colors">
                                    <KickIcon className="w-6 h-6"/>
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
    
    const renderNonMemberView = () => {
        const hasRequested = currentGroup.joinRequests?.includes(user.uid);
        
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                 <img src={currentGroup.photoURL || `https://ui-avatars.com/api/?name=${currentGroup.name || ' '}&background=0369a1&color=fff&size=128`} alt={currentGroup.name} className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-sky-600" />
                 <h3 className="text-2xl font-bold">{currentGroup.name}</h3>
                 <div className="flex items-center gap-2 text-sm text-sky-400 my-2">
                    {currentGroup.type === 'private' && <LockIcon className="w-4 h-4" />}
                    <span>{currentGroup.type === 'public' ? 'مجموعة عامة' : 'مجموعة خاصة'}</span>
                    <span>•</span>
                    <span>{currentGroup.members.length} أعضاء</span>
                 </div>
                 {currentGroup.description && <p className="text-sky-300 my-4 whitespace-pre-wrap break-words">{currentGroup.description}</p>}

                 <div className="mt-auto w-full max-w-xs">
                     {currentGroup.type === 'public' ? (
                        <button onClick={handleJoinPublicGroup} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-teal-600 hover:bg-teal-500 disabled:opacity-50">
                            الانضمام إلى المجموعة
                        </button>
                     ) : hasRequested ? (
                         <button disabled className="w-full text-white font-bold py-3 px-4 rounded-lg bg-gray-600 opacity-70">
                            تم إرسال الطلب
                        </button>
                     ) : (
                         <button onClick={handleRequestToJoin} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-sky-600 hover:bg-sky-500 disabled:opacity-50">
                            طلب انضمام
                        </button>
                     )}
                 </div>
            </div>
        );
    };

    return (
        <div className="absolute inset-0 bg-sky-950 flex flex-col">
            <header className="p-4 border-b border-sky-400/30 flex justify-between items-center flex-shrink-0">
                {view === 'members' ? (
                     <>
                        <button onClick={() => setView('chat')} className="p-2 rounded-full hover:bg-white/10"><BackIcon className="w-6 h-6"/></button>
                        <h3 className="font-bold text-lg">الأعضاء ({currentGroup.members.length})</h3>
                        <div className="w-10"></div>
                     </>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <img src={currentGroup.photoURL || `https://ui-avatars.com/api/?name=${currentGroup.name || ' '}&background=0369a1&color=fff&size=128`} alt={currentGroup.name} className="w-10 h-10 rounded-full object-cover" />
                            <h3 className="font-bold text-lg">{currentGroup.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                             {isActualMember && (
                                <button onClick={() => setView('members')} title="الأعضاء" className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
                                    <UserGroupIcon className="w-6 h-6"/>
                                    {hasPendingRequests && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-sky-950"></span>}
                                </button>
                             )}
                             {canEditGroup && (
                                <button onClick={() => setShowGroupSettings(true)} title="إعدادات المجموعة" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                    <SettingsIcon className="w-6 h-6"/>
                                </button>
                            )}
                            {isActualMember && (
                                <button onClick={() => setShowLeaveConfirm(true)} title="مغادرة المجموعة" className="p-2 rounded-full text-red-400 hover:bg-red-500/20 transition-colors">
                                    <LeaveIcon className="w-6 h-6"/>
                                </button>
                            )}
                            {(isOwner || isDeveloper) && (
                                <button onClick={() => setShowDeleteConfirm(true)} title="حذف المجموعة" className="p-2 rounded-full text-red-400 hover:bg-red-500/20 transition-colors">
                                    <TrashIcon className="w-6 h-6"/>
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6"/></button>
                        </div>
                    </>
                )}
            </header>
            <main className="flex-grow overflow-y-auto flex flex-col">
                {(isActualMember || isDeveloper) ? (view === 'chat' ? renderChatView() : renderMembersView()) : renderNonMemberView()}
            </main>
            {(isActualMember || isDeveloper) && view === 'chat' && (
                <footer className="p-4 border-t border-sky-400/30 flex-shrink-0">
                    {(messageToEdit || replyTo) && (
                        <div className="bg-sky-800/50 p-2 rounded-t-lg flex justify-between items-center text-sm">
                            <div>
                                <p className="font-bold text-sky-200">{messageToEdit ? 'تعديل الرسالة' : `الرد على ${replyTo?.displayName}`}</p>
                                <p className="text-sky-300 line-clamp-1">{messageToEdit?.text || replyTo?.text}</p>
                            </div>
                            <button onClick={cancelEditOrReply} className="p-1 rounded-full hover:bg-white/10"><CloseIcon className="w-5 h-5" /></button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-start gap-2">
                        <textarea
                            ref={inputRef} // Added ref
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onInput={handleInput} // Add onInput handler for auto-growing
                            placeholder="اكتب رسالتك..."
                            className="w-full bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none max-h-24" // Added resize-none max-h-24
                            rows={1} // Set initial rows to 1
                            onKeyDown={(e) => { // Added onKeyDown handler
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e as any);
                                }
                            }} />
                        <button type="submit" className="bg-sky-600 hover:bg-sky-500 rounded-lg p-2.5 transition-colors disabled:opacity-50 flex-shrink-0" disabled={!newMessage.trim()}>
                            {messageToEdit ? <CheckIcon className="w-6 h-6"/> : <SendIcon className="w-6 h-6" />} {/* Dynamic icon */}
                        </button>
                    </form>
                </footer>
            )}
            
            {showLeaveConfirm && <LeaveGroupConfirmModal onConfirm={handleLeaveGroup} onClose={() => setShowLeaveConfirm(false)} />}
            {memberToKick && <KickMemberConfirmModal memberName={memberToKick.displayName} onConfirm={handleKickMember} onClose={() => setMemberToKick(null)} />}
            {showDeleteConfirm && <DeleteGroupConfirmModal onConfirm={handleDeleteGroup} onClose={() => setShowDeleteConfirm(false)} />}
            {showGroupSettings && <EditGroupModal isOpen={showGroupSettings} onClose={() => setShowGroupSettings(false)} group={currentGroup} />}
            {selectedMessage && (
                <MessageOptionsMenu
                    message={selectedMessage}
                    user={user}
                    onClose={() => setSelectedMessage(null)}
                    onReply={(msg) => { handleReply(msg); setSelectedMessage(null); }}
                    onEdit={(msg) => { handleEdit(msg); setSelectedMessage(null); }}
                    onDelete={(msg) => { setMessageToDelete(msg); setSelectedMessage(null); }}
                    onPin={handlePin}
                    onCopy={handleCopy}
                    onReaction={(emoji) => handleReaction(selectedMessage.id, emoji)}
                    canDeleteAnyMessage={canManageMessages}
                    canPinMessage={canManageMessages}
                />
            )}
            {messageToDelete && <DeleteMessageModal onConfirm={handleDelete} onClose={() => setMessageToDelete(null)} />}
        </div>
    );
};

export default GroupChatModal;