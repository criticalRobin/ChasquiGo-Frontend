import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IDriver } from '../../models/driver.interface';

@Component({
  selector: 'app-driver-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './driver-card.component.html',
  styleUrl: './driver-card.component.css'
})
export class DriverCardComponent {
  @Input() driver!: IDriver;
}
