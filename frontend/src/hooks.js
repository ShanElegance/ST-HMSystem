import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, SOCKET_URL } from './api';

export const useFetch = (url, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const load = async () => {
    if (!url) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try { setData((await api.get(url)).data); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, deps); // eslint-disable-line
  return { data, setData, loading, reload: load };
};

export const useSocket = () => {
  const ref = useRef(null);
  const [, setTick] = useState(0);
  useEffect(() => {
    const s = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    ref.current = s;
    setTick((t) => t + 1);
    return () => {
      s.disconnect();
      ref.current = null;
    };
  }, []);
  return ref;
};

// Buses with live positions pushed through socket.io
export const useLiveBuses = () => {
  const { data, setData, loading } = useFetch('/buses');
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    const s = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    setSocket(s);
    const h = (u) => setData((prev) => prev && prev.map((b) => (b._id === u._id ? { ...b, location: u.location } : b)));
    s.on('bus:update', h);
    return () => {
      s.off('bus:update', h);
      s.disconnect();
    };
  }, []);
  return { buses: data || [], loading, socket: { current: socket } };
};
