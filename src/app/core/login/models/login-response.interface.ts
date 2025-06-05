import { IBaseUser } from '@shared/models/base-user.interface';

export interface ILoginResponse {
  access_token: string;
  user: IBaseUser;
}
