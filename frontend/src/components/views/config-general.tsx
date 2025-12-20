import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "frontend/src/components/ui/card";
import { Input } from "frontend/src/components/ui/input";
import { GeneralSettingsProps } from "frontend/src/types/props";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "frontend/src/components/ui/select";
import { Button } from "frontend/src/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { useUpdateMetadataMutation } from "frontend/src/services/api/metadata";
import { useToast } from "frontend/src/hooks";

const formSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  logoUrl: z.string().url("Must be a valid URL"),
  language: z.enum(["en", "es", "fr", "pt", "zh"]),
});

type FormValues = z.infer<typeof formSchema>;

const GeneralTab: React.FC<GeneralSettingsProps> = ({ teamName: originalTeamName, logoUrl: originalLogoUrl, language: originalLanguage }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [updateMetadata] = useUpdateMetadataMutation();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: originalTeamName,
      logoUrl: originalLogoUrl,
      language: originalLanguage as "en" | "es" | "fr" | "pt" | "zh",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await updateMetadata({
        data: {
          teamName: values.teamName,
          logoUrl: values.logoUrl,
          language: values.language,
        },
      }).unwrap();

      // Show success toast or notification
      toast({
        title: t("common.success"),
        description: t("dashboard.settings.general.updateSuccess"),
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Show error toast or notification
      toast({
        title: t("common.error"),
        description: t("dashboard.settings.general.updateError"),
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader className="p-2 sm:p-4">
        <CardTitle>{t("dashboard.settings.general.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-2 sm:p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t("dashboard.settings.general.teamName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("dashboard.settings.general.teamNamePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t("dashboard.settings.general.logoUrl")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("dashboard.settings.general.logoUrlPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t("dashboard.settings.general.language")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("dashboard.settings.general.languagePlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">{t("languages.en")}</SelectItem>
                        <SelectItem value="es">{t("languages.es")}</SelectItem>
                        <SelectItem value="fr">{t("languages.fr")}</SelectItem>
                        <SelectItem value="pt">{t("languages.pt")}</SelectItem>
                        <SelectItem value="zh">{t("languages.zh")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-x-4">
              <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={!form.formState.isDirty || form.formState.isSubmitting} className="w-full sm:w-auto">
                {form.formState.isSubmitting ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default GeneralTab;
