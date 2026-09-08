import { useEffect, useState } from 'react';
import { checkHealth } from '../services/api.js';

const useHealthCheck = () => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;

    checkHealth()
      .then(() => {
        if (isMounted) setStatus('connected');
      })
      .catch(() => {
        if (isMounted) setStatus('disconnected');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return status;
};

export default useHealthCheck;
