import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ApiService } from '../api.service';
import { SocketService } from '../socket.service';
import { AuthService } from '../auth.service';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet (problema común)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

@Component({
  selector: 'app-delivery-panel',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule],
  template: `
    <div class="map-container">
      <div id="map"></div>
    </div>
    <p-table [value]="packages" styleClass="p-datatable-sm">
      <ng-template pTemplate="header">
        <tr>
          <th>Location</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-pkg>
        <tr>
          <td>{{pkg.lat | number:'1.4-4'}}, {{pkg.lng | number:'1.4-4'}}</td>
          <td>
            <p-tag [value]="getStatusLabel(pkg.status)" 
                   [severity]="getStatusSeverity(pkg.status)">
            </p-tag>
          </td>
          <td>
            <p-button 
              [label]="getNextStatusLabel(pkg.status)" 
              styleClass="p-button-sm"
              [icon]="getNextStatusIcon(pkg.status)"
              (onClick)="updateToNextStatus(pkg)">
            </p-button>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
  styles: [`
    .map-container {
      height: 400px;
      width: 100%;
      margin-bottom: 20px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    #map {
      height: 100%;
      width: 100%;
    }
    :host ::ng-deep .p-datatable {
      font-size: 0.9rem;
    }
    :host ::ng-deep .p-button {
      min-width: 120px;
    }
  `]
})
export class DeliveryPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  packages: any[] = [];
  
  // Definir el orden de los estados
  statusOrder = ['pendiente', 'en_transito', 'entregado', 'regresado'];
  statusLabels: { [key: string]: string } = {
    'pendiente': 'Pendiente',
    'en_transito': 'En Tránsito',
    'entregado': 'Entregado',
    'regresado': 'Regresado'
  };
  
  statusIcons: { [key: string]: string } = {
    'pendiente': 'pi pi-arrow-right',
    'en_transito': 'pi pi-truck',
    'entregado': 'pi pi-check',
    'regresado': 'pi pi-undo'
  };
  
  statusSeverity: { [key: string]: string } = {
    'pendiente': 'warning',
    'en_transito': 'info',
    'entregado': 'success',
    'regresado': 'danger'
  };

  map!: L.Map;
  myMarker!: L.Marker;
  packageMarkers: { [key: string]: L.Marker } = {};
  locationInterval: any;
  private mapInitialized: boolean = false;
  private packageInterval: any;

  constructor(
    private apiService: ApiService, 
    private socketService: SocketService, 
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPackages();
    this.startPackageUpdates();
  }

  ngAfterViewInit() {
    this.initMap();
    this.startLocationSharing();
  }

  private startPackageUpdates() {
    this.packageInterval = setInterval(() => {
      this.loadPackages();
    }, 10000);
  }

  private stopPackageUpdates() {
    if (this.packageInterval) {
      clearInterval(this.packageInterval);
    }
  }

  private clearPackageMarkers() {
    Object.values(this.packageMarkers).forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.packageMarkers = {};
  }

  ngOnDestroy() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
    }
    if (this.map) {
      this.map.remove();
    }
    this.stopPackageUpdates(); 
  }

  private initMap() {
    if (this.mapInitialized) return;

    // Inicializar el mapa con vista por defecto
    this.map = L.map('map').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Esperar a que el mapa se renderice completamente
    setTimeout(() => {
      this.map.invalidateSize();
      this.mapInitialized = true;
    }, 100);
  }

  loadPackages() {
    this.apiService.getDeliveryPackages().subscribe((data) => {
      this.packages = data;
      this.clearPackageMarkers();
      data.forEach((p: any) => {
        this.addPackageMarker(p.id, p.lat, p.lng, p.status);
      });
    });
  }

  private addPackageMarker(id: string, lat: number, lng: number, status: string) {
    // Determinar color según estado
    let markerColor = 'blue';
    if (status === 'entregado') markerColor = 'green';
    if (status === 'regresado') markerColor = 'red';
    if (status === 'en_transito') markerColor = 'orange';

    const marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColor}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(this.map);
    
    marker.bindPopup(`<b>Package</b><br>Status: ${this.getStatusLabel(status)}`);
    this.packageMarkers[id] = marker;
  }

  getStatusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }

  getStatusSeverity(status: string): string {
    return this.statusSeverity[status] || 'secondary';
  }

  getNextStatus(currentStatus: string): string {
    const currentIndex = this.statusOrder.indexOf(currentStatus);
    if (currentIndex === -1) return this.statusOrder[0];
    
    // Avanzar al siguiente estado, si es el último volver al primero
    const nextIndex = (currentIndex + 1) % this.statusOrder.length;
    return this.statusOrder[nextIndex];
  }

  getNextStatusLabel(currentStatus: string): string {
    const nextStatus = this.getNextStatus(currentStatus);
    return this.statusLabels[nextStatus];
  }

  getNextStatusIcon(currentStatus: string): string {
    const nextStatus = this.getNextStatus(currentStatus);
    return this.statusIcons[nextStatus];
  }

  updateToNextStatus(pkg: any) {
    const nextStatus = this.getNextStatus(pkg.status);
    
    this.apiService.updatePackageStatus(pkg.id, nextStatus).subscribe(() => {
      // Actualizar el estado localmente
      pkg.status = nextStatus;
      
      // Actualizar el color del marcador según el nuevo estado
      if (this.packageMarkers[pkg.id]) {
        let markerColor = 'blue';
        if (nextStatus === 'entregado') markerColor = 'green';
        if (nextStatus === 'regresado') markerColor = 'red';
        if (nextStatus === 'en_transito') markerColor = 'orange';
        
        const newIcon = L.icon({
          iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColor}.png`,
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        
        this.packageMarkers[pkg.id].setIcon(newIcon);
        this.packageMarkers[pkg.id].setPopupContent(`<b>Package</b><br>Status: ${this.getStatusLabel(nextStatus)}`);
      }
    });
  }

  startLocationSharing() {
    // Obtener ubicación inmediatamente
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => this.updateMyLocation(position),
        (error) => console.error('Error getting location', error),
        { enableHighAccuracy: true }
      );
    }

    // Configurar intervalo para actualizaciones periódicas
    this.locationInterval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => this.updateMyLocation(position),
          (error) => console.error('Error getting location', error),
          { enableHighAccuracy: true }
        );
      }
    }, 10000);  // Cada 10 segundos
  }

  private updateMyLocation(position: GeolocationPosition) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    
    // Actualizar mi ubicación en el servidor
    this.apiService.updateLocation(lat, lng).subscribe();
    this.socketService.sendLocation(this.authService.getToken() || '', lat, lng);
    
    // Actualizar o crear mi marcador
    if (this.myMarker) {
      this.myMarker.setLatLng([lat, lng]);
    } else {
      this.myMarker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      })
      .bindPopup('<b>My Location</b>')
      .addTo(this.map);
    }
    
    // Centrar el mapa en mi ubicación
    this.map.setView([lat, lng], 13);
  }
}