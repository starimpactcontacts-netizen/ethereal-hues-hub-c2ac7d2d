import { useState } from 'react';
import { KeyRound, X, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';

const passwordSchema = z.string().min(8, 'Min 8 characters');

export default function PasswordSetupBanner() {
  const { needsPasswordSetup, updatePassword } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!needsPasswordSetup || isDismissed) return null;

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(password);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password set! You can now login with password.');
      setIsDismissed(true);
    }
  };

  if (!isExpanded) {
    return (
      <div className="mx-4 mb-4">
        <div className="bg-gold/10 border border-gold p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound size={18} className="text-gold" />
            <div>
              <p className="text-sm font-medium text-gold">Set up a password</p>
              <p className="text-[10px] text-gold/70">For faster logins without email</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="bg-gold text-black hover:bg-gold/90 text-xs h-7 px-3"
            >
              Set Up
            </Button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-gold/50 hover:text-gold"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4">
      <div className="bg-surface-1 border border-gold p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-gold" />
            <p className="text-sm font-medium">Set Your Password</p>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-3">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password (8+ chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 bg-background border-border pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-10 bg-background border-border"
          />
          
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="flex-1 bg-gold text-black hover:bg-gold/90 h-9"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check size={14} className="mr-1" />
                  Save Password
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDismissed(true)}
              className="text-muted-foreground h-9"
            >
              Skip
            </Button>
          </div>
        </form>

        <p className="text-[10px] text-muted-foreground mt-3">
          You signed up with a magic link. Set a password for faster logins.
        </p>
      </div>
    </div>
  );
}
