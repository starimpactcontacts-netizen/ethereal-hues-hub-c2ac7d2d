import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <SEO 
        title="Privacy Policy | Loopgate"
        description="Privacy Policy for Loopgate - Learn how we collect, use, and protect your data."
        canonical="https://loopgate.io/privacy"
      />
      
      <div className="px-4 pt-6 pb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} />
          <span className="text-sm">Back</span>
        </Link>

        <h1 className="font-display text-4xl mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: January 6, 2026</p>
      </div>

      <div className="px-4 space-y-6">
        <section className="bg-surface-1 border border-border p-6">
          <h2 className="font-display text-xl mb-3">1. Information We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            We collect information you provide directly to us, including:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Account information (email, username, display name)</li>
            <li>Profile information (avatar, bio, portfolio links)</li>
            <li>Connected social media accounts (TikTok, Instagram, YouTube)</li>
            <li>Competition submissions and participation data</li>
            <li>Communications and messages within the platform</li>
          </ul>
        </section>

        <section className="bg-surface-1 border border-border p-6">
          <h2 className="font-display text-xl mb-3">2. How We Use Your Information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            We use the information we collect to:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Provide, maintain, and improve our services</li>
            <li>Process competition entries and distribute prizes</li>
            <li>Display public rankings and leaderboards</li>
            <li>Send notifications about events and updates</li>
            <li>Respond to your comments and questions</li>
            <li>Protect against fraud and abuse</li>
          </ul>
        </section>

        <section className="bg-surface-1 border border-border p-6">
          <h2 className="font-display text-xl mb-3">3. Information Sharing</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We do not sell your personal information. We may share information with third parties only in the following circumstances: with your consent, to comply with legal obligations, to protect our rights and safety, or with service providers who assist in operating our platform.
          </p>
        </section>

        <section className="bg-surface-1 border border-border p-6">
          <h2 className="font-display text-xl mb-3">4. Data Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section className="bg-surface-1 border border-border p-6">
          <h2 className="font-display text-xl mb-3">5. Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            You have the right to:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Access and receive a copy of your personal data</li>
            <li>Rectify inaccurate personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section className="bg-surface-1 border border-border p-6">
          <h2 className="font-display text-xl mb-3">6. Data Retention</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time by contacting us.
          </p>
        </section>

        <section className="bg-surface-1 border border-border p-6">
          <h2 className="font-display text-xl mb-3">7. Children's Privacy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our services are not directed to individuals under 16. We do not knowingly collect personal information from children under 16. If we become aware that a child under 16 has provided us with personal information, we will take steps to delete such information.
          </p>
        </section>

        <section className="bg-surface-1 border border-border p-6">
          <h2 className="font-display text-xl mb-3">8. Changes to This Policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="bg-surface-1 border border-gold/30 p-6">
          <h2 className="font-display text-xl text-gold mb-3">9. Contact Us</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:team@loopgate.io" className="text-gold hover:underline">
              team@loopgate.io
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
