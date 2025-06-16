import { AlertType } from '@utils/enums/alert-type.enum';

export interface IAlert {
  alertType: AlertType;
  mainMessage: string;
  subMessage?: string;
  showConfirmButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm?: () => void;
}
