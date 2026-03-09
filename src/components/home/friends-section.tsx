'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '@/store/use-gamification';
import { playNudge } from '@/lib/sounds';
import { hapticLight } from '@/lib/haptics';

interface FriendData {
  id: number;
  name: string;
  xp: number;
  streak: number;
  avatar?: string;
  lastActive?: string;
}

// Placeholder data — would come from API in production
const MOCK_FRIENDS: FriendData[] = [
  { id: 1, name: 'Andi', xp: 450, streak: 5, lastActive: 'Baru saja' },
  { id: 2, name: 'Siti', xp: 820, streak: 12, lastActive: '2 jam lalu' },
  { id: 3, name: 'Budi', xp: 300, streak: 2, lastActive: '1 hari lalu' },
];

export function FriendsSection() {
  const { friendIds, addFriend, removeFriend, nudgeFriend } = useGamification();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [nudgedId, setNudgedId] = useState<number | null>(null);

  // In production, filter by friendIds from API
  const friends = MOCK_FRIENDS.filter((f) => friendIds.includes(f.id));
  const nonFriends = MOCK_FRIENDS.filter((f) => !friendIds.includes(f.id));

  const handleNudge = (id: number) => {
    nudgeFriend(id);
    playNudge();
    hapticLight();
    setNudgedId(id);
    setTimeout(() => setNudgedId(null), 1000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Teman Belajar</h3>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="text-xs text-primary font-medium hover:underline"
        >
          {showSearch ? 'Tutup' : '+ Tambah Teman'}
        </button>
      </div>

      {/* Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama teman..."
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />

            {/* Search results */}
            <div className="mt-2 space-y-1">
              {nonFriends
                .filter((f) =>
                  f.name.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                .map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-card"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {f.name[0]}
                      </div>
                      <span className="text-sm">{f.name}</span>
                    </div>
                    <button
                      onClick={() => addFriend(f.id)}
                      className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground font-medium"
                    >
                      Tambah
                    </button>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friends list */}
      {friends.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Belum ada teman. Tambah teman untuk belajar bareng!
        </p>
      ) : (
        <div className="space-y-2">
          {friends.map((friend) => (
            <motion.div
              key={friend.id}
              layout
              className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-300 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                {friend.name[0]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{friend.name}</p>
                  {friend.streak > 0 && (
                    <span className="text-xs">🔥{friend.streak}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {friend.xp} XP · {friend.lastActive}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <motion.button
                  onClick={() => handleNudge(friend.id)}
                  className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
                  animate={nudgedId === friend.id ? { scale: [1, 1.2, 1] } : {}}
                >
                  {nudgedId === friend.id ? '✅' : '👋 Ajak'}
                </motion.button>

                <button
                  onClick={() => removeFriend(friend.id)}
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
