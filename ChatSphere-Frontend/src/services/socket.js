import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:3000";

let socket = null;

export const connectSocket = () => {
  const token =
    sessionStorage.getItem("token");

  if (!token) {
    console.warn(
      "Cannot connect socket: no token"
    );

    return null;
  }

  if (socket) {
    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: [
      "websocket",
      "polling",
    ],

    withCredentials: true,

    auth: {
      token,
    },

    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.log(
      "ChatSphere socket connected:",
      socket.id
    );

    // Backend gets the authenticated user
    // from socket.handshake.auth.token.
    socket.emit("join");
  });

  socket.on(
    "disconnect",
    (reason) => {
      console.log(
        "ChatSphere socket disconnected:",
        reason
      );
    }
  );

  socket.on(
    "connect_error",
    (error) => {
      console.error(
        "ChatSphere socket error:",
        error.message
      );
    }
  );

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};

export const onSocketEvent = (
  event,
  handler
) => {
  const currentSocket =
    connectSocket();

  if (!currentSocket) {
    return () => {};
  }

  currentSocket.on(event, handler);

  return () => {
    currentSocket.off(
      event,
      handler
    );
  };
};

export const emitSocketEvent = (
  event,
  data
) => {
  const currentSocket =
    connectSocket();

  if (!currentSocket) return;

  currentSocket.emit(event, data);
};