import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { SocketService } from '../socket.service';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, TableModule, DialogModule, ButtonModule, FormsModule],
  template: `
    <div class="map-container">
      <div id="main-map"></div>
    </div>
    <p-table [value]="deliveries">
      <ng-template pTemplate="header">
        <tr><th>Name</th><th>Active</th><th>Location</th><th>Action</th></tr>
      </ng-template>
      <ng-template pTemplate="body" let-delivery>
        <tr>
          <td>{{delivery.username}}</td>
          <td>{{delivery.active ? 'Yes' : 'No'}}</td>
          <td>{{delivery.lat | number:'1.4-4'}}, {{delivery.lng | number:'1.4-4'}}</td>
          <td><p-button label="Assign Package" (onClick)="selectDelivery(delivery.id)"></p-button></td>
        </tr>
      </ng-template>
    </p-table>
    <p-dialog [(visible)]="displayModal" header="Assign Package" [modal]="true" [style]="{width: '80vw', 'max-width': '900px'}">
      <div class="dialog-content">
        <p>Select package location for delivery person: <strong>{{selectedDeliveryName}}</strong></p>
        
        <div class="selection-map-container">
          <div #selectionMap id="selection-map"></div>
        </div>
        
        <div class="location-info" *ngIf="packageLat && packageLng">
          <h4>Selected Location:</h4>
          <p>Latitude: {{packageLat | number:'1.6-6'}}</p>
          <p>Longitude: {{packageLng | number:'1.6-6'}}</p>
        </div>
        
        <div class="button-group">
          <p-button label="Confirm Assignment" 
                    (onClick)="assignPackage()" 
                    [disabled]="!packageLat || !packageLng"
                    icon="pi pi-check">
          </p-button>
          <p-button label="Cancel" 
                    (onClick)="cancelAssignment()" 
                    styleClass="p-button-secondary"
                    icon="pi pi-times">
          </p-button>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [
    `.map-container {
      height: 500px;
      width: 100%;
      margin-bottom: 20px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    #main-map {
      height: 100%;
    }

    p-table {
      margin-top: 20px;
    }

    .dialog-content {
      padding: 1rem;
    }

    .selection-map-container {
      height: 400px;
      margin: 1rem 0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    #selection-map {
      height: 100%;
    }

    .location-info {
      margin: 1rem 0;
      padding: 1rem;
      background: var(--surface-0);
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .location-info h4 {
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
    }

    .location-info p {
      margin: 0.25rem 0;
    }

    .button-group {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1rem;
    }`
  ]
})
export class AdminPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  deliveries: { id: string, username: string, lat: number | null, lng: number | null, active: boolean }[] = [];
  displayModal: boolean = false;
  selectedDeliveryId: string = '';
  selectedDeliveryName: string = '';
  packageLat: number | null = null;
  packageLng: number | null = null;
  mainMap!: L.Map;
  selectionMap!: L.Map;
  deliveryMarkers: { [key: string]: L.Marker } = {};
  packageMarkers: { [key: string]: L.Marker } = {};
  selectionMarker: L.Marker | undefined;
  private packageInterval: any;

  @ViewChild('selectionMap') selectionMapElement!: ElementRef;

  constructor(private apiService: ApiService, private socketService: SocketService) {}

  ngOnInit() {
    this.loadPackages(); 
    this.startPackageUpdates();

    this.socketService.onDeliveryConnected().subscribe((data) => {
      console.log('Delivery connected:', data);
      this.handleDeliveryConnected(data);
    });

    this.socketService.onDeliveryDisconnected().subscribe((data) => {
      console.log('Delivery disconnected:', data);
      this.handleDeliveryDisconnected(data);
    });

    this.socketService.onLocationUpdate().subscribe((data) => {
      console.log('Location update:', data);
      this.handleLocationUpdate(data);
    });
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

  private handleDeliveryConnected(data: any) {
    const index = this.deliveries.findIndex(d => d.id === data.userId);
    if (index === -1) {
      this.deliveries.push({ 
        id: data.userId, 
        username: data.username, 
        lat: data.lat, 
        lng: data.lng, 
        active: true 
      });
      if (data.lat && data.lng) {
        this.addDeliveryMarker(data.userId, data.lat, data.lng, data.username);
      }
    } else {
      this.deliveries[index].lat = data.lat;
      this.deliveries[index].lng = data.lng;
      this.deliveries[index].active = true;
      this.updateDeliveryLocation(data.userId, data.lat, data.lng);
    }
  }

  private handleDeliveryDisconnected(data: any) {
    const index = this.deliveries.findIndex(d => d.id === data.userId);
    if (index !== -1) {
      this.deliveries.splice(index, 1);
      if (this.deliveryMarkers[data.userId]) {
        this.mainMap.removeLayer(this.deliveryMarkers[data.userId]);
        delete this.deliveryMarkers[data.userId];
      }
    }
  }

  private handleLocationUpdate(data: any) {
    const index = this.deliveries.findIndex(d => d.id === data.userId);
    if (index !== -1) {
      this.deliveries[index].lat = data.lat;
      this.deliveries[index].lng = data.lng;
      this.updateDeliveryLocation(data.userId, data.lat, data.lng);
    }
  }

  ngAfterViewInit() {
    this.initMainMap();
  }

  ngOnDestroy() {
    this.mainMap.remove();
    if (this.selectionMap) {
      this.selectionMap.remove();
    }
    this.stopPackageUpdates();
  }

  private initMainMap() {
    this.mainMap = L.map('main-map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.mainMap);
  }

  private initSelectionMap() {
    if (this.selectionMap) return;

    this.selectionMap = L.map('selection-map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.selectionMap);

    this.selectionMap.on('click', (e: L.LeafletMouseEvent) => {
      this.packageLat = e.latlng.lat;
      this.packageLng = e.latlng.lng;

      if (this.selectionMarker) {
        this.selectionMarker.setLatLng([this.packageLat, this.packageLng]);
      } else {
        this.selectionMarker = L.marker([this.packageLat, this.packageLng], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(this.selectionMap);
      }
    });
  }

  loadPackages() {
    this.apiService.getAdminPackages().subscribe((data) => {
      this.clearPackageMarkers();
      data.forEach((p: any) => {
        this.addPackageMarker(p.id, p.lat, p.lng, p.assigned_to_name);
      });
    });
  }

  private clearPackageMarkers() {
    Object.values(this.packageMarkers).forEach(marker => {
      this.mainMap.removeLayer(marker);
    });
    this.packageMarkers = {};
  }

  private addDeliveryMarker(id: string, lat: number, lng: number, username: string) {
    const marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(this.mainMap);
    
    marker.bindPopup(`<b>${username}</b><br>Delivery Person`);
    this.deliveryMarkers[id] = marker;
  }

  private addPackageMarker(id: string, lat: number, lng: number, assignedTo: string) {
    const marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(this.mainMap);
    
    marker.bindPopup(`<b>Package</b><br>Assigned to: ${assignedTo || 'Not assigned'}`);
    this.packageMarkers[id] = marker;
  }

  selectDelivery(deliveryId: string) {
    const delivery = this.deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;

    this.selectedDeliveryId = deliveryId;
    this.selectedDeliveryName = delivery.username;
    this.packageLat = null;
    this.packageLng = null;
    this.displayModal = true;

    setTimeout(() => {
      this.initSelectionMap();
    }, 100);
  }

  assignPackage() {
    if (!this.packageLat || !this.packageLng) {
      alert('Please select a location on the map first');
      return;
    }

    this.apiService.assignPackage(this.selectedDeliveryId, this.packageLat, this.packageLng).subscribe((p) => {
      this.addPackageMarker(p.id, p.lat, p.lng, p.assigned_to);
      this.displayModal = false;
      
      if (this.selectionMarker) {
        this.selectionMap.removeLayer(this.selectionMarker);
      }
      this.selectionMarker = undefined;
    });
  }

  cancelAssignment() {
    this.displayModal = false;
    
    if (this.selectionMarker) {
      this.selectionMap.removeLayer(this.selectionMarker);
    }
    this.selectionMarker = undefined;
  }

  updateDeliveryLocation(userId: string, lat: number, lng: number) {
    const index = this.deliveries.findIndex(d => d.id === userId);
    if (index !== -1) {
      this.deliveries[index].lat = lat;
      this.deliveries[index].lng = lng;
      
      if (this.deliveryMarkers[userId]) {
        this.deliveryMarkers[userId].setLatLng([lat, lng]);
      } else {
        this.addDeliveryMarker(userId, lat, lng, this.deliveries[index].username);
      }
    }
  }
}