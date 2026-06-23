export type Role = 'admin' | 'user';

export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaginatedPatients = {
  data: Patient[];
  page: number;
  limit: number;
  total: number;
};

export type AuthUser = {
  email: string;
  role: Role;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};
