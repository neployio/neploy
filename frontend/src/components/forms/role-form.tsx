import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "frontend/src/components/ui/form";
import { Input } from "frontend/src/components/ui/input";
import { Textarea } from "frontend/src/components/ui/textarea";
import { Autocomplete } from "frontend/src/components/forms";
import { ColorPicker } from "frontend/src/components/forms";
import { RoleIcon } from "frontend/src/components/icons";
import { icons } from "frontend/src/lib/icons";
import { roleSchema } from "frontend/src/lib/validations/role";
import { Button } from "frontend/src/components/ui/button";
import { DialogFooter } from "frontend/src/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface RoleFormProps {
  defaultValues?: z.infer<typeof roleSchema>;
  onSubmit: (data: z.infer<typeof roleSchema>) => void;
  onCancel?: () => void;
  renderFooter?: (form: UseFormReturn<z.infer<typeof roleSchema>>) => React.ReactNode;
}

export function RoleForm({ defaultValues, onSubmit, onCancel, renderFooter }: RoleFormProps) {
  const { t } = useTranslation();
  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      icon: "",
      color: "#000000",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("step.role.name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("step.role.description")}</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("step.role.icon")}</FormLabel>
              <FormControl>
                <div className="flex gap-2 items-center">
                  <div className="flex-grow">
                    <Controller
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <Autocomplete
                          field={field}
                          options={icons.map((icon) => ({
                            value: icon,
                            label: icon,
                            icon: <RoleIcon icon={icon} color={form.getValues("color") || "#000000"} size={24} />,
                          }))}
                          placeholder={t("step.role.placeholder")}
                        />
                      )}
                    />
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("step.role.color")}</FormLabel>
              <FormControl>
                <Controller control={form.control} name="color" render={({ field }) => <ColorPicker field={field} />} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-start flex-col space-y-2">
          <h2 className="font-semibold text-lg">{t("step.role.icon preview")}</h2>
          <RoleIcon icon={form.watch("icon")} color={form.watch("color")} />
        </div>
        {renderFooter ? (
          renderFooter(form)
        ) : (
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onCancel}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit">{t("actions.save")}</Button>
          </DialogFooter>
        )}
      </form>
    </Form>
  );
}
