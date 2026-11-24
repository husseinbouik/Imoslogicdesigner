import type { ReactNode } from "react";
import "./Tabs.css";

interface Tab {
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
}

export function Tabs({ tabs, activeTabIndex, onTabChange }: TabsProps) {
  return (
    <div className="tabs-container">
      <div className="tab-list">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab-list-item ${
              index === activeTabIndex ? "active" : ""
            }`}
            onClick={() => onTabChange(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">{tabs[activeTabIndex]?.content}</div>
    </div>
  );
}
