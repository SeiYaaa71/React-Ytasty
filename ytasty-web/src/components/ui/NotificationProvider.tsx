import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Snackbar, type AlertColor } from '@mui/material';

interface Notification {
  id: number;
  message: string;
  severity: AlertColor;
}

type Notify = (message: string, severity?: AlertColor) => void;

const NotificationContext = createContext<Notify>(() => undefined);

/** Snackbar global : `const notify = useNotify(); notify('Produit créé', 'success');` */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Notification[]>([]);
  const current = queue[0];

  const notify = useCallback<Notify>((message, severity = 'info') => {
    setQueue((items) => [...items, { id: Date.now() + Math.random(), message, severity }]);
  }, []);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setQueue((items) => items.slice(1));
  };

  const value = useMemo(() => notify, [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        key={current?.id}
        open={Boolean(current)}
        autoHideDuration={3500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {current ? (
          <Alert onClose={handleClose} severity={current.severity} variant="filled" sx={{ width: '100%' }}>
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => useContext(NotificationContext);
