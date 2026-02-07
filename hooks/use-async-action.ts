import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAsyncActionOptions {
  onSuccess?: (data?: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Hook to handle async actions with loading state and duplicate prevention
 * 
 * @example
 * const { execute, isLoading } = useAsyncAction({
 *   successMessage: 'Menu created successfully',
 *   onSuccess: () => router.push('/dashboard/menus')
 * });
 * 
 * <Button onClick={() => execute(api.post('/menus', data))} disabled={isLoading}>
 *   {isLoading && <Loader2 className="animate-spin" />}
 *   {isLoading ? 'Creating...' : 'Create Menu'}
 * </Button>
 */
export function useAsyncAction(options: UseAsyncActionOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const execute = useCallback(
    async <T = any>(promise: Promise<T> | (() => Promise<T>)): Promise<T | null> => {
      // Prevent duplicate calls
      if (isLoading) {
        console.warn('Action already in progress, ignoring duplicate call');
        return null;
      }

      try {
        setIsLoading(true);

        // Execute the promise or promise factory
        const result = typeof promise === 'function' ? await promise() : await promise;

        // Show success toast if configured
        if (showSuccessToast && successMessage) {
          toast({
            title: 'Success',
            description: successMessage,
          });
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error: any) {
        console.error('Async action error:', error);

        // Show error toast if configured
        if (showErrorToast) {
          const message = errorMessage || error.message || 'An error occurred';
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive',
          });
        }

        // Call error callback
        if (onError) {
          onError(error);
        }

        throw error; // Re-throw for caller to handle if needed
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, onSuccess, onError, successMessage, errorMessage, showSuccessToast, showErrorToast, toast]
  );

  return {
    execute,
    isLoading,
  };
}

/**
 * Hook for form submissions with loading state
 * 
 * @example
 * const { handleSubmit, isSubmitting } = useFormSubmit({
 *   onSubmit: async (data) => await api.post('/menus', data),
 *   successMessage: 'Menu created',
 *   onSuccess: () => setOpen(false)
 * });
 * 
 * <form onSubmit={handleSubmit}>
 *   <Button type="submit" disabled={isSubmitting}>
 *     {isSubmitting ? 'Saving...' : 'Save'}
 *   </Button>
 * </form>
 */
export function useFormSubmit<T = any>(options: {
  onSubmit: (data?: T) => Promise<any>;
  onSuccess?: (result?: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}) {
  const { execute, isLoading: isSubmitting } = useAsyncAction({
    successMessage: options.successMessage,
    errorMessage: options.errorMessage,
    showSuccessToast: options.showSuccessToast,
    showErrorToast: options.showErrorToast,
    onSuccess: options.onSuccess,
    onError: options.onError,
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent, data?: T) => {
      e.preventDefault();
      await execute(() => options.onSubmit(data));
    },
    [execute, options.onSubmit]
  );

  return {
    handleSubmit,
    isSubmitting,
  };
}
