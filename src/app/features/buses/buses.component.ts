import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBusesComponent } from './components/form-buses/form-buses.component';
import { BusesThreeComponent } from './components/buses-three/buses-three.component';
import { IBuses } from './models/buses.interface';

@Component({
  selector: 'app-buses',
  standalone: true,
  imports: [RouterLink, FormBusesComponent, BusesThreeComponent],
  templateUrl: './buses.component.html',
  styleUrl: './buses.component.css'
})
export class BusesComponent implements OnInit {
  currentBus: IBuses;

  ngOnInit(): void {
    // Create a default bus for testing
    this.currentBus = {
      cooperativeId: 1,
      licensePlate: 'ABC-1234',
      chassisBrand: 'Mercedes-Benz',
      bodyworkBrand: 'Marcopolo',
      photos: [
        'https://example.com/bus1.jpg'
      ],
      capacity: 40,
      stoppageDays: 1,
      floorCount: 1,
      seats: []
    };
  }
}
