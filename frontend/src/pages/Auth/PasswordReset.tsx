"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";

import { Button } from "frontend/src/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "frontend/src/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "frontend/src/components/ui/form";
import { Input } from "frontend/src/components/ui/input";
import { useUpdatePasswordMutation } from "frontend/src/services/api/users";
import { AlertCircle, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { useTheme } from "frontend/src/hooks";

const passwordFormSchema = z
  .object({
    newPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function PasswordUpdateForm() {
  const { theme, isDark, applyTheme } = useTheme(); // <- aquí usamos applyTheme directamente

  useEffect(() => {
    applyTheme(theme, isDark);
  }, [theme, isDark]);

  const [updateStatus, setUpdateStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [updatePassword, { isLoading }] = useUpdatePasswordMutation();

  async function onPasswordSubmit(data: PasswordFormValues) {
    try {
      await updatePassword({ ...data, reset: true });
      setUpdateStatus({
        success: true,
        message: "Password updated successfully!",
      });
      passwordForm.reset();
      setTimeout(() => {
        setUpdateStatus(null);
        window.location.replace("/");
      }, 2000);
    } catch (error) {
      setUpdateStatus({
        success: false,
        message: error instanceof Error ? error.message : "Failed to update password",
      });
    }
  }

  return (
    <div className="w-full h-dvh grid place-content-center">
      <Card className="border-primary/10 shadow-lg overflow-hidden">
        <div className="bg-primary/5 p-4 flex items-center gap-3 border-b border-primary/10">
          <div className="bg-primary/10 p-2 rounded-full">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Security & Password</CardTitle>
            <CardDescription>Update your password and security settings</CardDescription>
          </div>
        </div>

        <CardContent className="pt-6 pb-2 px-6">
          {updateStatus && (
            <div
              className={`mb-6 p-4 rounded-md flex items-center gap-3 ${
                updateStatus.success ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}>
              {updateStatus.success ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
              <p className="text-sm font-medium">{updateStatus.message}</p>
            </div>
          )}

          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
              <div className="space-y-5">
                <div className="border-t border-primary/5 pt-5">
                  <h3 className="text-sm font-medium text-primary mb-4">New Password Details</h3>

                  <div className="space-y-5">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type="password" placeholder="Enter new password" className="pl-10 bg-background border-input/50 focus:border-primary" {...field} />
                              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">Password must be at least 8 characters long.</FormDescription>
                          <FormMessage className="text-xs font-medium text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type="password" placeholder="Confirm new password" className="pl-10 bg-background border-input/50 focus:border-primary" {...field} />
                              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs font-medium text-destructive" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <CardFooter className="px-0 py-2">
                <Button type="submit" disabled={isLoading} className="hover:bg-primary/90 text-primary-foreground w-full !rounded-lg">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>Update Password</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
