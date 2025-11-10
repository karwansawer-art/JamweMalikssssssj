import React from 'react';

interface DeleteMessageModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({ onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
      <div className="w-full max-w-sm bg-sky-950 border border-red-500/50 rounded-lg p-6 space-y-4 text-white">
        <h3 className="text-xl font-bold text-red-400 text-center">تأكيد الحذف</h3>
        <p className="text-sky-200 text-center">هل أنت متأكد من رغبتك في حذف هذه الرسالة؟</p>
        <div className="flex justify-center gap-4 pt-4">
          <button onClick={onClose} className="px-6 py-2 font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-500">إلغاء</button>
          <button onClick={onConfirm} className="px-6 py-2 font-semibold text-white rounded-md bg-red-600 hover:bg-red-500">حذف</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
