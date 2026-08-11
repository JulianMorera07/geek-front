'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/base/typography';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/use-auth';
import { authSessionManager } from '@/features/auth/session-manager';
import {
  usePushPublicKeyQuery,
  useSubscribeToPushMutation,
  useUnsubscribeFromPushMutation,
} from '@/features/push/api/queries';
import { isPushSupported, urlBase64ToUint8Array } from '@/features/push/push-utils';

type SubscriptionState = 'checking' | 'subscribed' | 'unsubscribed';

/**
 * Card completo (con su propio título) para activar/desactivar notificaciones
 * push del navegador (capítulos nuevos de animes en emisión). No renderiza
 * NADA — ni un card vacío — en cualquier caso donde no pueda funcionar de
 * verdad: navegador sin soporte, o backend sin las VAPID keys configuradas
 * todavía (`GET /push/public-key` en 404, acordado con el backend).
 * `accessToken` es opcional: con sesión, liga la suscripción al usuario; sin
 * sesión, sigue funcionando anónima por dispositivo.
 */
function PushNotificationsToggle() {
  const { isAuthenticated } = useAuth();
  const publicKeyQuery = usePushPublicKeyQuery();
  const subscribeMutation = useSubscribeToPushMutation();
  const unsubscribeMutation = useUnsubscribeFromPushMutation();

  const [state, setState] = React.useState<SubscriptionState>('checking');
  const [supported, setSupported] = React.useState(false);

  React.useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false);
      return;
    }
    setSupported(true);
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setState(subscription ? 'subscribed' : 'unsubscribed'))
      .catch(() => setState('unsubscribed'));
  }, []);

  async function handleEnable() {
    setState('checking');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('No diste permiso de notificaciones — revisa los permisos del navegador para este sitio.');
        setState('unsubscribed');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKeyQuery.data!),
      });

      await subscribeMutation.mutateAsync({
        subscription: subscription.toJSON(),
        accessToken: isAuthenticated ? (authSessionManager.getAccessToken() ?? undefined) : undefined,
      });

      setState('subscribed');
      toast.success('Notificaciones activadas');
    } catch (error) {
      console.error('[PushNotificationsToggle] No se pudo activar:', error);
      toast.error('No pudimos activar las notificaciones. Intenta de nuevo.');
      setState('unsubscribed');
    }
  }

  async function handleDisable() {
    setState('checking');
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
          accessToken: isAuthenticated ? (authSessionManager.getAccessToken() ?? undefined) : undefined,
        });
        await subscription.unsubscribe();
      }
      setState('unsubscribed');
      toast.success('Notificaciones desactivadas');
    } catch (error) {
      console.error('[PushNotificationsToggle] No se pudo desactivar:', error);
      toast.error('No pudimos desactivar las notificaciones. Intenta de nuevo.');
      setState('subscribed');
    }
  }

  // Ni el Card se monta: sin soporte del navegador, sin VAPID key
  // configurada en el backend (`data === null`, no un error — 404
  // documentado), o mientras la key todavía está cargando (evita parpadeo
  // mostrando/ocultando el Card completo).
  if (!supported || publicKeyQuery.isPending || !publicKeyQuery.data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones push</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between py-1">
          <div className="flex flex-col gap-0.5">
            <label htmlFor="push-notifications" className="text-sm font-medium">
              Activar en este navegador
            </label>
            <Text variant="muted" className="text-xs">
              Avisos cuando salga un capítulo nuevo de un anime en emisión.
            </Text>
          </div>
          <Switch
            id="push-notifications"
            checked={state === 'subscribed'}
            disabled={state === 'checking'}
            onCheckedChange={(checked) => (checked ? handleEnable() : handleDisable())}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export { PushNotificationsToggle };
