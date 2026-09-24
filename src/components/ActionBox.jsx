import { useState } from 'react'
import { CloudUpload, Type } from 'lucide-react'

import { ClayIconBadge } from './ui/ClayIconBadge'
import { FileUploadForm } from './FileUploadForm'
import { TextSnippetForm } from './TextSnippetForm'

const TABS = [
  {
    key: 'text',
    label: 'Text Snippet',
    description: 'Paste anything worth keeping',
    icon: Type,
    gradient: 'indigo',
  },
  {
    key: 'file',
    label: 'Media / File Upload',
    description: 'Drop documents, images or archives',
    icon: CloudUpload,
    gradient: 'mint',
  },
]

/**
 * The clay action box: one raised panel with a tactile tab toggle that swaps
 * between the snippet composer and the file dropzone.
 */
export function ActionBox({ onCreated }) {
  const [activeTab, setActiveTab] = useState('text')
  const active = TABS.find((tab) => tab.key === activeTab) ?? TABS[0]

  return (
    <section className="clay-panel rounded-clay-lg animate-pop p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClayIconBadge icon={active.icon} gradient={active.gradient} size="lg" />
          <div>
            <h2 className="text-lg font-extrabold text-clay-50">Add to your bridge</h2>
            <p className="text-xs text-clay-400">{active.description}</p>
          </div>
        </div>
      </div>

      <div className="clay-tab-track mt-6 flex rounded-full p-1.5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            aria-pressed={activeTab === key}
            className={`clay-tab flex-1 px-3 py-2.5 text-xs sm:text-sm ${
              activeTab === key ? 'clay-tab-active' : ''
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div key={activeTab} className="clay-divider my-6" />

      <div key={`${activeTab}-body`} className="animate-pop">
        {activeTab === 'text' ? (
          <TextSnippetForm onCreated={onCreated} />
        ) : (
          <FileUploadForm onCreated={onCreated} />
        )}
      </div>
    </section>
  )
}

export default ActionBox
