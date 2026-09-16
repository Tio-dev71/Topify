import React from 'react';
import BrandVoiceManager from './BrandVoiceManager';

export const metadata = {
  title: 'Brand Voice | Topify',
  description: 'Manage your AI brand voice guidelines',
};

export default function BrandVoicePage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <BrandVoiceManager />
      </div>
    </div>
  );
}
