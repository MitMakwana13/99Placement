"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthProvider";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize Socket.io
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "";
    // Note: Since we're using a proxy in development, we can point to "/" or the explicit API URL
    // but we have to provide the correct path if we proxy. By default socket.io uses /socket.io
    const newSocket = io(socketUrl || "/", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("🟢 Connected to Real-time WebSocket server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("🔴 Disconnected from Real-time WebSocket server");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connect error:", error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
