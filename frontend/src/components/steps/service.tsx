import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "frontend/src/components/ui/card";
import { Button } from "frontend/src/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "frontend/src/components/ui/form";
import { Input } from "frontend/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "frontend/src/components/ui/select";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../../i18n";

const serviceSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  logo: z.string().min(1, "Logo URL is required"),
  language: z.string(),
});

interface Props {
  onNext: (data: z.infer<typeof serviceSchema>) => void;
  onBack: () => void;
  initialData?: z.infer<typeof serviceSchema>;
}

export function ServiceStep({ onNext, onBack, initialData }: Props) {
  const { t, i18n } = useTranslation();
  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      teamName: initialData?.teamName || "",
      logo: initialData?.logo || "",
      language: initialData?.language || i18n.language,
    },
  });

  const handleNext = form.handleSubmit((data) => {
    onNext(data);
  });

  const handleLanguageChange = (value: string) => {
    form.setValue("language", value);
    i18n.changeLanguage(value);
  };

  return (
    <Card className="w-full max-w-screen-md mx-auto">
      <CardHeader>
        <CardTitle>{t("onboarding.teamSetup.title")}</CardTitle>
        <CardDescription>{t("onboarding.teamSetup.description")}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={handleNext}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("onboarding.teamSetup.teamName")}</FormLabel>
                  <FormControl>
                    <Controller control={form.control} name="teamName" render={({ field }) => <Input {...field} />} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Controller control={form.control} name="logo" render={({ field }) => <Input {...field} />} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("onboarding.teamSetup.language.label")}</label>
              <Select value={form.watch("language")} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("onboarding.teamSetup.language.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack}>
              {t("actions.back")}
            </Button>
            <Button type="submit">{t("actions.next")}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
