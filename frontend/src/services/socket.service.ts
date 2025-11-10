import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api.config';

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  joinExecutionRoom(executionId: string): void {
    if (this.socket) {
      this.socket.emit('join-execution', executionId);
    }
  }

  onTestRunUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('test-run-update', callback);
    }
  }

  offTestRunUpdate(): void {
    if (this.socket) {
      this.socket.off('test-run-update');
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export default new SocketService();
