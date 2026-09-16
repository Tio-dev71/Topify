'use client';

import { useState, useEffect } from 'react';
import { Play, Activity } from 'lucide-react';

const API_URL = import.meta.env.DEV ? '/api' : 'https://topify.vn/api';

interface FbAccount {
  id: string;
  name: string;
  uid: string | null;
}

export default function LiveDashboardPage() {
  const [activeProfileIds, setActiveProfileIds] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Record<string, FbAccount>>({});
  const [timestamp, setTimestamp] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch accounts first to map profileIds to names
    fetch(`${API_URL}/facebook-accounts`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const accMap = data.reduce((acc: Record<string, FbAccount>, curr: any) => {
            acc[curr.profileId] = curr;
            return acc;
          }, {});
          setAccounts(accMap);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Poll for active profiles every 3 seconds
    const fetchActive = async () => {
      try {
        const res = await fetch(`${API_URL}/dashboard/live`);
        const data = await res.json();
        if (data.activeProfiles) {
          setActiveProfileIds(data.activeProfiles);
          setTimestamp(Date.now());
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchActive();
    const interval = setInterval(fetchActive, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Activity className="w-6 h-6 text-green-500 animate-pulse" />
            Live Dashboard
          </h1>
          <p className="page-subtitle">Real-time preview of all running automation browsers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center card-apple">
             <div className="w-12 h-12 rounded-xl skeleton mx-auto mb-4" />
             <div className="w-48 h-6 skeleton mx-auto mb-2" />
             <div className="w-64 h-4 skeleton mx-auto" />
          </div>
        ) : activeProfileIds.length === 0 ? (
          <div className="col-span-full py-20 text-center card-apple">
            <Play className="w-12 h-12 text-[var(--color-muted-foreground)] opacity-40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--color-foreground)]">No active tasks</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Start an automation task to see live browser previews here.</p>
          </div>
        ) : (
          activeProfileIds.map(profileId => {
            const account = accounts[profileId];
            const name = account ? account.name : `Profile ${profileId.substring(0, 8)}`;
            
            return (
              <div key={profileId} className="card-apple overflow-hidden">
                <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                    <span className="font-semibold text-sm truncate text-[var(--color-foreground)]">{name}</span>
                  </div>
                  <span className="badge badge-success px-2 py-0.5 text-[10px]">
                    RUNNING
                  </span>
                </div>
                <div className="relative aspect-video bg-[var(--color-background)] flex items-center justify-center">
                  <img 
                    src={`/screenshots/${profileId}.jpg?t=${timestamp}`} 
                    alt={`Preview for ${name}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

