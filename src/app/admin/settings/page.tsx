'use client';

import { useState, useEffect } from 'react';

const THEMES = [
  {
    id: 'amber',
    name: 'Spice Amber',
    description: 'Warm & traditional — the classic SpiceCraft look',
    primary: '#92400e',
    accent: '#d97706',
    light: '#fef3c7',
    preview: ['#92400e', '#d97706', '#fef3c7', '#fbbf24'],
  },
  {
    id: 'crimson',
    name: 'Crimson Fire',
    description: 'Bold & passionate — vibrant red energy',
    primary: '#7f1d1d',
    accent: '#dc2626',
    light: '#fef2f2',
    preview: ['#7f1d1d', '#b91c1c', '#fef2f2', '#f87171'],
  },
  {
    id: 'forest',
    name: 'Forest Herb',
    description: 'Natural & organic — earthy green tones',
    primary: '#14532d',
    accent: '#16a34a',
    light: '#f0fdf4',
    preview: ['#14532d', '#15803d', '#f0fdf4', '#4ade80'],
  },
  {
    id: 'ocean',
    name: 'Ocean Calm',
    description: 'Fresh & trustworthy — cool blue tones',
    primary: '#1e3a8a',
    accent: '#2563eb',
    light: '#eff6ff',
    preview: ['#1e3a8a', '#1d4ed8', '#eff6ff', '#60a5fa'],
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    description: 'Premium & luxurious — rich purple tones',
    primary: '#4c1d95',
    accent: '#7c3aed',
    light: '#f5f3ff',
    preview: ['#4c1d95', '#6d28d9', '#f5f3ff', '#a78bfa'],
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    description: 'Warm & energetic — vibrant orange tones',
    primary: '#7c2d12',
    accent: '#ea580c',
    light: '#fff7ed',
    preview: ['#7c2d12', '#c2410c', '#fff7ed', '#fb923c'],
  },
];

export default function AdminSettingsPage() {
  const [activeTheme, setActiveTheme] = useState('amber');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setActiveTheme(data.data['site-theme'] || 'amber');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'site-theme', value: activeTheme }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        // Apply theme instantly without full reload
        const html = document.documentElement;
        if (activeTheme === 'amber') {
          html.removeAttribute('data-theme');
        } else {
          html.setAttribute('data-theme', activeTheme);
        }
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  // Live preview on hover/select
  const previewTheme = (themeId: string) => {
    const html = document.documentElement;
    if (themeId === 'amber') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', themeId);
    }
  };

  const resetPreview = () => previewTheme(activeTheme);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-900">Site Settings</h1>
        <p className="text-gray-500 mt-1">Customise the look and feel of SpiceCraft</p>
      </div>

      {/* Theme Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🎨</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Brand Theme</h2>
            <p className="text-sm text-gray-500">Choose a colour theme for the entire website</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {THEMES.map((theme) => {
            const isActive = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setActiveTheme(theme.id)}
                onMouseEnter={() => previewTheme(theme.id)}
                onMouseLeave={resetPreview}
                className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  isActive
                    ? 'border-amber-500 shadow-lg shadow-amber-100 scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Color swatches */}
                <div className="flex gap-1.5 mb-3">
                  {theme.preview.map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-lg shadow-sm border border-white/50"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="font-bold text-gray-900 text-sm">{theme.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{theme.description}</div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-700 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-md shadow-amber-200/50"
          >
            {saving ? 'Saving...' : '💾 Save Theme'}
          </button>

          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm bg-emerald-50 px-4 py-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Theme applied successfully!
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-3">
          💡 Hover over a theme to preview it. Click Save to apply site-wide.
        </p>
      </div>
    </div>
  );
}
