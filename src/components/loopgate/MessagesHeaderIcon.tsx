import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useConversations } from '@/hooks/useDirectMessages';

export default function MessagesHeaderIcon() {
  const { totalUnread } = useConversations();

  return (
    <Link 
      to="/messages" 
      className="relative p-2 text-foreground hover:text-gold transition-colors"
      title="Messages"
    >
      <MessageCircle size={20} />
      {totalUnread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-black text-[10px] font-bold rounded-full flex items-center justify-center">
          {totalUnread > 9 ? '9+' : totalUnread}
        </span>
      )}
    </Link>
  );
}
