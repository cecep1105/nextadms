import { Mail, Clock } from 'lucide-react';

export default function MailQueueIcon() {
  return (
    <div className="relative inline-flex items-center">
      <Mail className="w-4 h-4 text-gray-700" />
      <Clock className="w-3 h-3 text-blue-500 absolute -bottom-1 -right-1" />
    </div>
  );
}
