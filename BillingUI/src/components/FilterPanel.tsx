import { useState, ReactNode } from 'react'
import { Filter, X } from 'lucide-react'

interface FilterPanelProps {
  children: ReactNode
  isOpen: boolean
  onToggle: () => void
  onReset: () => void
  activeFilterCount?: number
}

const FilterPanel = ({ children, isOpen, onToggle, onReset, activeFilterCount = 0 }: FilterPanelProps) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Filter Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              Reset
            </button>
          )}
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={isOpen ? 'Hide filters' : 'Show filters'}
          >
            {isOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterPanel

