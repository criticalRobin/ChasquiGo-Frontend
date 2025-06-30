export interface IClerkResponse {
  workers: IClerk[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IClerk {
  id: number;
  idNumber: string;
  documentType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  cooperative: {
    id: number;
    name: string;
  };
  createdAt: string;
}
