import { useEffect, useState } from 'react';
import { Server, Circle, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

interface Session {
  id: string;
  phone_number: string;
  status: string;
  groups_count: number;
  messages_sent_today: number;
  is_healthy: boolean;
  last_health_check: string;
  created_at: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_URL}/sessions`);
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-500';
      case 'rented':
        return 'text-blue-500';
      case 'blocked':
      case 'spam':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'rented':
        return 'Rented';
      case 'blocked':
        return 'Blocked';
      case 'spam':
        return 'Spam';
      default:
        return 'Unknown';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sessions</h1>
          <p className="text-gray-500">Manage Telegram sessions</p>
        </div>

        <button className="btn-primary flex items-center gap-2">
          <Server size={18} />
          Add Session
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Groups</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Messages Today</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Server size={16} className="text-gray-400" />
                      <span className="font-medium">{session.phone_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Circle size={8} className={`fill-current ${getStatusColor(session.status)}`} />
                      <span className="text-sm">{getStatusText(session.status)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{session.groups_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{session.messages_sent_today}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${session.is_healthy ? 'text-green-600' : 'text-red-600'}`}>
                      {session.is_healthy ? 'Healthy' : 'Unhealthy'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded" title="Refresh">
                        <RefreshCw size={16} />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded text-red-500" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sessions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No sessions found. Add your first session to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
