import { useState } from 'react';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus('error');
      return;
    }

    // Create mailto link with form data
    const subject = encodeURIComponent(`Contact from ${formData.name}`);
    const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);
    window.location.href = `mailto:team@loopgate.io?subject=${subject}&body=${body}`;
    
    setStatus('success');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (status !== 'idle') setStatus('idle');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full bg-secondary/40 border border-border rounded-lg px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-muted-foreground/40 transition-colors"
        />
      </div>
      
      <div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full bg-secondary/40 border border-border rounded-lg px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-muted-foreground/40 transition-colors"
        />
      </div>
      
      <div>
        <textarea
          name="message"
          placeholder="Message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          className="w-full bg-secondary/40 border border-border rounded-lg px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-muted-foreground/40 transition-colors resize-none"
        />
      </div>
      
      <button
        type="submit"
        className="bg-foreground text-background px-6 py-2.5 rounded-lg text-[12px] font-medium uppercase tracking-[0.1em] hover:bg-foreground/90 transition-colors"
      >
        Send
      </button>
      
      {status === 'success' && (
        <p className="text-[12px] text-muted-foreground">Your message has been received.</p>
      )}
      
      {status === 'error' && (
        <p className="text-[12px] text-destructive">Please fill all required fields.</p>
      )}
    </form>
  );
}
