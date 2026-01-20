export type Role = "PROFESSOR" | "STUDENT" | "SECRETARIAT";

export interface User {
  id: number;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  username: string;
}
