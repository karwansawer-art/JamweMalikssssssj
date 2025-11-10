import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { UserProfile } from '../../types.ts';

const BlockedUsers: React.FC<{ blockedUids: string[], onUnblock: (uid: string) => void }> = ({ blockedUids, onUnblock }) => {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (blockedUids.length === 0) {
            setProfiles([]);
            setLoading(false);
            return;
        }

        const fetchProfiles = async () => {
            setLoading(true);
            const fetchedProfiles: UserProfile[] = [];
            for (const uid of blockedUids) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (userDoc.exists()) {
                        fetchedProfiles.push({ uid, ...userDoc.data() } as UserProfile);
                    }
                } catch (error) {
                    console.error(`Failed to fetch profile for UID ${uid}`, error);
                }
            }
            setProfiles(fetchedProfiles);
            setLoading(false);
        };

        fetchProfiles();
    }, [blockedUids]);

    return (
        <div className="p-4 bg-sky-900/30 rounded-lg space-y-2">
            <h3 className="text-lg font-semibold text-sky-200 px-2">المستخدمون المحظورون</h3>
            {loading ? (
                <p className="text-center text-sky-300">جارِ التحميل...</p>
            ) : profiles.length > 0 ? (
                <ul className="space-y-2">
                    {profiles.map(profile => (
                        <li key={profile.uid} className="flex justify-between items-center p-2 rounded-lg hover:bg-sky-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <img
                                    src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || ' '}&background=0284c7&color=fff&size=128`}
                                    alt={profile.displayName}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                />
                                <span>{profile.displayName}</span>
                            </div>
                            <button onClick={() => onUnblock(profile.uid)} className="px-3 py-1 text-sm bg-sky-600 hover:bg-sky-500 rounded-md transition-colors">
                                إلغاء الحظر
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-sky-400 p-2">لا يوجد مستخدمون محظورون.</p>
            )}
        </div>
    );
};

export default BlockedUsers;
