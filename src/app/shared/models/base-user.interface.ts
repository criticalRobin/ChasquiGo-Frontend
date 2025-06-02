import { IRole } from './role.interface';

export interface IBaseUser {
  id: number;
  idNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: IRole;
  cooperative: null | any;
}
