import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './environment.prod';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('authToken')}`
    });
  }

  assignPackage(deliveryId: string, lat: number, lng: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/assign-package`, { deliveryId, lat, lng }, { headers: this.getHeaders() });
  }

  getAdminPackages(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/packages`, { headers: this.getHeaders() });
  }

  getDeliveryPackages(): Observable<any> {
    return this.http.get(`${this.baseUrl}/delivery/packages`, { headers: this.getHeaders() });
  }

  updatePackageStatus(packageId: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/delivery/update-status/${packageId}`, { status }, { headers: this.getHeaders() });
  }

  updateLocation(lat: number, lng: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/delivery/update-location`, { lat, lng }, { headers: this.getHeaders() });
  }

  getAdminDeliveries(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/deliveries`, { headers: this.getHeaders() });
  }
}