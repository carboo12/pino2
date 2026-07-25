import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_PATH, SOCKET_URL } from '@/lib/runtime-config';

interface RealtimeContextValue {
  socket: Socket | null;
  connected: boolean;
  lastEvent: any;
  joinStore: (storeId: string) => void;
  leaveStore: (storeId: string) => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  socket: null,
  connected: false,
  lastEvent: null,
  joinStore: () => {},
  leaveStore: () => {},
});

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const joinedStores = useRef<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const namespaceUrl = `${SOCKET_URL}/events`.replace(/\/\//g, '/').replace(':/', '://');

    const socket = io(namespaceUrl, {
      transports: ['websocket'],
      autoConnect: true,
      path: SOCKET_PATH,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('sync_update', (data: any) => setLastEvent(data));
    socket.on('store_update', (data: any) => setLastEvent(data));

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, []);

  const joinStore = (storeId: string) => {
    if (!socketRef.current || joinedStores.current.has(storeId)) return;
    joinedStores.current.add(storeId);
    socketRef.current.emit('join_store', storeId);
  };

  const leaveStore = (storeId: string) => {
    if (!socketRef.current) return;
    joinedStores.current.delete(storeId);
  };

  return (
    <RealtimeContext.Provider value={{ socket: socketRef.current, connected, lastEvent, joinStore, leaveStore }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => useContext(RealtimeContext);
