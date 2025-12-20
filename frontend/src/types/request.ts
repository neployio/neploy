export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  dob: Date;
  address: string;
  phone: string;
  roles?: string[];
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface OnboardRequest {
  adminUser: CreateUserRequest;
  roles: CreateRoleRequest[];
  metadata: MetadataRequest;
}

export interface MetadataRequest {
  teamName: string;
  logoUrl?: string;
  language: string;
}

export interface CompleteInviteRequest {
  token: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  email: string;
  username: string;
}

export interface UpdateRoleRequest {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface GatewayConfigRequest {
  defaultVersioning: string;
}
