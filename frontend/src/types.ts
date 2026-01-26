export type Role = "PROFESSOR" | "STUDENT" | "SECRETARIAT";

export interface User {
  id: number;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  username: string;
  professor?: {
    id: number;
    userId: number;
  };
  student?: {
    id: number;
    userId: number;
    am: string;
    address?: string;
    cellPhoneNumber?: string;
    phoneNumber?: string;
  };
}
