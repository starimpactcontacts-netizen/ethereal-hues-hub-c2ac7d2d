import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStartConversation } from '@/hooks/useDirectMessages';
import { useAuth } from '@/hooks/useAuth';

interface MessageButtonProps {
  userId: string;
  username: string;
  variant?: 'default' | 'icon' | 'outline';
  size?: 'default' | 'sm' | 'icon';
  className?: string;
}

export default function MessageButton({ 
  userId, 
  username, 
  variant = 'default',
  size = 'default',
  className = ''
}: MessageButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startConversation } = useStartConversation();
  const [loading, setLoading] = useState(false);

  // Don't show if it's the current user
  if (user?.id === userId) return null;

  const handleClick = async () => {
    setLoading(true);
    const conversationId = await startConversation(userId);
    setLoading(false);
    
    if (conversationId) {
      navigate(`/messages/${conversationId}`);
    }
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={loading}
        className={`h-9 w-9 rounded-full bg-surface-1 border border-border hover:bg-surface-1/80 hover:border-gold/30 ${className}`}
        title={`Message ${username}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={variant === 'outline' ? 'outline' : 'default'}
      size={size}
      onClick={handleClick}
      disabled={loading}
      className={`${variant === 'outline' ? 'border-border bg-transparent hover:bg-accent' : 'bg-surface-1 hover:bg-surface-1/80 text-foreground'} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <MessageCircle className="w-4 h-4 mr-2" />
      )}
      Message
    </Button>
  );
}
