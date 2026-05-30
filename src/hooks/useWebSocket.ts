import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useRobotStore } from '../store/robotStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateRobot = useRobotStore((s) => s.updateRobot);

  useEffect(() => {
    const socket = io(SOCKET_URL as string, { autoConnect: true });

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => setError(err.message));
    socket.on('robot:update', updateRobot);

    return () => {
      socket.disconnect();
    };
  }, [updateRobot]);

  return { connected, error };
}
