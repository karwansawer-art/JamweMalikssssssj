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
        const userDocRef = doc(db, 'users', user.uid);
        
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            let finalStartDate: Date | undefined = (data.startDate as Timestamp)?.toDate();

            // If Firestore data is missing startDate, check localStorage as a fallback.
            if (!finalStartDate) {
                try {
                    const cachedStartDate = localStorage.getItem(`user_startDate_${user.uid}`);
                    if (cachedStartDate) {
                        const cachedDate = new Date(cachedStartDate);
                        // Check if the cached date is valid before using it
                        if (!isNaN(cachedDate.getTime())) {
                            console.warn("Using cached startDate as a fallback due to missing Firestore data.");
                            finalStartDate = cachedDate;
                        }
                    }
                } catch (e) {
                    console.error("Failed to read startDate from localStorage", e);
                }
            }

            // If we have a valid startDate (either from Firestore or cache),
            // update the cache to ensure it's always the latest known value.
            if (finalStartDate) {
                try {
                    localStorage.setItem(`user_startDate_${user.uid}`, finalStartDate.toISOString());
                } catch (e) {
                    console.error("Failed to write startDate to localStorage", e);
                }
            }

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
              startDate: finalStartDate, // Use the potentially cached value
              isAdmin: data.isAdmin ?? false,
              isMuted: data.isMuted ?? false,
              role: data.role ?? undefined,
              commitmentDocument: data.commitmentDocument ?? "",
              blockedUsers: data.blockedUsers ?? [],
              emergencyIndex: data.emergencyIndex ?? 0,
              urgeIndex: data.urgeIndex ?? 0,
              storyIndex: data.storyIndex ?? 0,
              // Journal entries, habits, and follow-up logs are handled by separate sub-collections/state.
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
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
          <MainScreen user={user} userProfile={userProfile} handleSignOut={handleSignOut} setAppLocked={setAppLocked} />
        ) : (
          <Auth handleGuestLogin={handleGuestLogin} />
        )}
      </div>
    </main>
  );
};

export default App;