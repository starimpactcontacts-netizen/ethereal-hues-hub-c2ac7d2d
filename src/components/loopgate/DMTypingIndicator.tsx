interface DMTypingIndicatorProps {
  typingUsers: string[];
}

export default function DMTypingIndicator({ typingUsers }: DMTypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const text = typingUsers.length === 1
    ? `${typingUsers[0]} is typing`
    : `${typingUsers.join(' and ')} are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      <div className="flex gap-[3px]">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-[5px] h-[5px] rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${delay}ms`, animationDuration: '0.8s' }}
          />
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground italic">{text}</span>
    </div>
  );
}
