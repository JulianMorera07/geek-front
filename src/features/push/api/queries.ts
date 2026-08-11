'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import {
  fetchPushPublicKey,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/features/push/api/http-client';

export const pushKeys = {
  publicKey: ['push', 'public-key'] as const,
};

/** `null` (sin error) si el backend todavía no configuró las keys — ver `fetchPushPublicKey`. */
export function usePushPublicKeyQuery() {
  return useQuery({
    queryKey: pushKeys.publicKey,
    queryFn: fetchPushPublicKey,
    staleTime: Infinity,
    retry: false,
  });
}

export function useSubscribeToPushMutation() {
  return useMutation({
    mutationFn: ({
      subscription,
      accessToken,
    }: {
      subscription: PushSubscriptionJSON;
      accessToken?: string;
    }) => subscribeToPush(subscription, accessToken),
  });
}

export function useUnsubscribeFromPushMutation() {
  return useMutation({
    mutationFn: ({ endpoint, accessToken }: { endpoint: string; accessToken?: string }) =>
      unsubscribeFromPush(endpoint, accessToken),
  });
}
