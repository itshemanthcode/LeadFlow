'use client';

import { useState } from 'react';
import { Lead } from '@/lib/types';
import { Phone, MessageSquare, Mail, FileText, Mic } from 'lucide-react';

interface QuickActionsProps {
  lead: Lead;
  onAction: (action: string, data?: any) => void;
}

const templates = {
  introSMS: (lead: Lead, agentName: string) => 
    `Hi ${lead.name.split(' ')[0]}, this is ${agentName} from HSR Motors. Saw your interest in ${lead.preferredModel || 'our vehicles'}. Can I call you now?`,
  testDriveConfirm: (lead: Lead, date: string, time: string, location: string) =>
    `Your ${lead.preferredModel || 'test drive'} is booked for ${date} at ${time} at ${location}. Reply 1 to confirm, 2 to reschedule.`,
  quoteEmail: (lead: Lead) => ({
    subject: `Your on-road quote for ${lead.preferredModel || 'your preferred model'} — HSR Motors`,
    body: `Dear ${lead.name},\n\nThank you for your interest in ${lead.preferredModel || 'our vehicles'}.\n\nPlease find attached your detailed quote.\n\nBest regards,\nHSR Motors Team`,
  }),
};

export default function QuickActions({ lead, onAction }: QuickActionsProps) {
  const [showTemplates, setShowTemplates] = useState<string | null>(null);

  const handleCall = () => {
    onAction('call', { phone: lead.phone });
    // Auto-mark as Contacted if call connects >= 30s (simulated)
    setTimeout(() => {
      if (lead.status === 'New') {
        onAction('statusChange', { status: 'Contacted' });
      }
    }, 100);
  };

  const handleWhatsApp = () => {
    const template = templates.introSMS(lead, 'Ram Kumar'); // In real app, get from user context
    const message = encodeURIComponent(template);
    const url = `https://wa.me/${lead.phone}?text=${message}`;
    window.open(url, '_blank');
    onAction('whatsapp', { phone: lead.phone, message: template });
  };

  const handleEmail = () => {
    const emailData = templates.quoteEmail(lead);
    const mailtoLink = `mailto:${lead.email}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.location.href = mailtoLink;
    onAction('email', { email: lead.email, ...emailData });
  };

  const handleVoiceNote = () => {
    // In real app, this would use Web Speech API or a service
    const recording = confirm('Start voice recording? (This is a demo)');
    if (recording) {
      // Simulate transcription
      setTimeout(() => {
        const transcript = prompt('Enter transcribed text:');
        if (transcript) {
          onAction('voiceNote', { transcript });
        }
      }, 1000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCall}
        className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        title="Call"
      >
        <Phone className="w-4 h-4" />
        Call
      </button>
      <button
        onClick={handleWhatsApp}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="WhatsApp"
      >
        <MessageSquare className="w-4 h-4" />
        WhatsApp
      </button>
      <button
        onClick={handleEmail}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="Email"
      >
        <Mail className="w-4 h-4" />
        Email
      </button>
      <button
        onClick={() => onAction('note')}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="Add Note"
      >
        <FileText className="w-4 h-4" />
        Note
      </button>
      <button
        onClick={handleVoiceNote}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="Voice Note"
      >
        <Mic className="w-4 h-4" />
        Voice
      </button>
    </div>
  );
}

