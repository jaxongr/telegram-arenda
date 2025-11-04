import { useEffect, useState } from 'react';
import { Server, Users, MessageSquare, DollarSign, Activity, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

interface Stats {
  sessions: {
    total: number;
    available: number;
    rented: number;
    blocked: number;
  };
  subscriptions: {
    active: number;
  };
  users: {
    total: number;
  };
  messages: {
    today: number;
    completed: number;
  };
  payments: {
    pending: number;
  };
}

function StatCard({ icon: Icon, title, value, subtitle, color }: any) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <h3 className="text-3xl font-bold mb-1">{value}</h3>
          {subtitle && <p className="text-gray-400 text-xs">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats/dashboard`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Activity className="animate-spin" size={32} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        <AlertCircle className="mr-2" />
        Failed to load dashboard
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-500">Welcome to Telegram Session Rental Platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Server}
          title="Total Sessions"
          value={stats.sessions.total}
          subtitle={`${stats.sessions.available} available`}
          color="bg-black"
        />

        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.users.total}
          subtitle={`${stats.subscriptions.active} subscribed`}
          color="bg-gray-700"
        />

        <StatCard
          icon={MessageSquare}
          title="Messages Today"
          value={stats.messages.today}
          subtitle={`${stats.messages.completed} completed`}
          color="bg-gray-600"
        />

        <StatCard
          icon={DollarSign}
          title="Pending Payments"
          value={stats.payments.pending}
          subtitle="Awaiting confirmation"
          color="bg-gray-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Session Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium">Available</span>
              </div>
              <span className="font-bold">{stats.sessions.available}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="font-medium">Rented</span>
              </div>
              <span className="font-bold">{stats.sessions.rented}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="font-medium">Blocked</span>
              </div>
              <span className="font-bold">{stats.sessions.blocked}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="btn-primary w-full flex items-center justify-center gap-2">
              <Server size={18} />
              Add New Session
            </button>

            <button className="btn-secondary w-full flex items-center justify-center gap-2">
              <DollarSign size={18} />
              Review Payments ({stats.payments.pending})
            </button>

            <button className="btn-secondary w-full flex items-center justify-center gap-2">
              <Activity size={18} />
              View All Messages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
