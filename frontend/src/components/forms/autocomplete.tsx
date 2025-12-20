import { ControllerRenderProps } from "react-hook-form";
import { CommandGroup, CommandInput, CommandItem, CommandList, Command } from "../ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { Check } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { cn } from "frontend/src/lib/utils";
import { Option } from "frontend/src/types/props";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

export interface AutocompleteProps {
  options: Option[];
  placeholder?: string;
  emptyMessage?: string;
  value?: Option;
  onValueChange?: (option: Option) => void;
  disabled?: boolean;
  isLoading?: boolean;
  field?: ControllerRenderProps<any>;
  className?: string;
}

export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(
  ({ options, placeholder, emptyMessage = "No results.", value, onValueChange, disabled, isLoading = false, field, className }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState<string>("");
    const [selected, setSelected] = useState<Option | undefined>(() => {
      if (field?.value) {
        return options.find((opt) => opt.value === field.value);
      }
      return value;
    });

    useEffect(() => {
      if (selected) {
        setInputValue(selected.label);
      }
    }, [selected]);

    useEffect(() => {
      if (field?.value) {
        const fieldOption = options.find((opt) => opt.value === field.value);
        if (fieldOption && (!selected || selected.value !== fieldOption.value)) {
          setSelected(fieldOption);
          setInputValue(fieldOption.label);
        }
      }
    }, [field?.value, options]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        const input = inputRef.current;
        if (!input) return;

        if (!isOpen) {
          setOpen(true);
        }

        if (event.key === "Enter" && input.value !== "") {
          const optionToSelect = options.find((option) => option.label.toLowerCase() === input.value.toLowerCase());
          if (optionToSelect) {
            handleSelectOption(optionToSelect);
          }
        }

        if (event.key === "Escape") {
          input.blur();
        }
      },
      [isOpen, options],
    );

    const handleBlur = useCallback(() => {
      setOpen(false);
      if (selected) {
        setInputValue(selected.label);
      } else {
        setInputValue("");
      }
    }, [selected]);

    const handleSelectOption = useCallback(
      (selectedOption: Option) => {
        setSelected(selectedOption);
        setInputValue(selectedOption.label);

        if (field) {
          field.onChange(selectedOption.value);
        }

        if (onValueChange) {
          onValueChange(selectedOption);
        }

        setTimeout(() => {
          inputRef?.current?.blur();
        }, 0);
      },
      [field, onValueChange],
    );

    return (
      <div className="relative w-full">
        <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
          <CommandInput
            ref={ref || inputRef}
            value={inputValue}
            onValueChange={isLoading ? undefined : setInputValue}
            onBlur={handleBlur}
            onFocus={() => {
              if (inputValue !== "") {
                setOpen(true);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
          />
          <div className={cn("absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95", isOpen ? "block" : "hidden")}>
            <CommandList className="max-h-[200px] overflow-y-auto">
              {isLoading ? (
                <CommandPrimitive.Loading>
                  <div className="p-1">
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CommandPrimitive.Loading>
              ) : null}
              {options.length > 0 && !isLoading ? (
                <CommandGroup>
                  {options.map((option) => {
                    const isSelected = selected?.value === option.value;
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onSelect={() => handleSelectOption(option)}
                        className={cn(
                          "flex w-full items-center gap-2 px-2 py-1.5 text-sm outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-accent text-accent-foreground",
                        )}>
                        {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                        <span className="truncate">{option.label}</span>
                        {isSelected && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : null}
              {!isLoading && options.length === 0 ? <CommandPrimitive.Empty className="py-6 text-center text-sm">{emptyMessage}</CommandPrimitive.Empty> : null}
            </CommandList>
          </div>
        </Command>
      </div>
    );
  },
);

Autocomplete.displayName = "Autocomplete";
