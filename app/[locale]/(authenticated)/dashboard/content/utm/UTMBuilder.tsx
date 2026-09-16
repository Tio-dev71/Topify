'use client';

import React, { useState } from 'react';
import { Copy, Link as LinkIcon, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function UTMBuilder() {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState('');
  
  const [form, setForm] = useState({
    baseUrl: '',
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    setCopied(false);
  };

  const buildUrl = async () => {
    if (!form.baseUrl) {
      alert('Base URL is required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/content/utm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) throw new Error('Failed to build UTM URL');
      
      const data = await res.json();
      setResult(data.url);
    } catch (error) {
      console.error(error);
      
      // Fallback local calculation
      try {
        const url = new URL(form.baseUrl.startsWith('http') ? form.baseUrl : `https://${form.baseUrl}`);
        if (form.source) url.searchParams.set('utm_source', form.source);
        if (form.medium) url.searchParams.set('utm_medium', form.medium);
        if (form.campaign) url.searchParams.set('utm_campaign', form.campaign);
        if (form.term) url.searchParams.set('utm_term', form.term);
        if (form.content) url.searchParams.set('utm_content', form.content);
        setResult(url.toString());
      } catch (e) {
        alert('Invalid Base URL format');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setForm({
      baseUrl: '',
      source: '',
      medium: '',
      campaign: '',
      term: '',
      content: ''
    });
    setResult('');
    setCopied(false);
  };

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-[var(--color-foreground)]">UTM Builder</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">Generate trackable links for your marketing campaigns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Website URL <span className="text-red-500">*</span>
            </label>
            <input 
              type="url" 
              name="baseUrl"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
              value={form.baseUrl}
              onChange={handleChange}
              placeholder="https://example.com"
              required
            />
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">The full website URL (e.g. https://www.example.com)</p>
          </div>

          <hr className="border-[var(--color-border)] my-4" />

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Campaign Source <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="source"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
              value={form.source}
              onChange={handleChange}
              placeholder="google, newsletter, facebook"
              required
            />
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">The referrer (e.g. google, newsletter)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Campaign Medium
            </label>
            <input 
              type="text" 
              name="medium"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
              value={form.medium}
              onChange={handleChange}
              placeholder="cpc, banner, email"
            />
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Marketing medium (e.g. cpc, banner, email)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Campaign Name
            </label>
            <input 
              type="text" 
              name="campaign"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
              value={form.campaign}
              onChange={handleChange}
              placeholder="spring_sale, product_launch"
            />
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Product, promo code, or slogan</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Campaign Term
            </label>
            <input 
              type="text" 
              name="term"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
              value={form.term}
              onChange={handleChange}
              placeholder="running+shoes"
            />
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Identify the paid keywords</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Campaign Content
            </label>
            <input 
              type="text" 
              name="content"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
              value={form.content}
              onChange={handleChange}
              placeholder="logolink or textlink"
            />
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Use to differentiate ads</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={buildUrl}
              disabled={loading || !form.baseUrl}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <LinkIcon size={18} />}
              Generate URL
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-[var(--color-muted)] hover:bg-[var(--color-border)] text-[var(--color-foreground)] rounded-lg font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <div>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 p-6 sticky top-6">
            <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-200 mb-4 flex items-center gap-2">
              <LinkIcon size={18} />
              Generated Campaign URL
            </h3>
            
            {result ? (
              <div className="space-y-4">
                <div className="bg-white dark:bg-[#0f111a] p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 break-all text-sm font-mono text-[var(--color-foreground)]">
                  {result}
                </div>
                
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={18} />
                      Copied to clipboard!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy URL
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-indigo-400 dark:text-indigo-500 flex flex-col items-center">
                <LinkIcon size={32} className="mb-3 opacity-50" />
                <p>Fill out the form to generate your trackable URL</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
