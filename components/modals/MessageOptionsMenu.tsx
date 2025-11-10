import React from 'react';
import type { User } from 'firebase/auth';
import type { Message } from '../../types';
import { ReplyIcon, EditIcon, CopyIcon, TrashIcon, PinIcon } from '../ui/Icons.tsx';
import { REACTION_EMOJIS } from '../../constants.tsx';

interface MessageOptionsMenuProps {
  message: Message;
  user: User;
  onClose: () => void;
  onReply?: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onPin: (message: Message) => void;
  onCopy: (text: string) => void;
  onReaction: (emoji: string) => void;
  canDeleteAnyMessage?: boolean;
  canPinMessage?: boolean;
}

const MessageOptionsMenu: React.FC<MessageOptionsMenuProps> = ({
  message,
  user,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onCopy,
  onReaction,
  canDeleteAnyMessage = false,
  canPinMessage = false,
}) => {
  const isMyMessage = user.uid === message.uid;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };
  
  const handleReaction = (emoji: string) => {
    onReaction(emoji);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-sky-900 rounded-t-2xl p-2 max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 py-4 border-b border-sky-700/50">
            {REACTION_EMOJIS.map((emoji) => (
                <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-3xl transform transition-transform duration-150 hover:scale-125"
                    aria-label={`React with ${emoji}`}
                >
                    {emoji}
                </button>
            ))}
        </div>

        <div className="flex flex-col pt-1">
          {onReply && (
              <button onClick={() => handleAction(() => onReply(message))} className="flex items-center gap-4 p-3 text-right rounded-lg hover:bg-sky-800/50 transition-colors">
                <ReplyIcon className="w-6 h-6 text-sky-300" />
                <span>رد</span>
              </button>
          )}
          <button onClick={() => handleAction(() => onCopy(message.text))} className="flex items-center gap-4 p-3 text-right rounded-lg hover:bg-sky-800/50 transition-colors">
            <CopyIcon className="w-6 h-6 text-sky-300" />
            <span>نسخ النص</span>
          </button>
          {isMyMessage && (
            <button onClick={() => handleAction(() => onEdit(message))} className="flex items-center gap-4 p-3 text-right rounded-lg hover:bg-sky-800/50 transition-colors">
              <EditIcon className="w-6 h-6 text-yellow-300" />
              <span className="text-yellow-300">تعديل</span>
            </button>
          )}
          {(isMyMessage || canDeleteAnyMessage) && (
            <button onClick={() => handleAction(() => onDelete(message))} className="flex items-center gap-4 p-3 text-right rounded-lg hover:bg-sky-800/50 transition-colors">
              <TrashIcon className="w-6 h-6 text-red-400" />
              <span className="text-red-400">حذف</span>
            </button>
          )}
          {canPinMessage && (
            <button onClick={() => handleAction(() => onPin(message))} className="flex items-center gap-4 p-3 text-right rounded-lg hover:bg-sky-800/50 transition-colors">
              <PinIcon className="w-6 h-6 text-cyan-300" />
              <span className="text-cyan-300">تثبيت الرسالة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageOptionsMenu;