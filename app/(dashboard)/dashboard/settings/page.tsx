'use client';

import { useState, useEffect } from 'react';
import { Settings, Key, Link as LinkIcon, Plus, Trash2, Shield, Activity, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'api-keys' | 'social'>('api-keys');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [keysRes, socialRes] = await Promise.all([
        fetch('/api/user/api-keys'),
        fetch('/api/workspace/social')
      ]);
      
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData);
      }
      
      if (socialRes.ok) {
        const socialData = await socialRes.json();
        setSocialAccounts(socialData);
      }
    } catch (error) {
      console.error('Failed to fetch settings data', error);
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || !newKeyValue) {
      toast.error('Please provide both name and API key');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyName: newKeyName, keyValue: newKeyValue })
      });

      if (!res.ok) throw new Error('Failed to save API key');

      toast.success('API key saved successfully');
      setNewKeyName('');
      setNewKeyValue('');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApiKey = async (keyName: string) => {
    if (!confirm(`Are you sure you want to delete the API key: ${keyName}?`)) return;

    try {
      const res = await fetch(`/api/user/api-keys?keyName=${encodeURIComponent(keyName)}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete API key');

      toast.success('API key deleted successfully');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete API key');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in p-2 sm:p-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--color-foreground)]">
          Settings
        </h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Manage your workspace configuration and integrations
        </p>
      </div>

      <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit mb-6">
        <button
          onClick={() => setActiveTab('api-keys')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'api-keys' 
              ? 'bg-white dark:bg-black/20 shadow-sm text-[var(--color-foreground)]' 
              : 'text-gray-500 hover:text-[var(--color-foreground)]'
          }`}
        >
          <Key className="w-4 h-4 mr-2" />
          API Keys
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'social' 
              ? 'bg-white dark:bg-black/20 shadow-sm text-[var(--color-foreground)]' 
              : 'text-gray-500 hover:text-[var(--color-foreground)]'
          }`}
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          Social Connections
        </button>
      </div>

      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="card-apple p-6 border border-[var(--color-border)]">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <h2 className="text-[17px] font-semibold">AI API Keys (For Auto-Posting & Comments)</h2>
            </div>
            <p className="text-[13px] text-[var(--color-muted-foreground)] mb-6">
              Configure your API keys for AI platforms (e.g., OpenAI, Gemini, Anthropic). 
              These keys are required for AI-generated posts and automated AI comments for Staff and Admin.
            </p>
            
            <form onSubmit={handleAddApiKey} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="keyName" className="block text-[13px] font-medium text-[var(--color-foreground)]">Provider Name</label>
                  <input 
                    id="keyName" 
                    placeholder="e.g., OpenAI, Gemini" 
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-2.5 px-3 text-[14px] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="keyValue" className="block text-[13px] font-medium text-[var(--color-foreground)]">API Key</label>
                  <input 
                    id="keyValue" 
                    type="password"
                    placeholder="sk-..." 
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-2.5 px-3 text-[14px] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="btn-primary h-10 px-5 flex items-center justify-center gap-2 rounded-xl text-sm font-medium mt-4"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Save API Key
              </button>
            </form>
          </div>

          <div className="card-apple p-6 border border-[var(--color-border)]">
            <h2 className="text-[17px] font-semibold mb-6">Saved API Keys</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-muted-foreground)] border border-dashed border-[var(--color-border)] rounded-xl">
                No API keys configured for this workspace yet.
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-background)]">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Key className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-[15px]">{key.keyName}</p>
                        <p className="text-[12px] text-[var(--color-muted-foreground)] font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded mt-1 inline-block">
                          {key.hint}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteApiKey(key.keyName)} 
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'social' && (
        <div className="space-y-6">
          <div className="card-apple p-6 border border-[var(--color-border)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h2 className="text-[17px] font-semibold">Social Accounts</h2>
                </div>
                <p className="text-[13px] text-[var(--color-muted-foreground)]">
                  Connect and manage your social media accounts for publishing content.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => window.location.href = '/api/social/google?scope=youtube'}
                  className="btn-secondary h-10 px-4 flex items-center justify-center rounded-xl text-sm font-medium"
                >
                  Connect YouTube
                </button>
                <button 
                  onClick={() => window.location.href = '/api/social/meta'}
                  className="btn-primary h-10 px-4 flex items-center justify-center rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  Connect Facebook
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : socialAccounts.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-muted-foreground)] border border-dashed border-[var(--color-border)] rounded-xl">
                No social accounts connected yet.
              </div>
            ) : (
              <div className="space-y-4">
                {socialAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-background)]">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                        <LinkIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-[15px] capitalize">{account.provider.toLowerCase()}</p>
                        <p className="text-[13px] text-[var(--color-muted-foreground)]">
                          {account.accountName || 'Unknown Account'} • {account.status}
                        </p>
                      </div>
                    </div>
                    <button className="btn-secondary h-8 px-3 rounded-lg text-[12px] font-medium">Manage</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
