import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Server, MessageSquare, DollarSign, Settings } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Messages from './pages/Messages';
import Payments from './pages/Payments';
import SettingsPage from './pages/Settings';

function Sidebar() {
  const location = useLocation();

  const links = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/sessions', icon: Server, label: 'Sessions' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/payments', icon: DollarSign, label: 'Payments' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 h-screen bg-black text-white fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Telegram Rental</h1>
        <p className="text-gray-400 text-sm mt-1">Admin Dashboard</p>
      </div>

      <nav className="flex-1 p-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            A
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs text-gray-400">admin@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 bg-gray-50 min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
