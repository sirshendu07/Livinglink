import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { socketService } from '../services/socket/socketClient';
import { useAuth } from './AuthContext';
import { ROLES } from '../constants';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeSosAlert, setActiveSosAlert] = useState(null);

  useEffect(() => {
    if (!user) {
      socketService.disconnect();
      return;
    }

    const socket = socketService.connect();

    // Listener: Incoming persistent notifications
    const unsubNotification = socketService.on('notification:new', (notification) => {
      toast(notification.title || 'New Notification', {
        icon: '🔔',
        style: {
          background: '#151A20',
          color: '#F1F3F5',
          border: '1px solid #252D36'
        }
      });
    });

    // Listener: Urgent Society Notice
    const unsubUrgentNotice = socketService.on('notice:urgent', (notice) => {
      toast.error(`URGENT NOTICE: ${notice.title}`, {
        duration: 8000,
        style: {
          background: '#1B222A',
          color: '#F07178',
          border: '1px solid #F07178'
        }
      });
    });

    // Listener: Visitor Arrival Request (Owner only)
    const unsubVisitorRequest = socketService.on('visitor:approval:request', (request) => {
      if (user.role === ROLES.OWNER) {
        toast(`Visitor at Gate: ${request.visitorName} (${request.category})`, {
          icon: '🚪',
          duration: 10000,
          style: {
            background: '#151A20',
            color: '#B8E0C1',
            border: '1px solid #B8E0C1'
          }
        });
      }
    });

    // Listener: Visitor Approval Decision (Security Guard only)
    const unsubVisitorDecision = socketService.on('visitor:decision:updated', (request) => {
      if (user.role === ROLES.SECURITY) {
        const isApproved = request.status === 'APPROVED';
        toast(`Visitor ${request.visitorName}: ${request.status}`, {
          icon: isApproved ? '✅' : '❌',
          style: {
            background: '#151A20',
            color: isApproved ? '#48C78E' : '#F07178',
            border: `1px solid ${isApproved ? '#48C78E' : '#F07178'}`
          }
        });
      }
    });

    // Listener: Emergency SOS Triggered (Security & Admin)
    const unsubSos = socketService.on('sos:alert:triggered', (sos) => {
      setActiveSosAlert(sos);
      toast.error(`🚨 EMERGENCY SOS TRIGGERED! Location: ${sos.flat ? `${sos.flat.tower}-${sos.flat.flatNumber}` : 'Society Premises'}`, {
        duration: 15000,
        style: {
          background: '#1F1214',
          color: '#F07178',
          border: '2px solid #F07178',
          fontWeight: 'bold'
        }
      });
    });

    return () => {
      unsubNotification();
      unsubUrgentNotice();
      unsubVisitorRequest();
      unsubVisitorDecision();
      unsubSos();
    };
  }, [user]);

  const value = {
    socket: socketService,
    activeSosAlert,
    clearSosAlert: () => setActiveSosAlert(null)
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
