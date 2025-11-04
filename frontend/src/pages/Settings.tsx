import { useState } from 'react';
import { Settings, DollarSign, Clock } from 'lucide-react';

export default function SettingsPage() {
  const [prices, setPrices] = useState({
    daily: 50000,
    weekly: 300000,
    monthly: 1000000
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-500">Configure platform settings</p>
      </div>

      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign size={24} />
            <h2 className="text-xl font-semibold">Pricing Plans</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Daily Price (so'm)</label>
              <input
                type="number"
                value={prices.daily}
                onChange={(e) => setPrices({ ...prices, daily: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Weekly Price (so'm)</label>
              <input
                type="number"
                value={prices.weekly}
                onChange={(e) => setPrices({ ...prices, weekly: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Monthly Price (so'm)</label>
              <input
                type="number"
                value={prices.monthly}
                onChange={(e) => setPrices({ ...prices, monthly: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>

            <button className="btn-primary">Save Pricing</button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Clock size={24} />
            <h2 className="text-xl font-semibold">Message Queue Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Groups per Batch</label>
              <input
                type="number"
                defaultValue={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Delay between Batches (ms)</label>
              <input
                type="number"
                defaultValue={5000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>

            <button className="btn-primary">Save Settings</button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Settings size={24} />
            <h2 className="text-xl font-semibold">System Configuration</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Auto-replace blocked sessions</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Daily health checks</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
