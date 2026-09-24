import React from 'react';

interface ReactionPickerProps {
  onSelectReaction: (emoji: string) => void;
  onClose: () => void;
}

const EMOJIS = ['❤️', '👍', '😂', '🔥', '👏', '✨'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onSelectReaction,
  onClose,
}) => {
  return (
    <div
      className="quick-reaction-bar"
      onClick={(e) => e.stopPropagation()}
      role="toolbar"
      aria-label="리액션 선택"
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          className="reaction-btn"
          onClick={() => {
            onSelectReaction(emoji);
            onClose();
          }}
          aria-label={`리액션 ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
