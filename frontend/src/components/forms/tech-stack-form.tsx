import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "frontend/src/components/ui/form";
import { Input } from "frontend/src/components/ui/input";
import { Autocomplete } from "frontend/src/components/forms";
import { techIcons } from "frontend/src/lib/icons";
import { Button } from "frontend/src/components/ui/button";
import { DialogFooter } from "frontend/src/components/ui/dialog";
import { useTranslation } from "react-i18next";

const techStackSchema = z.object({
  name: z.string().min(2).max(64),
  description: z.string().min(2).max(128),
});

interface TechStackFormProps {
  defaultValues?: z.infer<typeof techStackSchema>;
  onSubmit: (data: z.infer<typeof techStackSchema>) => void;
  onCancel?: () => void;
  renderFooter?: (form: UseFormReturn<z.infer<typeof techStackSchema>>) => React.ReactNode;
}

export function TechStackForm({ defaultValues, onSubmit, onCancel, renderFooter }: TechStackFormProps) {
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof techStackSchema>>({
    resolver: zodResolver(techStackSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
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
              <FormLabel>{t("dashboard.settings.techStack.name")}</FormLabel>
              <FormControl>
                <Autocomplete
                  field={field}
                  options={techIcons.map((icon) => ({
                    label: icon.name,
                    value: icon.name,
                  }))}
                  placeholder={t("dashboard.settings.techStack.name")}
                />
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
              <FormLabel>{t("dashboard.settings.techStack.description")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("dashboard.settings.techStack.description")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {renderFooter ? (
          renderFooter(form)
        ) : (
          <DialogFooter>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t("common.cancel")}
              </Button>
            )}
            <Button type="submit">{t("common.save")}</Button>
          </DialogFooter>
        )}
      </form>
    </Form>
  );
}
