export interface IDriverRequest {
  idNumber: string;
  documentType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  cooperativeId: number;
}
