import * as React from "react";
import { Input, InputProps } from "./input";

export interface PasswordInputProps extends Omit<InputProps, "type"> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={className + " pr-10"}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
          tabIndex={-1}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
