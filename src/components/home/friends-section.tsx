'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { useGamification } from '@/store/use-gamification';
import { playNudge } from '@/lib/sounds';
import { hapticLight } from '@/lib/haptics';
import { useT } from '@/store/use-language';

interface FriendData {
  id: number;
  name: string;
  xp: number;
  streak: number;
  avatar_url?: string;
  lastActive?: string;
}

export function FriendsSection() {
  const { student } = useStudent();
  const { addFriend, removeFriend } = useGamification();
  const t = useT();
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);
  const [nudgedId, setNudgedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch friends on mount
  useEffect(() => {
    if (!student?.id || !student?.email) return;
    fetch(`/api/friends?student_id=${student.id}`)
      .then((r) => r.json())
      .then((data) => setFriends(data.friends || []))
      .catch(() => {});
  }, [student?.id, student?.email]);

  const handleAddFriend = async () => {
    if (!friendCode.trim() || !student?.id) return;
    setSearchError(null);
    setSearchSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, friend_code: friendCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error);
        return;
      }
      setSearchSuccess(`${data.friend.name} ditambahkan!`);
      setFriendCode('');
      addFriend(data.friend.id);
      // Refresh friends list
      const refreshed = await fetch(`/api/friends?student_id=${student.id}`);
      const refreshedData = await refreshed.json();
      setFriends(refreshedData.friends || []);
    } catch {
      setSearchError('Gagal menambah teman');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (friendId: number) => {
    if (!student?.id) return;
    removeFriend(friendId);
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    fetch('/api/friends', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id, friend_id: friendId }),
    }).catch(() => {});
  };

  const handleNudge = (friend: FriendData) => {
    playNudge();
    hapticLight();
    setNudgedId(friend.id);
    setTimeout(() => setNudgedId(null), 1000);
    // Share via WhatsApp
    const msg = `Yuk belajar bareng di Kawabel! 🦉 kawabel.com`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!student?.email) return null; // Only show for signed-in users

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t('friendsTitle')}
        </h3>
        <button
          onClick={() => { setShowSearch(!showSearch); setSearchError(null); setSearchSuccess(null); }}
          className="text-xs text-primary font-medium hover:underline"
        >
          {showSearch ? t('friendsClose') : t('friendsAdd')}
        </button>
      </div>

      {/* Add friend by code */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {t('friendsCodeHint')}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={friendCode}
                  onChange={(e) => { setFriendCode(e.target.value.toUpperCase()); setSearchError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                  placeholder="KODE-1234"
                  className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-primary/30"
                  maxLength={12}
                />
                <button
                  onClick={handleAddFriend}
                  disabled={loading || !friendCode.trim()}
                  className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
                >
                  {loading ? '...' : t('friendsAddBtn')}
                </button>
              </div>
              {searchError && (
                <p className="text-xs text-red-500">{searchError}</p>
              )}
              {searchSuccess && (
                <p className="text-xs text-green-600">{searchSuccess}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friends list */}
      {friends.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {t('friendsEmpty')}
        </p>
      ) : (
        <div className="space-y-2">
          {friends.map((friend) => (
            <motion.div
              key={friend.id}
              layout
              className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-300 to-emerald-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} alt="" className="w-10 h-10 object-cover" />
                ) : (
                  friend.name[0]
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{friend.name}</p>
                  {friend.streak > 0 && (
                    <span className="text-xs">🔥{friend.streak}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {friend.xp} XP
                </p>
              </div>

              <div className="flex items-center gap-1">
                <motion.button
                  onClick={() => handleNudge(friend)}
                  className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
                  animate={nudgedId === friend.id ? { scale: [1, 1.2, 1] } : {}}
                >
                  {nudgedId === friend.id ? '✅' : `👋 ${t('friendsNudge')}`}
                </motion.button>

                <button
                  onClick={() => handleRemove(friend.id)}
                  className="text-xs px-1.5 py-1 rounded-full text-muted-foreground hover:text-red-500 transition-colors"
                  title="Hapus teman"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
