'use client';

import { useState, useEffect } from 'react';
import { Settings, Key, Link as LinkIcon, Plus, Trash2, Shield, Activity, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="container mx-auto py-8 max-w-5xl space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Settings className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your workspace configuration and integrations</p>
        </div>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="api-keys" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="social" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <LinkIcon className="w-4 h-4 mr-2" />
            Social Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <Card className="border-muted bg-card">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                AI API Keys (For Auto-Posting & Comments)
              </CardTitle>
              <CardDescription>
                Configure your API keys for AI platforms (e.g., OpenAI, Gemini, Anthropic). 
                These keys are required for AI-generated posts and automated AI comments for Staff and Admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddApiKey} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Provider Name</Label>
                    <Input 
                      id="keyName" 
                      placeholder="e.g., OpenAI, Gemini" 
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keyValue">API Key</Label>
                    <Input 
                      id="keyValue" 
                      type="password"
                      placeholder="sk-..." 
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Save API Key
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-muted bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Saved API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  No API keys configured for this workspace yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full text-primary">
                          <Key className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">{key.keyName}</p>
                          <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded mt-1">
                            {key.hint}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteApiKey(key.keyName)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="border-muted bg-card">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary" />
                Social Accounts
              </CardTitle>
              <CardDescription>
                Connect and manage your social media accounts for publishing content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-4 mb-6">
                <Button variant="outline" onClick={() => window.location.href = '/api/social/google?scope=youtube'}>Connect YouTube</Button>
                <Button variant="outline" onClick={() => window.location.href = '/api/social/meta'}>Connect Facebook</Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : socialAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  <p>No social accounts connected yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {socialAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                          <LinkIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{account.provider.toLowerCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            {account.accountName || 'Unknown Account'} • {account.status}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
