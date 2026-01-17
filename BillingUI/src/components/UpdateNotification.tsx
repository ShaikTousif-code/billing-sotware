import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useServiceWorker } from '../hooks/useServiceWorker'

const UpdateNotification = () => {
  const { updateAvailable, updateServiceWorker } = useServiceWorker()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (updateAvailable) {
      setIsVisible(true)
    }
  }, [updateAvailable])

  if (!isVisible || !updateAvailable) {
    return null
  }

  const handleUpdate = () => {
    updateServiceWorker()
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slide-up">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <div className="flex-1">
            <p className="font-medium text-sm">New update available</p>
            <p className="text-xs text-blue-100">Refresh to get the latest version</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdate}
            className="px-3 py-1.5 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Update
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-blue-700 rounded-md transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpdateNotification

