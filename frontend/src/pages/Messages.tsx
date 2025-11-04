import { useEffect, useState } from 'react';
import { MessageSquare, Circle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

interface Message {
  id: string;
  content: string;
  contact_number: string;
  status: string;
  total_groups: number;
  sent_count: number;
  failed_count: number;
  skipped_count: number;
  created_at: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages?limit=50`);
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'processing': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-gray-500">View all message broadcasts</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <MessageSquare size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium">{message.contact_number}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Circle size={8} className={`fill-current ${getStatusColor(message.status)}`} />
                  <span className="text-sm capitalize">{message.status}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{message.content}</p>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  Total: <span className="font-medium text-black">{message.total_groups}</span>
                </span>
                <span className="text-green-600">
                  Sent: <span className="font-medium">{message.sent_count}</span>
                </span>
                <span className="text-red-600">
                  Failed: <span className="font-medium">{message.failed_count}</span>
                </span>
                <span className="text-gray-600">
                  Skipped: <span className="font-medium">{message.skipped_count}</span>
                </span>
              </div>

              {message.status === 'processing' && (
                <div className="mt-3 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-black h-2 rounded-full transition-all"
                    style={{
                      width: `${(message.sent_count / message.total_groups) * 100}%`
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {messages.length === 0 && (
            <div className="card text-center py-12 text-gray-500">
              No messages yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
