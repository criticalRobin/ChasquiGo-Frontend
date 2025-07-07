import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize } from 'rxjs';
import { LoadingService } from '@shared/services/loading.service';
import { LoginService } from '@core/login/services/login.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';

let totalRequests: number = 0;

export const httpRequestInterceptor: HttpInterceptorFn = (req, next) => {
  const loginSrv: LoginService = inject(LoginService);
  const loadingSrv: LoadingService = inject(LoadingService);
  const alertSrv: AlertService = inject(AlertService);
  const token = loginSrv.getTokenFromLocalStorage();

  totalRequests++;
  loadingSrv.setLoading(true);

  const modifiedReq = token
    ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      })
    : req;

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        alertSrv.showAlert({
          alertType: AlertType.ERROR,
          mainMessage:
            'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        });

        loginSrv.logout();
      }

      throw error;
    }),
    finalize(() => {
      totalRequests--;

      if (totalRequests === 0) loadingSrv.setLoading(false);
    })
  );
};
