import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from './environment.prod';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;
  private baseUrl = environment.socketUrl;

  constructor(private authService: AuthService) {
    const token = localStorage.getItem('authToken');
    const username = this.authService.getUsername();

    this.socket = io(this.baseUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token,
        username: username
      }
    });
    console.log('Socket connecting with:', { token, username });
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