import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi, MasterRecord } from '../lib/api'

export function useMasters(masterKey: string) {
  const queryClient = useQueryClient()

  const {
    data: records = [],
    isLoading,
    error
  } = useQuery({
    queryKey: [masterKey],
    queryFn: () => masterApi.getAll(masterKey),
    retry: 1,
    retryDelay: 1000,
  })

  const createMutation = useMutation({
    mutationFn: (data: MasterRecord) => masterApi.create(masterKey, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [masterKey] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MasterRecord }) => 
      masterApi.update(masterKey, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [masterKey] })
      console.log(`✅ useMasters: Successfully updated ${masterKey} record`)
    },
    onError: (error) => {
      console.error(`❌ useMasters: Update mutation error for ${masterKey}:`, error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterApi.delete(masterKey, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [masterKey] })
      console.log(`✅ useMasters: Successfully deleted ${masterKey} record`)
    },
    onError: (error) => {
      console.error(`❌ useMasters: Delete mutation error for ${masterKey}:`, error)
    },
  })

  return {
    records,
    isLoading,
    error,
    createRecord: createMutation.mutateAsync,
    updateRecord: updateMutation.mutateAsync,
    deleteRecord: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

export function useMasterOptions(relationKey: string) {
  const { data: options = [], isLoading } = useQuery({
    queryKey: ['options', relationKey],
    queryFn: () => masterApi.getOptions(relationKey),
    enabled: !!relationKey,
  })

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : []

  return { options: safeOptions, isLoading }
}
