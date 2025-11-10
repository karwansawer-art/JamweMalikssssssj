import React, { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, where, getDocs, writeBatch, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { UserProfile, Message, Conversation } from '../../types.ts';
import { CloseIcon, SendIcon, OptionsIcon, BlockIcon, UnblockIcon, CheckIcon } from '../ui/Icons.tsx';
import { REACTION_EMOJIS } from '../../constants.tsx';
import MessageOptionsMenu from './MessageOptionsMenu.tsx';
import DeleteMessageModal from './DeleteMessageModal.tsx';

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


// Props
interface PrivateChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    otherUser: Conversation;
    isBlocked: boolean;
    onBlockUser: (user: UserProfile) => void;
    onUnblockUser: (uid: string) => void;
}

// Helper
const formatTime = (date: Date) => date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
const isValidTimestamp = (ts: any) => ts && typeof ts.toDate === 'function';

const PrivateChatModal: React.FC<PrivateChatModalProps> = ({ isOpen, onClose, user, otherUser, isBlocked, onBlockUser, onUnblockUser }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [messageToEdit, setMessageToEdit] = useState<Message | null>(null);
    const [replyTo, setReplyTo] = useState<Message | null>(null); // Added replyTo state
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
    const [otherUserProfile, setOtherUserProfile] = useState<Conversation>(otherUser);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null); // Added inputRef
    const conversationId = [user.uid, otherUser.uid].sort().join('_');

    useEffect(() => {
        if (!isOpen) return;
        const userDocRef = doc(db, 'users', otherUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setOtherUserProfile(prev => ({
                    ...prev,
                    displayName: data.displayName,
                    photoURL: data.photoURL,
                }));
            }
        });
        return () => unsubscribe();
    }, [isOpen, otherUser.uid]);

    useEffect(() => {
        if (!isOpen) return;

        const messagesCollection = collection(db, 'private_chats', conversationId, 'messages');
        const q = query(messagesCollection, orderBy('timestamp'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(fetchedMessages);
            
            // Mark messages as read
            const unreadMessages = snapshot.docs.filter(doc => doc.data().uid !== user.uid && !doc.data().isRead);
            if (unreadMessages.length > 0) {
                const batch = writeBatch(db);
                unreadMessages.forEach(doc => batch.update(doc.ref, { isRead: true }));
                await batch.commit();
            }

            // Update conversation 'hasUnread' status
            const userConvoRef = doc(db, 'users', user.uid, 'conversations', otherUser.uid);
            // Use setDoc with merge: true to avoid "No document to update" error if the doc doesn't exist yet.
            await setDoc(userConvoRef, { hasUnread: false }, { merge: true }).catch(console.error);
        });
        
        return () => unsubscribe();
    }, [isOpen, conversationId, user.uid, otherUser.uid]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages]);

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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || isBlocked) return;

        const messagesCollection = collection(db, 'private_chats', conversationId, 'messages');
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
                    isRead: false,
                    replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, displayName: replyTo.displayName } : null, // Added replyTo
                });
            }

            const userConvoRef = doc(db, 'users', user.uid, 'conversations', otherUser.uid);
            const otherUserConvoRef = doc(db, 'users', otherUser.uid, 'conversations', user.uid);
            
            const batch = writeBatch(db);
            batch.set(userConvoRef, {
                displayName: otherUserProfile.displayName,
                photoURL: otherUserProfile.photoURL || null,
                lastMessageTimestamp: timestamp,
                hasUnread: false
            }, { merge: true });

            batch.set(otherUserConvoRef, {
                displayName: user.displayName,
                photoURL: user.photoURL || null,
                lastMessageTimestamp: timestamp,
                hasUnread: true
            }, { merge: true });

            await batch.commit();
            setNewMessage('');
            setReplyTo(null); // Clear replyTo
        } catch (error) {
            console.error("Error sending private message:", error);
        }
    };
    
    const handleDelete = async () => {
        if (messageToDelete) {
             await deleteDoc(doc(db, 'private_chats', conversationId, 'messages', messageToDelete.id));
             setMessageToDelete(null);
        }
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        const messageRef = doc(db, 'private_chats', conversationId, 'messages', messageId);
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
    
    const handleEdit = (message: Message) => {
        setMessageToEdit(message);
        setNewMessage(message.text);
    }
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        // Consider showing a brief confirmation message
    };

    const handleReply = (message: Message) => { // Added handleReply
        setReplyTo(message);
        setSelectedMessage(null); // Close options menu
    };

    const cancelEditOrReply = () => { // Added cancelEditOrReply
        setMessageToEdit(null);
        setReplyTo(null);
        setNewMessage('');
    }

    if (!isOpen) return null;
    
    const otherUserFullProfile: UserProfile = {
        uid: otherUserProfile.uid,
        displayName: otherUserProfile.displayName,
        photoURL: otherUserProfile.photoURL,
        createdAt: serverTimestamp() as any, // placeholder
    };

    return (
        <div className="absolute inset-0 bg-sky-950 flex flex-col">
             <header className="p-4 border-b border-sky-400/30 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-3">
                    <img src={otherUserProfile.photoURL || `https://ui-avatars.com/api/?name=${otherUserProfile.displayName || ' '}&background=0284c7&color=fff&size=128`} alt={otherUserProfile.displayName} className="w-10 h-10 rounded-full object-cover"/>
                    <h3 className="font-bold text-lg">{otherUserProfile.displayName}</h3>
                </div>
                 <div className="flex items-center gap-2">
                    {isBlocked ? (
                        <button onClick={() => onUnblockUser(otherUser.uid)} className="p-2 rounded-full hover:bg-white/10" title="إلغاء الحظر"><UnblockIcon className="w-6 h-6 text-green-400"/></button>
                    ) : (
                         <button onClick={() => onBlockUser(otherUserFullProfile)} className="p-2 rounded-full hover:bg-white/10" title="حظر"><BlockIcon className="w-6 h-6 text-red-400"/></button>
                    )}
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6"/></button>
                 </div>
            </header>
            <main className="flex-grow p-4 flex flex-col overflow-y-auto">
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
                    
                    const position = isStartOfGroup && isEndOfGroup ? 'single' : isStartOfGroup ? 'start' : isEndOfGroup ? 'end' : 'middle';
                    
                    let bubbleClasses = 'group relative p-3 overflow-hidden ';
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
                        <div key={msg.id} className={`flex items-end gap-2 ${isMyMessage ? 'flex-row-reverse' : ''} ${isStartOfGroup ? 'mt-4' : 'mt-1'}`}>
                             <div className={`flex flex-col max-w-xs ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                <div className={bubbleClasses}>
                                    {msg.replyTo && ( // Render replyTo message
                                        <a href={`#msg-${msg.replyTo.id}`} onClick={(e) => { e.preventDefault(); /* For private chat, no scroll to message specified, so prevent default */ }} className="block p-2 mb-2 border-r-2 border-sky-400 bg-black/20 rounded text-sm text-sky-300 hover:bg-black/30 transition-colors">
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
            </main>
             <footer className="p-4 border-t border-sky-400/30 flex-shrink-0">
                 {(messageToEdit || replyTo) && ( // Show edit/reply context
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
                        ref={inputRef} // Add ref
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onInput={handleInput} // Add onInput handler for auto-growing
                        placeholder={isBlocked ? "لا يمكنك إرسال رسائل لهذا المستخدم" : "اكتب رسالتك..."}
                        className="w-full bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none max-h-24" // Added resize-none max-h-24
                        disabled={isBlocked}
                        rows={1} // Set initial rows to 1
                        onKeyDown={(e) => { // Added onKeyDown handler
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e as any);
                            }
                        }} />
                    <button type="submit" className="bg-sky-600 hover:bg-sky-500 rounded-lg p-2.5 transition-colors disabled:opacity-50 flex-shrink-0" disabled={!newMessage.trim() || isBlocked}>
                        {messageToEdit ? <CheckIcon className="w-6 h-6"/> : <SendIcon className="w-6 h-6" />} {/* Dynamic icon */}
                    </button>
                </form>
            </footer>
            {selectedMessage && (
                <MessageOptionsMenu
                    message={selectedMessage}
                    user={user}
                    onClose={() => setSelectedMessage(null)}
                    onReply={(msg) => { handleReply(msg); setSelectedMessage(null); }}
                    onEdit={(msg) => { handleEdit(msg); setSelectedMessage(null); }}
                    onDelete={(msg) => { setMessageToDelete(msg); setSelectedMessage(null); }}
                    onPin={() => {}} // Not applicable
                    onCopy={handleCopy}
                    onReaction={(emoji) => handleReaction(selectedMessage.id, emoji)}
                    canDeleteAnyMessage={false}
                    canPinMessage={false}
                />
            )}
            {messageToDelete && (
                <DeleteMessageModal 
                    onConfirm={handleDelete}
                    onClose={() => setMessageToDelete(null)}
                />
            )}
        </div>
    );
};

export default PrivateChatModal;