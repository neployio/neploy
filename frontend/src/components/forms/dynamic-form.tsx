import * as React from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "frontend/src/components/ui/form";
import { Input } from "frontend/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "frontend/src/components/ui/select";
import { Button } from "frontend/src/components/ui/button";
import { Checkbox } from "frontend/src/components/ui/checkbox";
import type { Input as InputInterface } from "frontend/src/types/websocket";

interface FormInput extends InputInterface {
  label?: string;
}

interface DynamicFormProps {
  fields: FormInput[];
  onSubmit: (data: any) => void;
  submitText?: string;
  className?: string;
}

export function DynamicForm({ fields = [], onSubmit, submitText = "Submit", className = "" }: DynamicFormProps) {
  // Initialize form with empty object if no fields
  const form = useForm({
    defaultValues: Array.isArray(fields)
      ? fields.reduce((acc: any, field) => {
          acc[field.name] = field.value || (field.type === "checkbox" ? false : "");
          return acc;
        }, {})
      : {},
  });

  // Sort fields by order if specified
  const sortedFields = Array.isArray(fields) ? [...fields].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];

  if (!Array.isArray(fields) || fields.length === 0) {
    return null;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        {sortedFields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem className="mb-4">
                {field.label && <FormLabel className="capitalize">{field.label}</FormLabel>}
                <FormControl>
                  {field.type === "select" && field.options ? (
                    <Select onValueChange={formField.onChange} defaultValue={formField.value} disabled={field.disabled}>
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "checkbox" ? (
                    <Checkbox checked={formField.value} onCheckedChange={formField.onChange} disabled={field.disabled} />
                  ) : field.type === "password" ? (
                    <Input {...formField} type="password" placeholder={field.placeholder} disabled={field.disabled} readOnly={field.readOnly} />
                  ) : (
                    <Input {...formField} type="text" placeholder={field.placeholder} disabled={field.disabled} readOnly={field.readOnly} />
                  )}
                </FormControl>
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" className="w-full">
          {submitText}
        </Button>
      </form>
    </Form>
  );
}
