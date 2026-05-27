'use client';

import Link from "next/link";
import { useState } from "react";

const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;

type RecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT';

type FormState = {
  type: RecordType;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  ipv4Only: boolean;
  ipv6Only: boolean;
  tags: string;
};

export default function Home() {
  const [form, setForm] = useState<FormState>({
    type: 'A',
    name: 'test',
    content: '127.0.0.1',
    ttl: 3600,
    proxied: true,
    ipv4Only: false,
    ipv6Only: false,
    tags: '',
  });
  const [accessKey, setAccessKey] = useState('');
  const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'available' | 'exists'>('idle');
  const [message, setMessage] = useState('');
  const [generatedAccessKey, setGeneratedAccessKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleNameChange = (value: string) => {
    updateForm('name', value);
    setCheckStatus('idle');
    setAccessKey('');
    setGeneratedAccessKey('');
  };

  const checkDnsRecord = async () => {
    setCheckStatus('checking');
    setMessage('');
    setAccessKey('');
    setGeneratedAccessKey('');

    try {
      const response = await fetch('/api/check-dns-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCheckStatus('idle');
        setMessage(`Error: ${data.error}`);
        return;
      }

      if (data.exists) {
        setCheckStatus('exists');
        setMessage('Subdomain already exists. Enter the access key to update it.');
        return;
      }

      setCheckStatus('available');
      setMessage('Subdomain is available. You can create it now.');
    } catch {
      setCheckStatus('idle');
      setMessage('Failed to check DNS record. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (checkStatus === 'idle' || checkStatus === 'checking') {
      setMessage('Check the subdomain first.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setGeneratedAccessKey('');
    try {
      const isUpdating = checkStatus === 'exists';
      const response = await fetch(isUpdating ? '/api/edit-dns-record' : '/api/create-dns-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: form.type,
          name: form.name,
          content: form.content,
          ttl: form.ttl,
          proxied: form.proxied,
          settings: {
            ipv4_only: form.ipv4Only,
            ipv6_only: form.ipv6Only,
          },
          access_key: isUpdating ? accessKey : undefined,
          tags: form.tags ? form.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag) : [],
        }),
      });
      const data = await response.json();
      if (response.ok) {
        if (isUpdating) {
          setMessage('DNS record updated successfully.');
          setAccessKey('');
        } else {
          setMessage('DNS record created successfully. Save the access key below.');
          setGeneratedAccessKey(data.access_key || '');
          setCheckStatus('exists');
          setAccessKey(data.access_key || '');
        }
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage(`Failed to ${checkStatus === 'exists' ? 'update' : 'create'} DNS record. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 transition-all duration-300">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-sky-400 to-blue-500">Subdomain Generator</h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Record Type</label>
            <div className="relative">
              <select
                value={form.type}
                onChange={(e) => updateForm('type', e.target.value as RecordType)}
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 appearance-none"
              >
                <option value="A">A - IPv4 Address</option>
                <option value="AAAA">AAAA - IPv6 Address</option>
                <option value="CNAME">CNAME - Alias</option>
                <option value="MX">MX - Mail Server</option>
                <option value="TXT">TXT - Text Record</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Subdomain Name</label>
            <div className="relative">
              <input
                type="text"
                value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 pl-10"
                required
                placeholder="e.g., www, api, mail"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Will create: <Link href={`https://${form.name}.${baseDomain}`} target="_blank" className="font-mono text-blue-400">{form.name}.{baseDomain}</Link>
            </p>
            <button
              type="button"
              onClick={checkDnsRecord}
              disabled={checkStatus === 'checking' || isSubmitting || !form.name.trim()}
              className={`mt-2 inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ${
                checkStatus === 'checking' || isSubmitting || !form.name.trim()
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-500'
              }`}
            >
              {checkStatus === 'checking' ? 'Checking...' : 'Check DNS Record'}
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Content</label>
            <div className="relative">
              <input
                type="text"
                value={form.content}
                onChange={(e) => updateForm('content', e.target.value)}
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 pl-10"
                required
                placeholder="e.g., 192.168.1.1, example.com"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">TTL (Time to Live)</label>
            <div className="relative">
              <input
                type="number"
                value={form.ttl}
                onChange={(e) => updateForm('ttl', Number(e.target.value))}
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 pl-10"
                required
                min={30}
                max={86400}
                placeholder="3600 seconds"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-medium text-gray-300 py-2 px-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors duration-200 flex justify-between items-center">
              <span>Advanced Options</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="space-y-4 mt-4 pt-4 border-t border-gray-700">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-300">Proxy through CDN</span>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={form.proxied}
                      onChange={(e) => updateForm('proxied', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${form.proxied ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform ${form.proxied ? 'translate-x-4' : ''}`}></div>
                  </div>
                </label>
                
                <label className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-300">IPv4 Only</span>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={form.ipv4Only}
                      onChange={(e) => updateForm('ipv4Only', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${form.ipv4Only ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform ${form.ipv4Only ? 'translate-x-4' : ''}`}></div>
                  </div>
                </label>
                
                <label className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-300">IPv6 Only</span>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={form.ipv6Only}
                      onChange={(e) => updateForm('ipv6Only', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${form.ipv6Only ? 'bg-purple-500' : 'bg-gray-600'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform ${form.ipv6Only ? 'translate-x-4' : ''}`}></div>
                  </div>
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => updateForm('tags', e.target.value)}
                  className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>
          </details>

          {checkStatus === 'exists' && (
            <div className="space-y-2 rounded-lg border border-sky-500/30 bg-sky-500/10 p-4">
              <label className="block text-sm font-medium text-gray-300">Access Key</label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                placeholder="Enter access key"
                required
              />
              <p className="text-xs text-gray-400">
                This key is required to update the existing DNS record.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || checkStatus === 'idle' || checkStatus === 'checking' || (checkStatus === 'exists' && !accessKey)}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center ${
              isSubmitting || checkStatus === 'idle' || checkStatus === 'checking' || (checkStatus === 'exists' && !accessKey)
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-linear-to-r from-green-600 to-emerald-600 hover:opacity-80 shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {checkStatus === 'exists' ? 'Update DNS Record' : 'Create DNS Record'}
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
            message.includes('Error') 
              ? 'bg-red-900/30 text-red-300 border border-red-700/50' 
              : 'bg-green-900/30 text-green-300 border border-green-700/50'
          }`}>
            {message}
          </div>
        )}

        {generatedAccessKey && (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p className="font-semibold">Access key generated</p>
            <p className="mt-1 text-amber-50/90">Save this key now. You will need it to edit the DNS record later.</p>
            <div className="mt-3 rounded-md border border-amber-400/30 bg-black/30 px-3 py-2 font-mono text-xs break-all text-amber-100">
              {generatedAccessKey}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}