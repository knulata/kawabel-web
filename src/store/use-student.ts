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

export const useStudent = create<StudentState>()(
  persist(
    (set) => ({
      student: null,
      isLoading: false,
      setStudent: (student) => set({ student }),
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
