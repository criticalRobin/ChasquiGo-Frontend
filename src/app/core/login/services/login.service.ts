import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { ILoginRequest } from '../models/login-request.interface';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ILoginResponse } from '../models/login-response.interface';
import { IBaseUser } from '@shared/models/base-user.interface';
import { Router } from '@angular/router';
import { ICooperative } from '@features/coops/models/cooperative.interface';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private baseUrl: string = environment.API_URL;
  private readonly http: HttpClient = inject(HttpClient);
  private readonly router: Router = inject(Router);

  private loggedInUserSubject: BehaviorSubject<IBaseUser | null> =
    new BehaviorSubject<IBaseUser | null>(this.getLoggedUserFromLocalStorage());
  public loggedInUser$: Observable<IBaseUser | null> =
    this.loggedInUserSubject.asObservable();

  private cooperativeSubject: BehaviorSubject<ICooperative | null> =
    new BehaviorSubject<ICooperative | null>(this.getCooperativeFromLocalStorage());
  public cooperative$: Observable<ICooperative | null> =
    this.cooperativeSubject.asObservable();

  signIn(userCredentials: ILoginRequest): Observable<ILoginResponse> {
    const signInUrl: string = `${this.baseUrl}/auth/login`;
    return this.http.post<ILoginResponse>(signInUrl, userCredentials);
  }

  saveTokenInLocalStorage(token: string): void {
    console.log('Saving token in localStorage:', token);
    localStorage.setItem('token', token);
  }

  getTokenFromLocalStorage(): string {
    return localStorage.getItem('token') || '';
  }

  saveLoggedUserInLocalStorage(loginResponse: ILoginResponse): void {
    localStorage.setItem('loggedUser', JSON.stringify(loginResponse.user));
    this.loggedInUserSubject.next(loginResponse.user);
    
    // Si el usuario tiene un ID, obtener la información de su cooperativa
    if (loginResponse.user?.id) {
      this.fetchUserCooperative(loginResponse.user.id).subscribe();
    }
  }

  getLoggedUserFromLocalStorage(): IBaseUser | null {
    const user: IBaseUser | null = JSON.parse(
      localStorage.getItem('loggedUser') || '{}'
    );

    return user?.id ? user : null;
  }

  updateLoggedUser(user: IBaseUser | null): void {
    this.loggedInUserSubject.next(user);
  }

  saveCooperativeInLocalStorage(cooperative: ICooperative): void {
    localStorage.setItem('userCooperative', JSON.stringify(cooperative));
    this.cooperativeSubject.next(cooperative);
  }

  getCooperativeFromLocalStorage(): ICooperative | null {
    const cooperative: ICooperative | null = JSON.parse(
      localStorage.getItem('userCooperative') || '{}'
    );

    return cooperative?.id ? cooperative : null;
  }

  fetchUserCooperative(userId: number): Observable<ICooperative> {
    const url = `${this.baseUrl}/users/cooperative/${userId}`;
    return this.http.get<ICooperative>(url).pipe(
      tap((cooperative: ICooperative) => {
        this.saveCooperativeInLocalStorage(cooperative);
      })
    );
  }

  logout(): void {
    this.router.navigate(['/']);
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('token');
    localStorage.removeItem('userCooperative');
    this.loggedInUserSubject.next(null);
    this.cooperativeSubject.next(null);
  }
}
