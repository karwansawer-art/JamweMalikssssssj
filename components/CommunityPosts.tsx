

import React, { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, arrayUnion, arrayRemove, Timestamp, where, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase.ts';
import type { UserProfile, CommunityPost } from '../types.ts';
import { PlusIcon, FireIcon, FilterIcon, Spinner, PinIcon, TrashIcon } from './ui/Icons.tsx';
import AddEditCommunityPostModal from './modals/AddEditCommunityPostModal.tsx';
import CommunityModerationFilterModal from './modals/CommunityModerationFilterModal.tsx';
import { ADMIN_UIDS } from '../constants.tsx';

interface CommunityPostsProps {
  user: User;
  currentUserProfile: UserProfile;
  isDeveloper: boolean;
}

interface CommunityPostItemProps {
  post: CommunityPost;
  user: User;
  isDeveloper: boolean;
  onFireReaction: (postId: string, isReacted: boolean) => void;
  onEdit: (post: CommunityPost) => void;
  onDelete: (postId: string) => void;
  onApproveToggle: (postId: string, isApproved: boolean) => void;
  onSetDeveloperFireCount: (postId: string) => void;
  onPinToggle: (postId: string | null) => void;
  isPinned: boolean;
  userProfiles: { [uid: string]: UserProfile };
  guestReactions?: Set<string>;
}

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `قبل ${days} يوم`;
  const months = Math.floor(days / 30);
  return months < 12 ? `قبل ${Math.floor(months / 12)} سنة` : `قبل ${Math.floor(months / 12)} سنة`;
};

