import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { logger } from "./logger";
import { verifyAccessToken, JwtPayload } from "../utils/jwt";
import { env } from "./env";

export interface ServerToClientEvents {
  "pipeline:updated": (data: { candidateId: string; stage: string; updatedAt: string; recruiterId: string }) => void;
  "notification:created": (data: any) => void;
  "activity:created": (data: any) => void;
  "presence:update": (data: { entityId: string; users: Array<{ id: string; name: string }> }) => void;
}

export interface ClientToServerEvents {
  "presence:join": (data: { entityId: string }) => void;
  "presence:leave": (data: { entityId: string }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  user: JwtPayload;
}

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// In-memory presence tracking (for single node)
// tenantId -> entityId -> userId -> User details
const presenceMap = new Map<string, Map<string, Map<string, { id: string; name: string }>>>();

export function initSocketServer(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.APP_URL, // Frontend URL
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    
    // Automatically join the tenant room for data isolation
    const tenantRoom = `tenant_${user.tenantId}`;
    socket.join(tenantRoom);
    
    logger.info({ userId: user.userId, tenantId: user.tenantId, socketId: socket.id }, "🟢 Socket connected");

    socket.on("presence:join", ({ entityId }) => {
      socket.join(`presence_${entityId}`);
      
      let tenantPresence = presenceMap.get(user.tenantId);
      if (!tenantPresence) {
        tenantPresence = new Map();
        presenceMap.set(user.tenantId, tenantPresence);
      }
      
      let entityPresence = tenantPresence.get(entityId);
      if (!entityPresence) {
        entityPresence = new Map();
        tenantPresence.set(entityId, entityPresence);
      }
      
      // Store user presence
      entityPresence.set(user.userId, { id: user.userId, name: user.email.split("@")[0] });
      
      // Broadcast update to everyone in this entity room
      io.to(`presence_${entityId}`).emit("presence:update", {
        entityId,
        users: Array.from(entityPresence.values()),
      });
    });

    socket.on("presence:leave", ({ entityId }) => {
      socket.leave(`presence_${entityId}`);
      removePresence(user.tenantId, entityId, user.userId);
    });

    socket.on("disconnect", () => {
      // Clean up presence on disconnect
      const tenantPresence = presenceMap.get(user.tenantId);
      if (tenantPresence) {
        for (const [entityId, users] of tenantPresence.entries()) {
          if (users.has(user.userId)) {
            removePresence(user.tenantId, entityId, user.userId);
          }
        }
      }
      logger.info({ userId: user.userId, socketId: socket.id }, "🔴 Socket disconnected");
    });
  });

  function removePresence(tenantId: string, entityId: string, userId: string) {
    const tenantPresence = presenceMap.get(tenantId);
    if (!tenantPresence) return;
    
    const entityPresence = tenantPresence.get(entityId);
    if (!entityPresence) return;
    
    entityPresence.delete(userId);
    
    // Broadcast updated presence
    io.to(`presence_${entityId}`).emit("presence:update", {
      entityId,
      users: Array.from(entityPresence.values()),
    });
  }

  return io;
}

export function getSocketServer() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
