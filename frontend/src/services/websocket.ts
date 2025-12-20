import { ActionMessage, ActionType, ProgressMessage } from "frontend/src/types/websocket";

let notificationsSocket: WebSocket | null = null;
let interactiveSocket: WebSocket | null = null;
const notificationsCallbacks: Set<(message: ProgressMessage) => void> = new Set();
const interactiveCallbacks: Set<(message: ActionMessage) => void> = new Set();
const readyCallbacks: Set<() => void> = new Set();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000;

export const connectNotifications = () => {
  if (notificationsSocket?.readyState === WebSocket.OPEN) return;

  notificationsSocket = new WebSocket(`ws://${window.location.host}/ws/notifications`);

  notificationsSocket.onmessage = (event) => {
    const message = JSON.parse(event.data) as ProgressMessage;
    if (message.type === "progress") {
      notificationsCallbacks.forEach((callback) => callback(message));
    }
  };

  notificationsSocket.onerror = (error) => {
    console.error("Notifications WebSocket error:", error);
  };

  notificationsSocket.onclose = () => {
    console.log("Notifications WebSocket closed");
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), 30000);
      setTimeout(connectNotifications, delay);
      reconnectAttempts++;
    }
  };
};

export const connectInteractive = () => {
  if (interactiveSocket?.readyState === WebSocket.OPEN) {
    readyCallbacks.forEach((callback) => callback());
    return;
  }

  interactiveSocket = new WebSocket(`ws://${window.location.host}/ws/interactive`);

  interactiveSocket.onopen = () => {
    console.log("Interactive WebSocket connected");
    reconnectAttempts = 0;
    readyCallbacks.forEach((callback) => callback());
  };

  interactiveSocket.onmessage = (event) => {
    const message = JSON.parse(event.data) as ActionMessage;
    interactiveCallbacks.forEach((callback) => callback(message));
  };

  interactiveSocket.onerror = (error) => {
    console.error("Interactive WebSocket error:", error);
  };

  interactiveSocket.onclose = () => {
    console.log("Interactive WebSocket closed");
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), 30000);
      setTimeout(connectInteractive, delay);
      reconnectAttempts++;
    }
  };
};

export const subscribeToNotifications = (callback: (message: ProgressMessage) => void) => {
  notificationsCallbacks.add(callback);
  return () => {
    notificationsCallbacks.delete(callback);
  };
};

export const subscribeToInteractive = (callback: (message: ActionMessage) => void) => {
  interactiveCallbacks.add(callback);
  return () => {
    interactiveCallbacks.delete(callback);
  };
};

export const waitForInteractiveReady = (): Promise<void> => {
  return new Promise((resolve) => {
    if (interactiveSocket?.readyState === WebSocket.OPEN) {
      resolve();
    } else {
      const callback = () => {
        readyCallbacks.delete(callback);
        resolve();
      };
      readyCallbacks.add(callback);
      connectInteractive();
    }
  });
};

export const sendInteractiveMessage = async (type: ActionType, action: string, data?: any) => {
  await waitForInteractiveReady();
  if (interactiveSocket?.readyState === WebSocket.OPEN) {
    interactiveSocket.send(JSON.stringify({ type, action, data }));
  } else {
    console.error("Interactive WebSocket is not connected");
  }
};

export const disconnect = () => {
  notificationsSocket?.close();
  interactiveSocket?.close();
  notificationsSocket = null;
  interactiveSocket = null;
  notificationsCallbacks.clear();
  interactiveCallbacks.clear();
  readyCallbacks.clear();
};
