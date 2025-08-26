import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor(private authService: AuthService) {
    this.socket = io('http://localhost:3000', {
      auth: {
        token: localStorage.getItem('authToken'),
        username: this.authService.getUsername()
      }
    });
  }

  sendLocation(userId: string, lat: number, lng: number) {
    this.socket.emit('updateLocation', { lat, lng });
  }

  onLocationUpdate(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('locationUpdate', (data) => {
        observer.next(data);
      });
    });
  }

  onDeliveryConnected(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('deliveryConnected', (data) => {
        observer.next(data);
      });
    });
  }

  onDeliveryDisconnected(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('deliveryDisconnected', (data) => {
        observer.next(data);
      });
    });
  }
}