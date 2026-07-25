import { useCallback, useEffect, useState } from 'react';
import { toast } from '@/lib/swalert';
import { useRealtime } from '@/contexts/realtime-context';

export const useRealTimeEvents = (storeId?: string) => {
  const { socket, connected } = useRealtime();
  const [lastEvent, setLastEvent] = useState<any>(null);

  const isRelevantEvent = useCallback(
    (event: any) => {
      if (!storeId || !event?.storeId) {
        return true;
      }

      return event.storeId === storeId;
    },
    [storeId],
  );

  const handleNotification = useCallback((event: any) => {
    switch (event.type) {
      case 'NEW_ORDER':
        toast.success(
          '¡Nuevo Pedido!',
          `Se ha recibido una orden por C$ ${Number(event.payload?.total || 0).toFixed(2)}`
        );
        break;
      case 'NEW_VISIT':
        toast.info(
          'Nueva Visita en Ruta',
          `El vendedor ha registrado una visita en: ${event.payload?.clientId || 'Cliente desconocido'}`
        );
        break;
      case 'NOTIFICATION':
        toast.info(
          event.payload?.title || 'Notificación',
          event.payload?.message || 'Tienes un nuevo aviso.'
        );
        break;
      case 'ORDER_STATUS_CHANGE':
        toast.info(
          `Pedido ${event.payload?.orderId?.substring(0, 8)}`,
          `Ha cambiado de estado a: ${event.payload?.status?.replace('_', ' ')}`
        );
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (socket && connected && storeId) {
      socket.emit('join_store', storeId);
    }
  }, [socket, connected, storeId]);

  useEffect(() => {
    if (!socket) return;

    const handleRealtimeEvent = (data: any) => {
      if (!isRelevantEvent(data)) {
        return;
      }

      setLastEvent(data);
      handleNotification(data);
    };

    socket.on('sync_update', handleRealtimeEvent);
    socket.on('store_update', handleRealtimeEvent);

    return () => {
      socket.off('sync_update', handleRealtimeEvent);
      socket.off('store_update', handleRealtimeEvent);
    };
  }, [socket, isRelevantEvent, handleNotification]);

  return { socket, lastEvent, connected };
};
