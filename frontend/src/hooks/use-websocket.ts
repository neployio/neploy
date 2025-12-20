import { useCallback, useEffect } from "react";
import { connectInteractive, connectNotifications, disconnect, sendInteractiveMessage, subscribeToInteractive, subscribeToNotifications } from "frontend/src/services/websocket";
import { ActionType } from "frontend/src/types/websocket";

export function useWebSocket() {
  useEffect(() => {
    connectNotifications();
    connectInteractive();

    return () => {
      disconnect();
    };
  }, []);

  const onNotification = useCallback((callback: (message: any) => void) => {
    return subscribeToNotifications(callback);
  }, []);

  const onInteractive = useCallback((callback: (message: any) => void) => {
    return subscribeToInteractive(callback);
  }, []);

  const sendMessage = useCallback((type: ActionType, action: string, data?: any) => {
    sendInteractiveMessage(type, action, data);
  }, []);

  return {
    onNotification,
    onInteractive,
    sendMessage,
  };
}
