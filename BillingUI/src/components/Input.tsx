import { InputHTMLAttributes, ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import Tooltip from './Tooltip'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: LucideIcon
  tooltip?: string
  fullWidth?: boolean
}

const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  tooltip,
  fullWidth = true,
  className = '',
  ...props
}: InputProps) => {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-1">
            {label}
            {tooltip && <Tooltip content={tooltip} icon />}
          </span>
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          className={`
            block w-full px-3 py-2 border rounded-lg shadow-sm
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}
            focus:outline-none focus:ring-2 transition-colors
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 animate-fade-in">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  )
}

export default Input

