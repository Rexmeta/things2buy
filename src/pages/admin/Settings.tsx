import { useState, useEffect } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AliExpressSettings {
  appKey: string;
  appSecret: string;
  trackingId: string;
}

const STORAGE_KEY = 'things2buy_aliexpress_settings';

export const getAliExpressSettings = (): AliExpressSettings => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { appKey: '', appSecret: '', trackingId: '' };
  }
  return JSON.parse(stored);
};

export function Settings() {
  const [settings, setSettings] = useState<AliExpressSettings>({
    appKey: '',
    appSecret: '',
    trackingId: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getAliExpressSettings());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to="/admin" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
      </div>

      <div className="max-w-2xl rounded-xl border bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-xl font-bold text-slate-900">AliExpress Affiliate Configuration</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">App Key</label>
            <input
              type="text"
              value={settings.appKey}
              onChange={(e) => setSettings({ ...settings, appKey: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter your AliExpress App Key"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">App Secret</label>
            <input
              type="password"
              value={settings.appSecret}
              onChange={(e) => setSettings({ ...settings, appSecret: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter your AliExpress App Secret"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Tracking ID</label>
            <input
              type="text"
              value={settings.trackingId}
              onChange={(e) => setSettings({ ...settings, trackingId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter your Affiliate Tracking ID"
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">Note:</p>
            <p>These credentials will be used to automatically search for products and generate affiliate links when using the AI Auto-Generate feature.</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <Save className="h-4 w-4" /> Save Settings
            </button>
            {saved && (
              <span className="text-sm font-medium text-green-600 animate-fade-in">
                Settings saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
