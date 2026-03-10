'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Student } from '@/types';

interface StudentState {
  student: Student | null;
  isLoading: boolean;
  setStudent: (student: Student | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  addStars: (n: number) => void;
}

function generateParentCode(name: string) {
  const codeName = name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
  const codeNum = Math.floor(1000 + Math.random() * 9000);
  return `${codeName}-${codeNum}`;
}

export const useStudent = create<StudentState>()(
  persist(
    (set) => ({
      student: null,
      isLoading: false,
      setStudent: (student) => {
        // Auto-generate parent_code if missing
        if (student && student.name && !student.parent_code) {
          student = { ...student, parent_code: generateParentCode(student.name) };
        }
        set({ student });
      },
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ student: null }),
      addStars: (n) =>
        set((state) => ({
          student: state.student
            ? { ...state.student, stars: state.student.stars + n }
            : null,
        })),
    }),
    { name: 'kawabel-student' }
  )
);
