import type { Server as SocketIOServer } from "socket.io";
let io: SocketIOServer | null = null;
export function setIo(instance: SocketIOServer) { io = instance; }
export function getIo(): SocketIOServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
