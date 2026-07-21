import { useState } from 'react'
import type { ReactNode } from 'react'

export interface TabDef {
  key: string
  label: string
  content: ReactNode
}

export function Tabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.key)

  return (
    <div className="tabs">
      <div className="tab-list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={active === tab.key}
            className={active === tab.key ? 'tab active' : 'tab'}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-panel">{tabs.find((tab) => tab.key === active)?.content}</div>
    </div>
  )
}