const CommunityPostItem: React.FC<CommunityPostItemProps> = ({
  post,
  user,
  isDeveloper,
  onFireReaction,
  onEdit,
  onDelete,
  onApproveToggle,
  onSetDeveloperFireCount,
  onPinToggle,
  isPinned,
  userProfiles,
  guestReactions,
}) => {
  const isMyPost = post.uid === user.uid;
  
  const profile = userProfiles[post.uid];
  const displayName = profile ? profile.displayName : post.displayName;
  const photoURL = profile ? profile.photoURL : post.photoURL;

  // Check if current user has reacted
  const userHasReacted = (post.fireReactions || []).includes(user.uid) ||
                        (user.isAnonymous && (guestReactions?.has(post.id) ?? false));
  
  // Calculate displayed fire count:
  let displayedFireCount = (post.developerFireCount || 0);
  displayedFireCount += (post.fireReactions || []).length;
  if (user.isAnonymous && (guestReactions?.has(post.id) ?? false)) {
      displayedFireCount += 1;
  }

  const postCardClasses = `bg-sky-950/50 backdrop-blur-sm border rounded-lg shadow-lg p-4 space-y-3 relative
    ${isPinned 
      ? 'bg-yellow-950/40 border-yellow-300/50 animate-pulse-once-yellow' 
      : post.isApproved ? 'border-sky-700/50' : 'border-yellow-700/50'
    }
    ${!post.isApproved && !isDeveloper ? 'opacity-70' : ''}
  `;
  const postTextColor = isPinned ? 'text-yellow-200' : 'text-sky-300';
  const postMetaColor = isPinned ? 'text-yellow-300' : 'text-sky-400';


  return (
    <article className={postCardClasses}>
      {isPinned && (
        <div className="absolute top-2 right-2 bg-yellow-700/50 text-yellow-100 text-xs px-2 py-1 rounded-full flex items-center gap-1" dir="rtl">
          <PinIcon className="w-4 h-4" />
          <span>منشور مثبت</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src={photoURL || `https://ui-avatars.com/api/?name=${displayName || ' '}&background=0ea5e9&color=fff&size=128`}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className={`font-semibold ${postTextColor}`}>{displayName}</p>
            <p className={`text-xs ${postMetaColor}`}>
              {post.createdAt ? formatTimeAgo(post.createdAt) : ''}
            </p>
          </div>
        </div>
        {isDeveloper && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPinToggle(isPinned ? null : post.id)}
              className={`p-1.5 rounded-full transition-colors ${
                isPinned ? 'text-yellow-400 hover:bg-yellow-500/20' : 'text-sky-400 hover:bg-sky-500/20'
              }`}
              title={isPinned ? 'إلغاء تثبيت المنشور' : 'تثبيت المنشور'}
            >
              <PinIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onApproveToggle(post.id, !post.isApproved)}
              className={`p-1.5 rounded-full transition-colors ${
                post.isApproved ? 'text-green-400 hover:bg-green-500/20' : 'text-yellow-400 hover:bg-yellow-500/20'
              }`}
              title={post.isApproved ? 'إلغاء الموافقة' : 'الموافقة على المنشور'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => onSetDeveloperFireCount(post.id)}
              className="p-1.5 rounded-full text-orange-400 hover:bg-orange-500/20 transition-colors"
              title="تحديد عدد اللهيب"
            >
              <FireIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(post.id)}
              className="p-1.5 rounded-full text-red-400 hover:bg-red-500/20 transition-colors"
              title="حذف المنشور"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <p className={`whitespace-pre-wrap break-words text-lg leading-relaxed ${postTextColor}`}>{post.text}</p>

      <div className="flex justify-between items-center pt-2 border-t border-sky-700/30">
        <button
          onClick={() => onFireReaction(post.id, userHasReacted)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold transition-colors 
            ${userHasReacted
              ? 'bg-yellow-800/50 text-yellow-300' // Active state
              : 'bg-sky-800/60 text-yellow-300 hover:bg-sky-700/60' // Inactive state
            }`
          }
        >
          <FireIcon className="w-5 h-5" />
          <span>{displayedFireCount}</span>
        </button>
        {isMyPost && !isDeveloper && (
            <button
                onClick={() => onEdit(post)}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold text-yellow-300 bg-sky-800/60 hover:bg-sky-700/60 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                <span>تعديل</span>
            </button>
        )}
      </div>
      {!post.isApproved && !isDeveloper && (
        <p className="text-yellow-300 text-sm mt-2 text-center">
          هذا المنشور بانتظار موافقة المشرف.
        </p>
      )}
    </article>
  );
};


const CommunityPosts: React.FC<CommunityPostsProps> = ({ user, currentUserProfile, isDeveloper }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [pinnedPost, setPinnedPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<CommunityPost | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'approved' | 'pending'>(isDeveloper ? 'all' : 'approved');
  const [showSetFireCountModal, setShowSetFireCountModal] = useState(false);
  const [fireCountPostId, setFireCountPostId] = useState<string | null>(null);
  const [developerFireCountInput, setDeveloperFireCountInput] = useState<string>(''); // Keep as string for input
  const [fireCountError, setFireCountError] = useState<string>('');
  const [userProfiles, setUserProfiles] = useState<{ [uid: string]: UserProfile }>({});
  const [guestReactions, setGuestReactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user.isAnonymous) {
        try {
            const storedReactions = localStorage.getItem('guestFireReactions');
            if (storedReactions) {
                setGuestReactions(new Set(JSON.parse(storedReactions)));
            }
        } catch (e) {
            console.error("Failed to parse guest reactions from localStorage", e);
            localStorage.removeItem('guestFireReactions');
        }
    }
  }, [user.isAnonymous]);

  // Fetch pinned post
  useEffect(() => {
    const configRef = doc(db, 'app_config', 'community_posts_config');
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().pinnedPostId) {
        const pinnedPostId = docSnap.data().pinnedPostId;
        const postRef = doc(db, 'community_posts', pinnedPostId);
        onSnapshot(postRef, (postSnap) => {
          if (postSnap.exists()) {
            const data = postSnap.data();
            setPinnedPost({
              id: postSnap.id,
              ...data,
              createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            } as CommunityPost);
          } else {
            setPinnedPost(null);
            // If pinned post no longer exists, unpin it from config
            updateDoc(configRef, { pinnedPostId: null }).catch(console.error);
          }
        });
      } else {
        setPinnedPost(null);
      }
    }, (error) => {
        console.error("Error fetching pinned post config:", error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch regular posts
  useEffect(() => {
    let q = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'));

    if (!isDeveloper) {
      q = query(q, where('isApproved', '==', true));
    } else {
      if (currentFilter === 'approved') {
        q = query(q, where('isApproved', '==', true));
      } else if (currentFilter === 'pending') {
        q = query(q, where('isApproved', '==', false));
      }
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        } as CommunityPost;
      });
      // Filter out the pinned post from the main list if it's there
      setPosts(fetchedPosts.filter(post => post.id !== pinnedPost?.id));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching community posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDeveloper, currentFilter, pinnedPost?.id]); // Re-fetch if pinnedPost.id changes

    useEffect(() => {
        const fetchPostUserProfiles = async () => {
            const allPosts = [...posts];
            if (pinnedPost) {
                allPosts.push(pinnedPost);
            }

            if (allPosts.length === 0) return;

            const uids = [...new Set(allPosts.map(p => p.uid))];
            const profilesToFetch = uids.filter(uid => !userProfiles[uid]);

            if (profilesToFetch.length > 0) {
                const fetchedProfiles: { [uid: string]: UserProfile } = {};
                const promises = profilesToFetch.map(async (uid) => {
                    const userDocRef = doc(db, 'users', uid);
                    try {
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            fetchedProfiles[uid] = { uid, ...userDocSnap.data() } as UserProfile;
                        }
                    } catch (e) {
                        console.error("Error fetching user profile for post:", e);
                    }
                });
                await Promise.all(promises);
                setUserProfiles(prev => ({ ...prev, ...fetchedProfiles }));
            }
        };

        fetchPostUserProfiles();
    }, [posts, pinnedPost]);


  const handleAddPostClick = () => {
    setPostToEdit(null);
    setShowAddEditModal(true);
  };

  const handleEditPostClick = (post: CommunityPost) => {
    setPostToEdit(post);
    setShowAddEditModal(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!isDeveloper) return;
    try {
      await deleteDoc(doc(db, 'community_posts', postId));
      // If the deleted post was pinned, unpin it
      if (pinnedPost?.id === postId) {
        await updateDoc(doc(db, 'app_config', 'community_posts_config'), { pinnedPostId: null });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleApproveToggle = async (postId: string, isApproved: boolean) => {
    if (!isDeveloper) return;
    try {
      await updateDoc(doc(db, 'community_posts', postId), { isApproved });
    } catch (error) {
      console.error("Error toggling approval:", error);
    }
  };

  const handleFireReaction = async (postId: string, isReacted: boolean) => {
    if (user.isAnonymous) {
      const updatedReactions = new Set(guestReactions);
      if (isReacted) {
        updatedReactions.delete(postId);
      } else {
        updatedReactions.add(postId);
      }
      setGuestReactions(updatedReactions);
      localStorage.setItem('guestFireReactions', JSON.stringify(Array.from(updatedReactions)));
    } else {
        const postRef = doc(db, 'community_posts', postId);
        try {
            if (isReacted) {
                await updateDoc(postRef, { fireReactions: arrayRemove(user.uid) });
            } else {
                await updateDoc(postRef, { fireReactions: arrayUnion(user.uid) });
            }
        } catch (error) {
            console.error("Error updating fire reaction:", error);
        }
    }
  };

  const handlePinToggle = async (postId: string | null) => {
    if (!isDeveloper) return;
    try {
      const configRef = doc(db, 'app_config', 'community_posts_config');
      await updateDoc(configRef, { pinnedPostId: postId });
    } catch (error) {
      console.error("Error toggling pinned post:", error);
    }
  };

  const handleSetDeveloperFireCount = (postId: string) => {
    if (!isDeveloper) return;
    setFireCountPostId(postId);
    const post = posts.find(p => p.id === postId) || pinnedPost; // Check pinned post too
    setDeveloperFireCountInput(post?.developerFireCount?.toString() || '');
    setShowSetFireCountModal(true);
  };

  const saveDeveloperFireCount = async () => {
    if (!fireCountPostId || !isDeveloper) return;

    const count = parseInt(developerFireCountInput);
    if (isNaN(count) || count < 0) {
      setFireCountError("الرجاء إدخال رقم موجب صالح.");
      return;
    }
    setFireCountError('');
    try {
      await updateDoc(doc(db, 'community_posts', fireCountPostId), { developerFireCount: count });
      setShowSetFireCountModal(false);
      setFireCountPostId(null);
      setDeveloperFireCountInput('');
    } catch (error) {
      console.error("Error setting developer fire count:", error);
      setFireCountError("حدث خطأ أثناء حفظ العدد.");
    }
  };

  return (
    <div className="text-white pb-20">
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-sm z-10 flex justify-between items-center p-4 bg-sky-950/80 backdrop-blur-sm">
        {user.isAnonymous ? (
            <div className="w-10"></div>
        ) : (
             <button
                onClick={handleAddPostClick}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="إضافة منشور جديد"
            >
                <PlusIcon className="w-6 h-6" />
            </button>
        )}
        <h1 className="text-2xl font-bold text-white text-shadow text-center">منشورات المجتمع</h1>
        {isDeveloper ? (
          <button
            onClick={() => setShowFilterModal(true)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="فلترة المنشورات"
          >
            <FilterIcon className="w-6 h-6" />
          </button>
        ) : <div className="w-10"></div>}
      </header>

      <main className="space-y-4 p-4 pt-20">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="w-10 h-10 text-sky-400" />
          </div>
        ) : (
          <>
            {pinnedPost && (
              <CommunityPostItem
                post={pinnedPost}
                user={user}
                isDeveloper={isDeveloper}
                onFireReaction={handleFireReaction}
                onEdit={handleEditPostClick}
                onDelete={handleDeletePost}
                onApproveToggle={handleApproveToggle}
                onSetDeveloperFireCount={handleSetDeveloperFireCount}
                onPinToggle={handlePinToggle}
                isPinned={true}
                userProfiles={userProfiles}
                guestReactions={guestReactions}
              />
            )}
            {posts.length > 0 ? (
              posts.map(post => (
                <CommunityPostItem
                  key={post.id}
                  post={post}
                  user={user}
                  isDeveloper={isDeveloper}
                  onFireReaction={handleFireReaction}
                  onEdit={handleEditPostClick}
                  onDelete={handleDeletePost}
                  onApproveToggle={handleApproveToggle}
                  onSetDeveloperFireCount={handleSetDeveloperFireCount}
                  onPinToggle={handlePinToggle}
                  isPinned={false}
                  userProfiles={userProfiles}
                  guestReactions={guestReactions}
                />
              ))
            ) : (
              !pinnedPost && <p className="text-center text-sky-400 py-10">لا توجد منشورات حتى الآن.</p>
            )}
          </>
        )}
      </main>

      <AddEditCommunityPostModal
        isOpen={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        user={user}
        currentUserProfile={currentUserProfile}
        postToEdit={postToEdit}
      />

      {isDeveloper && (
        <CommunityModerationFilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onFilterSelect={setCurrentFilter}
          currentFilter={currentFilter}
        />
      )}

      {isDeveloper && showSetFireCountModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-sm bg-sky-950 border border-orange-500/50 rounded-lg p-6 space-y-4 text-white">
            <h3 className="text-xl font-bold text-orange-400 text-center">تحديد عدد اللهيب</h3>
            <p className="text-sky-200 text-center">أدخل عدد اللهيب الذي تريده لهذا المنشور.</p>
            {fireCountError && <p className="text-red-400 text-sm text-center">{fireCountError}</p>}
            <input
              type="number"
              min="0"
              value={developerFireCountInput}
              onChange={(e) => setDeveloperFireCountInput(e.target.value)}
              className="w-full bg-black/30 border border-orange-400/50 rounded-md p-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex justify-center gap-4 pt-4">
              <button onClick={() => setShowSetFireCountModal(false)} className="px-6 py-2 font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-500">إلغاء</button>
              <button onClick={saveDeveloperFireCount} className="px-6 py-2 font-semibold text-white rounded-md bg-orange-600 hover:bg-orange-500">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPosts;
