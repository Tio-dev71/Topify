import React from 'react';
import UTMBuilder from './UTMBuilder';

export const metadata = {
  title: 'UTM Builder | Topify',
  description: 'Generate UTM tracking links for your campaigns',
};

export default function UTMPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <UTMBuilder />
      </div>
    </div>
  );
}
