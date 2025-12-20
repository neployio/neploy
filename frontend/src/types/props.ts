import { LucideIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { ControllerRenderProps } from "react-hook-form";
import { ApplicationDockered, Gateway, GatewayConfig, RoleWithUsers, TeamMember, TechStackWithApplications, Trace, User } from "./common";

interface CommonProps {
  user: {
    name: string;
    email: string;
    username: string;
    provider: string;
    roles: string[];
  };
  teamName: string;
  logoUrl: string;
}

export interface AcceptInviteProps {
  token: string;
  expired?: boolean;
  alreadyAccepted?: boolean;
  provider?: string;
}

export interface CompleteInviteProps {
  token: string;
  email?: string;
  username?: string;
  provider?: string;
  error?: string;
  status?: "valid" | "expired" | "accepted" | "invalid";
}

export interface SummaryStepProps {
  data: User;
  onBack: () => void;
  onSubmit: () => void;
}

export interface RequestData {
  name: string;
  successful: number;
  errors: number;
}

export interface StackData {
  name: string;
  value: number;
}

export interface VisitorData {
  name: string;
  value: number;
}

export interface DashboardProps extends CommonProps {
  requests?: RequestData[];
  techStack?: StackData[];
  visitors?: VisitorData[];
  traces?: Trace[];
  health?: string;
}

export interface TeamProps extends CommonProps {
  team?: TeamMember[];
  roles?: Array<{
    name: string;
    description: string;
    icon: string;
    color: string;
  }>;
}

export interface GatewayProps extends CommonProps {
  gateways: Gateway[];
  config?: GatewayConfig;
}

export interface GatewayTableProps {
  gateways: Gateway[];
}

export interface Option {
  value: string;
  label: string;
  icon?: React.ReactElement;
}

export interface AutoCompleteProps {
  options: Option[];
  emptyMessage: string;
  value?: Option;
  onValueChange?: (value: Option) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  field?: ControllerRenderProps<any>;
}

export interface DatePickerProps {
  className?: string;
  date?: Date | DateRange | undefined;
  onDateChange?: (date: Date | DateRange | undefined) => void;
  isRangePicker?: boolean;
  minYear?: number;
  maxYear?: number;
  field?: ControllerRenderProps<any, any>;
}

export interface SettingsProps extends CommonProps {
  language: string;
  roles: RoleWithUsers[];
  techStacks: TechStackWithApplications[];
  traces: Trace[];
}

export interface GeneralSettingsProps {
  teamName: string;
  logoUrl: string;
  language: string;
}

export interface RolesSettingsProps {
  roles: RoleWithUsers[];
}

export interface TechStacksSettingsProps {
  techStacks: TechStackWithApplications[];
}

export interface TracesSettingsProps {
  traces: Trace[];
}

export interface DialogButtonProps {
  buttonText: string;
  title?: string;
  description?: string;
  onOpen?: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  icon?: LucideIcon;
  className?: string;
  variant?: "tooltip" | "text";
  children?: React.ReactNode;
}

export interface GatewayConfigProps {
  config?: GatewayConfig;
}

export interface ApplicationProps extends CommonProps {
  application: ApplicationDockered;
}
