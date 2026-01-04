import { ArrowLeft, Scale, AlertTriangle, Trophy, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO, { pageSEO } from '@/components/SEO';

const rules = [
  {
    icon: Users,
    title: 'Eligibility',
    content: 'All participants must be 16 years or older. One account per person. Verified TikTok account required.',
  },
  {
    icon: Trophy,
    title: 'Submissions',
    content: 'All edits must be original work created by you. Plagiarism or stolen content results in permanent ban from all competitions.',
  },
  {
    icon: Scale,
    title: 'Judging',
    content: 'Edits are scored on Quality (technical execution), Originality (creative vision), and Impact (emotional resonance). QOI scores are final and non-negotiable.',
  },
  {
    icon: Clock,
    title: 'Deadlines',
    content: 'Submissions must be received before the event deadline. Late submissions are not accepted under any circumstances.',
  },
  {
    icon: AlertTriangle,
    title: 'Conduct',
    content: 'Harassment of judges, staff, or fellow competitors results in immediate disqualification and potential permanent ban.',
  },
];

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <SEO {...pageSEO.rules} />
      <div className="px-4 pt-6 pb-8">
        <Link to="/hub" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} />
          <span className="text-sm">Back to Hub</span>
        </Link>

        <h1 className="font-display text-4xl mb-2">Competition Rules</h1>
        <p className="text-muted-foreground">Official Loopgate competition guidelines</p>
      </div>

      <div className="px-4 space-y-4">
        {rules.map((rule, index) => {
          const Icon = rule.icon;
          return (
            <div key={index} className="bg-surface-1 border border-border p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-display text-xl">{rule.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{rule.content}</p>
            </div>
          );
        })}

        <div className="bg-surface-1 border border-gold/30 p-6">
          <h3 className="font-display text-xl text-gold mb-3">Prize Distribution</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Prize pools are distributed to top performers based on final rankings</li>
            <li>• Payouts processed within 30 days of event closure</li>
            <li>• Winners contacted via registered email address</li>
            <li>• Tax documentation may be required for prizes over $600 USD</li>
          </ul>
        </div>

        <div className="bg-surface-1 border border-destructive/30 p-6">
          <h3 className="font-display text-xl text-destructive mb-3">Violations</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Violations of these rules may result in score penalties, disqualification from the current event, 
            or permanent ban from all Loopgate competitions. All decisions by Loopgate staff are final.
          </p>
        </div>
      </div>
    </div>
  );
}
