import React from 'react';
import BriefsManager from './BriefsManager';

export const metadata = {
  title: 'Content Briefs | Topify',
  description: 'Manage your content briefs and outlines',
};

export default function BriefsPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <BriefsManager />
      </div>
    </div>
  );
}
