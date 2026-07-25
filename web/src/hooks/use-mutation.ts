import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys?: readonly unknown[][],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      }
    },
  });
}
