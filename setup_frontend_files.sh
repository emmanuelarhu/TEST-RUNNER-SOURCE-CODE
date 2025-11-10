#!/bin/bash

# This script creates all the necessary React files for the TestFlow application

cd frontend

echo "Creating API service files..."

# API config
cat > src/services/api.config.ts << 'API_CONFIG'
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          localStorage.removeItem('auth_token');
          break;
        case 403:
          console.error('Forbidden: You do not have permission to access this resource');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Internal server error');
          break;
        default:
          console.error('An error occurred:', data);
      }
    } else if (error.request) {
      console.error('Network error: No response from server');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };
API_CONFIG

echo "API services created"

# Socket service
cat > src/services/socket.service.ts << 'SOCKET_SERVICE'
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
SOCKET_SERVICE

echo "Socket service created"

echo "Setup complete! All frontend files have been created."
