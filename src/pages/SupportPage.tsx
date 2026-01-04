import { ArrowLeft, Mail, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-8">
        <Link to="/hub" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} />
          <span className="text-sm">Back to Hub</span>
        </Link>

        <h1 className="font-display text-4xl mb-2">Support</h1>
        <p className="text-muted-foreground">Get help with your Loopgate experience</p>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-surface-1 border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-display text-xl">Email Support</h3>
              <p className="text-sm text-muted-foreground">For general inquiries</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full border-border"
            onClick={() => window.location.href = 'mailto:team@loopgate.io'}
          >
            team@loopgate.io
          </Button>
        </div>

        <div className="bg-surface-1 border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gold/10 border border-gold/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-display text-xl">Discord Community</h3>
              <p className="text-sm text-muted-foreground">Join the conversation</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full border-border"
            onClick={() => window.open('https://discord.gg/loopgate', '_blank')}
          >
            Join Discord
          </Button>
        </div>

        <div className="bg-surface-1 border border-border p-6">
          <h3 className="font-display text-xl mb-4">FAQ</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">How do I submit an edit?</h4>
              <p className="text-sm text-muted-foreground">Navigate to a live event and click "Submit Edit". Enter your platform link and confirm.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">When are rankings updated?</h4>
              <p className="text-sm text-muted-foreground">Rankings update in real-time during live events. Final rankings are locked when events close.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">How do prizes work?</h4>
              <p className="text-sm text-muted-foreground">Prize payouts are processed within 30 days of event closure. Winners are contacted via email.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
