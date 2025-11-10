import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { Conversation } from '../../types.ts';
import { TrashIcon } from '../ui/Icons.tsx';
import DeleteConversationModal from '../modals/DeleteConversationModal.tsx';

interface PrivateChatListProps {
  user: User;
  onConversationSelect: (conversation: Conversation) => void;
}

const PrivateChatList: React.FC<PrivateChatListProps> = ({ user, onConversationSelect }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'conversations'), orderBy('lastMessageTimestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Conversation));
      setConversations(convos);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching conversations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);
  
  const handleDeleteConversation = async () => {
    if (conversationToDelete) {
        try {
             await deleteDoc(doc(db, 'users', user.uid, 'conversations', conversationToDelete.uid));
             setConversationToDelete(null);
        } catch (error) {
            console.error("Error deleting conversation:", error);
        }
    }
  };

  if (loading) {
    return <p className="text-center text-sky-400 py-8">جارِ تحميل المحادثات...</p>;
  }

  if (conversations.length === 0) {
    return <p className="text-center text-sky-400 py-8">لا توجد محادثات خاصة.</p>;
  }

  return (
    <div className="p-2 space-y-2">
      {conversations.map(convo => (
        <div key={convo.uid} className="flex items-center justify-between p-2 rounded-lg hover:bg-sky-800/50 group">
          <button onClick={() => onConversationSelect(convo)} className="flex-grow flex items-center gap-3 text-right">
            <div className="relative flex-shrink-0">
              <img 
                src={convo.photoURL || `https://ui-avatars.com/api/?name=${convo.displayName || ' '}&background=0284c7&color=fff&size=128`} 
                alt={convo.displayName} 
                className="w-12 h-12 rounded-full object-cover flex-shrink-0" 
              />
              {convo.hasUnread && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-sky-950/90"></span>
              )}
            </div>
            <span className="font-semibold">{convo.displayName}</span>
          </button>
           <button onClick={() => setConversationToDelete(convo)} className="p-2 text-red-500 hover:text-red-300 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      ))}
      {conversationToDelete && (
          <DeleteConversationModal onConfirm={handleDeleteConversation} onClose={() => setConversationToDelete(null)} />
      )}
    </div>
  );
};

export default PrivateChatList;