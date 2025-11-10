import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User, signOut, signInAnonymously, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, Timestamp, deleteField, updateDoc } from 'firebase/firestore';
import { auth, db } from './services/firebase.ts';
import type { UserProfile } from './types.ts';
import Auth from './components/Auth.tsx';
import MainScreen from './components/MainScreen.tsx';
import { Spinner } from './components/ui/Icons.tsx';
import PinLock from './components/ui/PinLock.tsx';
import { AVATAR_OPTIONS } from './components/ui/AvatarPickerModal.tsx';

// Create a replacer function to avoid circular references when stringifying objects for localStorage
const jsonReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    
    // 1. Handle circular references
    if (seen.has(value)) {
      console.warn(`[jsonReplacer] Circular reference detected for key "${key}". Discarding.`);
      return undefined;
    }
    
    // Add all non-null objects to the set to track them.
    seen.add(value);

    // 2. Handle specific serializable types
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (value instanceof Set) {
      return Array.from(value);
    }
    // Safeguard for Timestamps, which have a toDate method
    if (typeof value.toDate === 'function') {
      return value.toDate().toISOString();
    }

    // 3. Allow arrays and plain objects to pass through for recursion
    // FIX: Use a more robust check for plain objects to avoid serializing
    // complex class instances (like those from Firebase).
    if (Array.isArray(value) || Object.prototype.toString.call(value) === '[object Object]') {
        return value;
    }

    // 4. Discard any other type of object
    console.warn(`[jsonReplacer] Discarding non-plain object for key "${key}" (constructor: ${value.constructor ? value.constructor.name : 'Unknown'}).`);
    return undefined;
  };
};


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // تحديث منطق appLocked للتحقق من أن رمز PIN موجود وغير فارغ
  const [appLocked, setAppLocked] = useState(() => {
    const storedPin = localStorage.getItem("appLockPin");
    return !!storedPin && storedPin.trim() !== "";
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        if (user.isAnonymous) {
            let guestProfile: UserProfile | null = null;
            try {
              const storedProfile = localStorage.getItem('guestProfile');
              if (storedProfile) {
                guestProfile = JSON.parse(storedProfile, (key, value) => {
                  const dateKeys = ['createdAt', 'startDate', 'timestamp'];
                  if (dateKeys.includes(key) && typeof value === 'string') {
                    const d = new Date(value);
                    if (!isNaN(d.getTime())) return d;
                  }
                  // For communityPostFireReactions, ensure it's converted back to a Set
                  // FIX: Corrected key name from 'fireReactions' to 'communityPostFireReactions'
                  if (key === 'communityPostFireReactions' && Array.isArray(value)) {
                    return new Set(value);
                  }
                  return value;
                });
              }
            } catch (e) {
              console.error("Failed to parse guest profile from localStorage", e);
              localStorage.removeItem('guestProfile');
            }

            if (!guestProfile) {
              guestProfile = {
                uid: user.uid,
                displayName: `زائر ${user.uid.substring(0, 5)}`,
                createdAt: new Date(),
                isAdmin: false,
                isMuted: false,
                commitmentDocument: "",
                blockedUsers: [],
                emergencyIndex: 0,
                urgeIndex: 0,
                storyIndex: 0,
                journalEntries: [],
                habits: [],
                followUpLogs: {},
                // Initialize communityPostFireReactions as an empty Set for new guest profiles
                communityPostFireReactions: new Set<string>(), 
              };
              // Apply the replacer when storing the initial guest profile
              localStorage.setItem('guestProfile', JSON.stringify(guestProfile, jsonReplacer()));
            }
            setUserProfile(guestProfile);
            setLoading(false);

        } else {
            const userDocRef = doc(db, 'users', user.uid);
            
            const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();

                // Auto-assign an avatar if one doesn't exist for a signed-in user
                if (!data.photoURL) {
                    // Assign a default avatar deterministically based on UID
                    const avatarIndex = user.uid.charCodeAt(0) % AVATAR_OPTIONS.length;
                    const defaultAvatarUrl = AVATAR_OPTIONS[avatarIndex];
                    
                    // Update Firebase Auth and Firestore in the background
                    Promise.all([
                        updateProfile(user, { photoURL: defaultAvatarUrl }),
                        updateDoc(userDocRef, { photoURL: defaultAvatarUrl })
                    ]).catch(error => {
                        console.error("Failed to auto-assign avatar:", error);
                    });
                    
                    // Set photoURL on the local profile data immediately for UI update
                    data.photoURL = defaultAvatarUrl; 
                }
                
                const profileData: UserProfile = {
                  uid: user.uid,
                  displayName: data.displayName,
                  email: data.email,
                  photoURL: data.photoURL,
                  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(), // Convert Timestamp to Date
                  startDate: (data.startDate as Timestamp)?.toDate() || undefined, // Convert Timestamp to Date or keep undefined
                  isAdmin: data.isAdmin ?? false,
                  isMuted: data.isMuted ?? false,
                  role: data.role ?? undefined,
                  commitmentDocument: data.commitmentDocument ?? "",
                  blockedUsers: data.blockedUsers ?? [],
                  emergencyIndex: data.emergencyIndex ?? 0,
                  urgeIndex: data.urgeIndex ?? 0,
                  storyIndex: data.storyIndex ?? 0,
                  // Journal entries, habits, and follow-up logs are handled by separate sub-collections/state.
                  // For anonymous users, these are stored directly in userProfile local state for simplicity,
                  // but for authenticated users, they reside in Firestore sub-collections.
                };
                setUserProfile(profileData);
                setLoading(false);
              } else {
                const newProfileData = {
                  displayName: user.isAnonymous 
                    ? `زائر ${user.uid.substring(0, 5)}` 
                    : (user.displayName || "مستخدم جديد"),
                  createdAt: serverTimestamp(),
                  isAdmin: false,
                  isMuted: false,
                  role: null,
                  commitmentDocument: "",
                  blockedUsers: [],
                  emergencyIndex: 0,
                  urgeIndex: 0,
                  storyIndex: 0,
                  ...(user.email && { email: user.email }),
                  ...(user.photoURL && { photoURL: user.photoURL }),
                };
                
                setDoc(userDocRef, newProfileData).catch(error => {
                  console.error("Failed to create user profile:", error);
                  setLoading(false);
                });
              }
            }, (error) => {
              console.error("Error in profile snapshot listener:", error);
              setLoading(false);
            });

            return () => unsubscribeProfile();
        }
      } else {
        setUserProfile(null);
        localStorage.removeItem('guestProfile');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);
  
   const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    if (user?.isAnonymous) {
      // Apply the replacer when updating the guest profile
      localStorage.setItem('guestProfile', JSON.stringify(newProfile, jsonReplacer()));
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Guest login failed:", error);
      setLoading(false); // التأكد من إيقاف التحميل عند الخطأ
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // سيتم التعامل مع setUser(null) بواسطة onAuthStateChanged
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Spinner className="w-16 h-16 text-sky-400" />
      </main>
    );
  }

  if (appLocked) {
    return <PinLock onUnlock={() => setAppLocked(false)} />;
  }

  return (
     <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {user && userProfile ? (
          <MainScreen user={user} userProfile={userProfile} handleSignOut={handleSignOut} setAppLocked={setAppLocked} setUserProfile={handleUpdateProfile} />
        ) : (
          <Auth handleGuestLogin={handleGuestLogin} />
        )}
      </div>
    </main>
  );
};

export default App;