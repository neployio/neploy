"use client";

import { addDays, format, lastDayOfYear } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useFormContext } from "react-hook-form";
import { Button } from "frontend/src/components/ui/button";
import { Calendar } from "frontend/src/components/ui/calendar";
import { FormControl } from "frontend/src/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "frontend/src/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "frontend/src/components/ui/select";
import { cn } from "frontend/src/lib/utils";
import { DatePickerProps } from "frontend/src/types/props";
import { forwardRef, useEffect, useState } from "react";

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(({ className, date, onDateChange, isRangePicker = false, minYear = 1900, maxYear = 2100, field }, ref) => {
  const formContext = useFormContext();
  const isFormContext = !!formContext && !!field;

  const [selectedDate, setSelectedDate] = useState<Date | DateRange | undefined>(isFormContext ? field.value : date);
  const [isRange, setIsRange] = useState<boolean>(isRangePicker);
  const [month, setMonth] = useState<Date>(() => {
    if (maxYear) {
      return lastDayOfYear(new Date(maxYear, 0, 1));
    }
    return selectedDate instanceof Date ? selectedDate : selectedDate && "from" in selectedDate ? selectedDate.from : new Date();
  });

  useEffect(() => {
    const currentValue = isFormContext ? field?.value : selectedDate;

    if (currentValue instanceof Date) {
      setMonth(currentValue);
    } else if (currentValue && typeof currentValue === "object" && "from" in currentValue && currentValue.from instanceof Date) {
      setMonth(currentValue.from);
    } else {
      setMonth(new Date()); // fallback para asegurar consistencia
    }

    setSelectedDate(currentValue);
  }, [isFormContext, field?.value, selectedDate]);

  useEffect(() => {
    setIsRange(isRangePicker);
  }, [isRangePicker]);

  const handleDateSelect = (newDate: Date | DateRange | undefined) => {
    setSelectedDate(newDate);
    if (newDate instanceof Date) {
      setMonth(newDate);
    } else if (newDate && "from" in newDate && newDate.from instanceof Date) {
      setMonth(newDate.from);
    }

    if (isFormContext) {
      field.onChange(newDate);
    } else {
      onDateChange?.(newDate);
    }
  };

  const formatDate = (date: Date | DateRange | undefined) => {
    if (!date) return "Pick a date";
    
    if (date instanceof Date) {
      // Check if date is valid before formatting
      return !isNaN(date.getTime()) ? format(date, "yyyy-MM-dd") : "Invalid date";
    }
    
    if (date.from) {
      const fromValid = date.from instanceof Date && !isNaN(date.from.getTime());
      const toValid = date.to instanceof Date && !isNaN(date.to.getTime());
      
      if (date.to) {
        if (fromValid && toValid) {
          return `${format(date.from, "yyyy-MM-dd")} - ${format(date.to, "yyyy-MM-dd")}`;
        } else if (fromValid) {
          return `${format(date.from, "yyyy-MM-dd")} - Invalid date`;
        } else if (toValid) {
          return `Invalid date - ${format(date.to, "yyyy-MM-dd")}`;
        } else {
          return "Invalid date range";
        }
      }
      
      return fromValid ? `${format(date.from, "yyyy-MM-dd")} - ` : "Invalid date - ";
    }
    
    return "Pick a date range";
  };

  const buttonProps = isFormContext ? field : {};

  return (
    <div ref={ref} className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          {isFormContext ? (
            <FormControl>
              <Button id={field.name} variant={"outline"} className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")} {...buttonProps}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDate(selectedDate)}
              </Button>
            </FormControl>
          ) : (
            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")} {...buttonProps}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDate(selectedDate)}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="min-w-[320px] p-3">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Select
                value={month instanceof Date && !isNaN(month.getTime()) ? format(month, "MMMM") : ""}
                onValueChange={(value) => {
                  if (month instanceof Date && !isNaN(month.getTime())) {
                    setMonth(new Date(month.getFullYear(), parseInt(value), 1));
                  }
                }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue>{month instanceof Date && !isNaN(month.getTime()) ? format(month, "MMMM") : ""}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {format(new Date(0, i), "MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={month?.getFullYear().toString() ?? new Date(maxYear).getFullYear().toString()}
                onValueChange={(value) => {
                  if (month instanceof Date && !isNaN(month.getTime())) {
                    setMonth(new Date(parseInt(value), month.getMonth(), 1));
                  }
                }}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue>{month?.getFullYear().toString() ?? new Date(maxYear, 1, 1).getFullYear().toString()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
                    const year = maxYear - i;
                    return (
                      <SelectItem key={i} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          {isRange ? (
            <Calendar
              mode="range"
              selected={selectedDate as DateRange}
              onSelect={handleDateSelect}
              month={month}
              onMonthChange={setMonth}
              numberOfMonths={1}
              fromYear={minYear}
              toYear={maxYear}
              className="px-3 pb-3"
              classNames={{
                months: "space-y-4",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-accent rounded-md transition-colors",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex justify-center w-full",
                head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                row: "flex w-full justify-center mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          ) : (
            <Calendar
              mode="single"
              selected={selectedDate as Date}
              onSelect={handleDateSelect}
              month={month}
              onMonthChange={setMonth}
              numberOfMonths={1}
              fromYear={minYear}
              toYear={maxYear}
              className="px-3 pb-3"
              classNames={{
                months: "space-y-4",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-accent rounded-md transition-colors",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex justify-center w-full",
                head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                row: "flex w-full justify-center mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          )}
          {maxYear > new Date().getFullYear() && (
            <div className="flex items-center justify-between p-3 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => handleDateSelect(new Date())}>
                Today
              </Button>
              {isRange && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDateSelect({
                        from: new Date(),
                        to: addDays(new Date(), 7),
                      })
                    }>
                    7 days
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDateSelect({
                        from: new Date(),
                        to: addDays(new Date(), 30),
                      })
                    }>
                    30 days
                  </Button>
                </div>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
});

DatePicker.displayName = "DatePicker";
