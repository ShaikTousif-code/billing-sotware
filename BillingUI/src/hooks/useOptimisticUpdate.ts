import { useState, useCallback } from 'react'

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  rollbackOnError?: boolean
}

export function useOptimisticUpdate<T>(
  initialData: T[],
  updateFn: (item: T) => Promise<T>,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [data, setData] = useState<T[]>(initialData)
  const [isUpdating, setIsUpdating] = useState(false)

  const update = useCallback(
    async (item: T, optimisticItem?: Partial<T>) => {
      const previousData = [...data]
      
      // Optimistic update
      if (optimisticItem) {
        setData((prev) =>
          prev.map((i) => (i === item ? { ...i, ...optimisticItem } : i))
        )
      }

      setIsUpdating(true)
      try {
        const updated = await updateFn(item)
        setData((prev) => prev.map((i) => (i === item ? updated : i)))
        options.onSuccess?.(updated)
        return updated
      } catch (error) {
        // Rollback on error
        if (options.rollbackOnError !== false) {
          setData(previousData)
        }
        options.onError?.(error as Error)
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [data, updateFn, options]
  )

  const add = useCallback(
    async (item: T, addFn: (item: T) => Promise<T>) => {
      const tempId = Math.random()
      const tempItem = { ...item, id: tempId } as T
      
      // Optimistic add
      setData((prev) => [...prev, tempItem])

      try {
        const created = await addFn(item)
        setData((prev) => prev.map((i) => (i === tempItem ? created : i)))
        options.onSuccess?.(created)
        return created
      } catch (error) {
        // Rollback
        setData((prev) => prev.filter((i) => i !== tempItem))
        options.onError?.(error as Error)
        throw error
      }
    },
    [options]
  )

  const remove = useCallback(
    async (item: T, removeFn: (item: T) => Promise<void>) => {
      const previousData = [...data]
      
      // Optimistic remove
      setData((prev) => prev.filter((i) => i !== item))

      try {
        await removeFn(item)
        options.onSuccess?.(item as T)
      } catch (error) {
        // Rollback
        setData(previousData)
        options.onError?.(error as Error)
        throw error
      }
    },
    [data, options]
  )

  return { data, update, add, remove, isUpdating, setData }
}

