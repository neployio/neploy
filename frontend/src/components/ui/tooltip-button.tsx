import { Button } from "frontend/src/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "frontend/src/components/ui/tooltip";
import { ButtonProps } from "./button";
import { LucideIcon } from "lucide-react";
import React from "react";
export interface TooltipButtonProps extends ButtonProps {
  tooltip: string;
  icon: LucideIcon;
  iconSize?: number;
}

export const TooltipButton = React.forwardRef<HTMLButtonElement, TooltipButtonProps>(({ tooltip, icon: Icon, iconSize = 4, ...props }, ref) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button {...props}>
            <Icon className={`h-${iconSize} w-${iconSize}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

TooltipButton.displayName = "TooltipButton";
