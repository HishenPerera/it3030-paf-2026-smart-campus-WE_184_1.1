import { useContext } from 'react';
import NotificationContext from './NotificationContext';

export default function useNotifications() {
  return useContext(NotificationContext);
}

