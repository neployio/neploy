export type RoleWithUsers = Roles & { users: User[] };
export type TechStackWithApplications = TechStack & {
  applications: Application[];
};

export interface User {
  firstName?: string;
  lastName?: string;
  dob?: string;
  phone?: string;
  address?: string;
  email?: string;
  username?: string;
  avatar?: string;
  provider?: string;
  password?: string;
}

export interface ApplicationStat {
  id: string;
  applicationId: string;
  environmentId: string;
  date: string;
  requests: number;
  errors: number;
  averageResponseTime: number;
  dataTransfered: number;
  uniqueVisitors: number;
  healthy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TechStack {
  id?: string;
  name: string;
  description: string;
}

export interface Application {
  id: string;
  appName: string;
  storageLocation: string;
  deployLocation: string;
  techStackId: string;
  description?: string;
  status: "Building" | "Running" | "Stopped" | "Error" | "Created";
  language?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  stats: ApplicationStat[];
  techStack: TechStack;
}

export interface Roles {
  id?: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface TeamMember {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  provider: string;
  phone: string;
  roles: Roles[];
  techStacks: TechStack[];
}

export interface Gateway {
  id: string;
  name: string;
  path: string;
  httpMethod: string;
  backendUrl: string;
  requiresAuth: boolean;
  rateLimit: number;
  applicationId: string;
  application: Application;
}

export interface GatewayConfig {
  id: string;
  defaultVersioningType: "header" | "uri";
  defaultVersion: "latest" | "stable";
  loadBalancer: boolean;
}

export interface ApplicationVersion {
  id: string;
  versionTag: string;
  description: string;
  status: string;
  storageLocation: string;
  applicationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDockered extends Application {
  cpuUsage: number;
  memoryUsage: number;
  uptime: string;
  requestsPerMin: number;
  logs: string[];
  versions: ApplicationVersion[];
}

export interface Trace {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: any;
  userId: string;
  type: string;
  action: string;
  actionTimestamp: string;
  sqlStatement: string;
  email: string;
}
