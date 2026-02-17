import { createContext, useContext, useEffect, useState } from 'react';

/**
 * Theme Context
 * Provides theme state and toggle functionality
 */
const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

/**
 * Theme definitions
 */
export const THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    icon: '🌙',
    colors: {
      '--bg-color': '#0a0a0a',
      '--bg-secondary': '#1a1a1a',
      '--bg-tertiary': '#2a2a2a',
      '--text-color': '#e0e0e0',
      '--text-secondary': '#a0a0a0',
      '--card-bg': 'rgba(26, 26, 26, 0.6)',
      '--card-border': '#333',
      '--primary-color': '#00ff9d',
      '--secondary-color': '#00b8ff',
    },
  },
  light: {
    id: 'light',
    name: 'Light Mode',
    icon: '☀️',
    colors: {
      '--bg-color': '#f8fafc',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#f1f5f9',
      '--text-color': '#0f172a',
      '--text-secondary': '#475569',
      '--card-bg': 'rgba(255, 255, 255, 0.95)',
      '--card-border': '#e2e8f0',
      '--primary-color': '#059669',
      '--secondary-color': '#0284c7',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Blue',
    icon: '🌌',
    colors: {
      '--bg-color': '#0d1117',
      '--bg-secondary': '#161b22',
      '--bg-tertiary': '#21262d',
      '--text-color': '#c9d1d9',
      '--text-secondary': '#8b949e',
      '--card-bg': 'rgba(22, 27, 34, 0.8)',
      '--card-border': '#30363d',
      '--primary-color': '#58a6ff',
      '--secondary-color': '#79c0ff',
    },
  },
  hacker: {
    id: 'hacker',
    name: 'Hacker',
    icon: '💻',
    colors: {
      '--bg-color': '#0a0a0a',
      '--bg-secondary': '#0f0f0f',
      '--bg-tertiary': '#1a1a1a',
      '--text-color': '#00ff00',
      '--text-secondary': '#00cc00',
      '--card-bg': 'rgba(0, 20, 0, 0.8)',
      '--card-border': '#003300',
      '--primary-color': '#00ff00',
      '--secondary-color': '#00cc00',
    },
  },
};

/**
 * Theme Provider Component
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('soc-theme') || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);
  
  // Apply theme to document
  const applyTheme = (themeId) => {
    const themeConfig = THEMES[themeId];
    if (!themeConfig) return;
    
    const root = document.documentElement;
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Add theme class for additional styling
    document.body.className = `theme-${themeId}`;
  };
  
  // Toggle to next theme
  const toggleTheme = () => {
    const themeIds = Object.keys(THEMES);
    const currentIndex = themeIds.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeIds.length;
    const nextTheme = themeIds[nextIndex];
    
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem('soc-theme', nextTheme);
  };
  
  // Set specific theme
  const setSpecificTheme = (themeId) => {
    if (THEMES[themeId]) {
      setTheme(themeId);
      applyTheme(themeId);
      localStorage.setItem('soc-theme', themeId);
    }
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setSpecificTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Theme Selector Component
 */
export const ThemeSelector = () => {
  const { theme, setTheme, themes } = useTheme();
  
  return (
    <div className="theme-selector">
      <div className="flex gap-2">
        {Object.values(themes).map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`theme-btn p-2 rounded-lg transition-all ${
              theme === t.id 
                ? 'bg-primary/20 border-primary' 
                : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
            } border`}
            title={t.name}
          >
            <span className="text-lg">{t.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Theme Toggle Button (simple toggle)
 */
export const ThemeToggle = () => {
  const { theme, toggleTheme, themes } = useTheme();
  const currentTheme = themes[theme];
  
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-500 transition-all flex items-center gap-2"
      title={`Current: ${currentTheme?.name}. Click to change.`}
    >
      <span className="text-lg">{currentTheme?.icon}</span>
      <span className="text-xs text-gray-400 hidden sm:inline">{currentTheme?.name}</span>
    </button>
  );
};
