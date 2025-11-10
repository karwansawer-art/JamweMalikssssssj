import React from 'react';

export const ADMIN_UIDS = ['sytCf4Ru91ZplxTeXYfvqGhDnn12'];

export const REACTION_EMOJIS = ["❤️", "👍", "🥰", "😪", "😞", "💯"];

export const getErrorMessage = (code: string) => {
  switch (code) {
    case 'auth/invalid-email':
      return 'البريد الإلكتروني غير صالح.';
    case 'auth/user-not-found':
      return 'لا يوجد مستخدم بهذا البريد الإلكتروني.';
    case 'auth/wrong-password':
      return 'كلمة المرور خاطئة.';
    case 'auth/email-already-in-use':
      return 'هذا البريد الإلكتروني مستخدم بالفعل.';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة جدًا. يجب أن تتكون من 6 أحرف على الأقل.';
    case 'auth/requires-recent-login':
        return 'تتطلب هذه العملية مصادقة حديثة. يرجى تسجيل الخروج ثم الدخول مرة أخرى والمحاولة مجددًا.';
    default:
      return 'حدث خطأ ما. يرجى المحاولة مرة أخرى.';
  }
};