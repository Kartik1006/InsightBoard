'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return <div className="w-9 h-9" />;

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn-icon"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ width: 36, height: 36 }}
        >
            {theme === 'dark' ? (
                <Sun size={18} style={{ color: '#fbbf24' }} />
            ) : (
                <Moon size={18} style={{ color: '#6366f1' }} />
            )}
        </button>
    );
}
