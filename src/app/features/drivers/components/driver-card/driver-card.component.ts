import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  @Output() editDriver = new EventEmitter<IDriver>();
  @Output() deleteDriver = new EventEmitter<IDriver>();

  constructor(private router: Router) {}

  onEditDriver(): void {
    this.router.navigate(['/drivers/edit', this.driver.id]);
  }

  onDeleteDriver(): void {
    this.deleteDriver.emit(this.driver);
  }
}
