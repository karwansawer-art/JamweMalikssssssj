import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { Group } from '../../types.ts';
import { PlusIcon, LockIcon } from '../ui/Icons.tsx';
import CreateGroupModal from './CreateGroupModal.tsx';

interface GroupChatListProps {
  user: User;
  onGroupSelect: (group: Group) => void;
}

const GroupChatList: React.FC<GroupChatListProps> = ({ user, onGroupSelect }) => {
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'groups'), orderBy('lastMessageTimestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
      setAllGroups(fetchedGroups);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching groups:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const joinedGroups = allGroups.filter(g => g.members.includes(user.uid));
  const discoverGroups = allGroups.filter(g => !g.members.includes(user.uid));

  if (loading) {
    return <p className="text-center text-sky-400 py-8">جارِ تحميل المجموعات...</p>;
  }
  
  const GroupItem: React.FC<{group: Group}> = ({ group }) => {
    const hasUnread = group.unreadStatus?.[user.uid] === true;
    return (
      <button key={group.id} onClick={() => onGroupSelect(group)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sky-800/50 text-right">
        <div className="relative flex-shrink-0">
          <img 
            src={group.photoURL || `https://ui-avatars.com/api/?name=${group.name || ' '}&background=0369a1&color=fff&size=128`} 
            alt={group.name} 
            className="w-12 h-12 rounded-full object-cover" 
          />
          {hasUnread && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-sky-950/90"></span>
          )}
        </div>
        <div className="flex-grow overflow-hidden flex items-center gap-2">
            <div className="flex-grow overflow-hidden">
                <p className={`font-semibold truncate ${hasUnread ? 'text-white' : 'text-slate-300'}`}>{group.name}</p>
                {group.lastMessage && <p className={`text-sm truncate ${hasUnread ? 'text-sky-300' : 'text-sky-400'}`}>{group.lastMessage}</p>}
            </div>
            {group.type === 'private' && <LockIcon className="w-4 h-4 text-sky-400 flex-shrink-0" />}
        </div>
      </button>
    );
  };

  return (
    <div className="p-2 space-y-1">
        <button onClick={() => setShowCreateGroupModal(true)} className="w-full flex items-center justify-center gap-2 p-3 my-1 rounded-lg bg-sky-800/50 hover:bg-sky-700/70 transition-colors">
            <PlusIcon className="w-6 h-6" />
            <span>إنشاء مجموعة جديدة</span>
        </button>
      
      {joinedGroups.length > 0 && (
        <div className="pt-2">
            <h3 className="px-2 pb-1 text-sm font-semibold text-sky-400 border-b border-sky-700/50 mb-2">مجموعاتي</h3>
            <div className="space-y-1">
                {joinedGroups.map(group => <GroupItem key={group.id} group={group} />)}
            </div>
        </div>
      )}
      
      {discoverGroups.length > 0 && (
        <div className="pt-4">
            <h3 className="px-2 pb-1 text-sm font-semibold text-sky-400 border-b border-sky-700/50 mb-2">مجموعات أخرى</h3>
             <div className="space-y-1">
                {discoverGroups.map(group => <GroupItem key={group.id} group={group} />)}
            </div>
        </div>
      )}

      {allGroups.length === 0 && !loading && (
        <p className="text-center text-sky-400 py-8">لا توجد مجموعات حتى الآن. كن أول من ينشئ واحدة!</p>
      )}

      <CreateGroupModal 
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        user={user}
        onGroupCreated={onGroupSelect}
      />
    </div>
  );
};

export default GroupChatList;