import { IBaseUser } from '@shared/models/base-user.interface';

export interface ILoginResponse {
  accessToken: string;
  user: IBaseUser;
}
