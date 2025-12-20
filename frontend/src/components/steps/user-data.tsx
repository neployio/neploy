import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "frontend/src/components/ui/card";
import { Button } from "frontend/src/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "frontend/src/components/ui/form";
import { Input } from "frontend/src/components/ui/input";
import { PasswordInput } from "frontend/src/components/ui/password-input";
import { DatePicker } from "frontend/src/components/forms/date-picker";
import { withMask } from "use-mask-input";
import { User } from "frontend/src/types/common";
import { useTranslation } from "react-i18next";

const formSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  dob: z.date(),
  phone: z.string().min(10),
  address: z.string().min(5),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

interface Props {
  email?: string;
  username?: string;
  onNext: (data: User) => void;
  onBack: () => void;
}

export function UserDataStep({ email, username, onNext, onBack }: Props) {
  const { t } = useTranslation();
  const form = useForm<User>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: email || "",
      username: username || "",
    },
  });

  return (
    <Card className="w-full max-w-screen-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onNext)}>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>Tell us more about yourself</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("step.user.firstName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("step.user.lastName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("step.user.dob")}</FormLabel>
                    <FormControl>
                      <DatePicker field={field} maxYear={new Date().getFullYear() - 18} minYear={new Date().getFullYear() - 90} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("step.user.phone")}</FormLabel>
                    <FormControl>
                      <Input {...field} ref={withMask("(9999) 999-99-99")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("step.user.address")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("step.user.email")}</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly={!!email} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("step.user.username")}</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly={!!username} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("step.user.password")}</FormLabel>
                  <FormControl>
                    <PasswordInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
