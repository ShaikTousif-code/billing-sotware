import { useEffect, useState } from 'react'

interface ServiceWorkerState {
  updateAvailable: boolean
  updateServiceWorker: () => void
  isInstalled: boolean
}

export const useServiceWorker = (): ServiceWorkerState => {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      let isMounted = true

      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          if (isMounted) {
            setRegistration(reg)
            setIsInstalled(true)

            // Check for updates immediately
            reg.update()

            // Listen for updates
            const checkForUpdates = () => {
              reg.update()
            }

            // Check for updates every 60 seconds
            const updateInterval = setInterval(checkForUpdates, 60000)

            // Listen for service worker updates
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && reg.waiting) {
                    // New service worker is waiting
                    if (isMounted) {
                      setUpdateAvailable(true)
                    }
                  }
                })
              }
            })

            // Check if there's already a waiting service worker
            if (reg.waiting) {
              if (isMounted) {
                setUpdateAvailable(true)
              }
            }

            return () => {
              clearInterval(updateInterval)
            }
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })

      return () => {
        isMounted = false
      }
    }
  }, [])

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      // Tell the waiting service worker to skip waiting and become active
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Reload the page to get the new service worker
      window.location.reload()
    }
  }

  return {
    updateAvailable,
    updateServiceWorker,
    isInstalled,
  }
}

