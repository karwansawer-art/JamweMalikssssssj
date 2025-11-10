
import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { UserProfile, CommunityPost } from '../../types.ts';
import { CloseIcon, Spinner, CheckIcon } from '../ui/Icons.tsx'; // Import CheckIcon

interface AddEditCommunityPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentUserProfile: UserProfile;
  postToEdit: CommunityPost | null;
}

const AddEditCommunityPostModal: React.FC<AddEditCommunityPostModalProps> = ({
  isOpen,
  onClose,
  user,
  currentUserProfile,
  postToEdit,
}) => {
  const [postText, setPostText] = useState(postToEdit?.text || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // New state for success message

  useEffect(() => {
    if (isOpen) {
      setPostText(postToEdit?.text || '');
      setError('');
      setShowSuccessMessage(false); // Reset success message on open
    }
  }, [isOpen, postToEdit]);

  const handleSave = async () => {
    if (!postText.trim()) {
      setError("الرجاء كتابة محتوى المنشور.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const commonData = {
        text: postText.trim(),
        uid: user.uid,
        displayName: currentUserProfile.displayName || user.displayName || 'مستخدم',
        photoURL: currentUserProfile.photoURL || user.photoURL || null,
      };

      if (postToEdit) {
        // Editing existing post: set isApproved to false to require re-approval
        await updateDoc(doc(db, 'community_posts', postToEdit.id), {
          ...commonData,
          isApproved: false, // Post must be re-approved after editing
          createdAt: postToEdit.createdAt // Preserve original createdAt
        });
      } else {
        // Adding new post: defaults to isApproved: false
        await addDoc(collection(db, 'community_posts'), {
          ...commonData,
          createdAt: serverTimestamp(),
          isApproved: false, // New posts require approval
          fireReactions: [], // Initialize with empty reactions
        });
      }
      setShowSuccessMessage(true); // Show success message
      setTimeout(onClose, 3000); // Auto-close after 3 seconds
    } catch (err) {
      console.error("Error saving community post:", err);
      setError("حدث خطأ أثناء حفظ المنشور.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col h-[70vh]">
        <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
          <h2 className="text-xl font-bold text-sky-200">
            {postToEdit ? 'تعديل المنشور' : 'منشور جديد'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" disabled={showSuccessMessage}>
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-grow p-6 space-y-4 overflow-y-auto">
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {!showSuccessMessage ? (
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="اكتب منشورك هنا..."
              className="w-full h-full bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none"
            />
          ) : (
            <div className="bg-green-900/50 text-green-200 p-5 rounded-lg text-center flex flex-col items-center gap-3 animate-fade-in">
              <CheckIcon className="w-12 h-12 text-green-300" />
              <p className="text-xl font-bold">تم إرسال منشورك بنجاح!</p>
              <p className="text-lg">سوف يظهر منشورك بعد موافقة المطور.</p>
            </div>
          )}
        </main>
        <footer className="p-4 border-t border-sky-400/30 flex-shrink-0">
          {!showSuccessMessage ? (
            <button
              onClick={handleSave}
              disabled={loading || !postText.trim()}
              className="w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-teal-600 hover:bg-teal-500 disabled:opacity-50"
            >
              {loading ? <Spinner className="w-6 h-6 mx-auto" /> : (postToEdit ? 'تحديث المنشور' : 'نشر المنشور')}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-sky-600 hover:bg-sky-500"
            >
              نعم
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default AddEditCommunityPostModal;
