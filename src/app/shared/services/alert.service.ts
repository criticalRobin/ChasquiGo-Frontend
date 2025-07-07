import { Injectable } from '@angular/core';
import { IAlert } from '@shared/models/alert.interface';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private alertSubject: Subject<IAlert> = new Subject<IAlert>();
  public alert$: Observable<IAlert> = this.alertSubject.asObservable();

  public showAlert(alert: IAlert): void {
    console.log('showAlert', alert);
    this.alertSubject.next(alert);
  }
}
