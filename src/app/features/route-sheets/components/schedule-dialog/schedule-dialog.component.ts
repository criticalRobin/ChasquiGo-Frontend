import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ScheduleRequest } from '../../models/route-sheet.interface';

@Component({
  selector: 'app-schedule-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-dialog.component.html',
  styleUrls: ['./schedule-dialog.component.css']
})
export class ScheduleDialogComponent {
  @Input() visible = false;
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() submit = new EventEmitter<ScheduleRequest>();

  request: {
    routeSheetHeaderId: number;
    startDate: string;
    endDate: string;
  } = {
    routeSheetHeaderId: 0,
    startDate: this.formatDate(new Date()),
    endDate: this.formatDate(new Date(new Date().setDate(new Date().getDate() + 7)), true)
  };

  minDate: string;
  maxDate: string;

  constructor() {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() + 1);
    this.maxDate = maxDate.toISOString().split('T')[0];
  }

  @Input() set routeSheetId(id: number) {
    this.request.routeSheetHeaderId = id;
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onSubmit(): void {
    const request: ScheduleRequest = {
      routeSheetHeaderId: this.request.routeSheetHeaderId,
      startDate: this.formatDate(new Date(this.request.startDate)),
      endDate: this.formatDate(new Date(this.request.endDate), true)
    };
    this.submit.emit(request);
  }

  private formatDate(date: Date, endOfDay = false): string {
    const d = new Date(date);
    if (endOfDay) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return d.toISOString();
  }

}
