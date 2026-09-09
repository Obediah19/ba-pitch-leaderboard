import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (val: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const Tabs: React.FC<{
  defaultValue: string;
  value?: string;
  onValueChange?: (val: string) => void;
  className?: string;
  children: React.ReactNode;
}> = ({ defaultValue, value, onValueChange, className = '', children }) => {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalTab;

  const setActiveTab = (val: string) => {
    if (value === undefined) setInternalTab(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <div
    className={`inline-flex items-center justify-center rounded-2xl bg-white/[0.06] p-1.5 text-[var(--theme-text-muted,#94a3b8)] border border-white/10 backdrop-blur-md ${className}`}
  >
    {children}
  </div>
);

export const TabsTrigger: React.FC<{
  value: string;
  className?: string;
  children: React.ReactNode;
}> = ({ value, className = '', children }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = ctx.activeTab === value;

  return (
    <button
      type="button"
      onClick={() => ctx.setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none cursor-pointer select-none ${
        isActive
          ? 'bg-[var(--theme-primary,#6366f1)] text-white shadow-lg shadow-[var(--theme-primary,#6366f1)]/25 font-semibold'
          : 'text-[var(--theme-text-muted,#94a3b8)] hover:text-white hover:bg-white/5'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{
  value: string;
  className?: string;
  children: React.ReactNode;
}> = ({ value, className = '', children }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used within Tabs');

  if (ctx.activeTab !== value) return null;

  return <div className={`mt-4 ${className}`}>{children}</div>;
};
