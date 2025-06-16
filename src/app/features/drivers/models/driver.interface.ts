import { IBaseUser } from '@shared/models/base-user.interface';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { IRole } from '@shared/models/role.interface';

export interface IDriver {
  id: number;
  idNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  cooperative: {
    id: number;
    name: string;
  };
}
