"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "frontend/src/components/ui/card";
import { Button } from "frontend/src/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "frontend/src/components/ui/form";
import { Input } from "frontend/src/components/ui/input";
import { PasswordInput } from "frontend/src/components/ui/password-input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "frontend/src/components/forms/language-selector";
import { useLoginMutation, usePasswordLinkMutation } from "frontend/src/services/api/auth";
import { useTheme } from "frontend/src/hooks";
import { ThemeSwitcher } from "frontend/src/components/theme-switcher";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { useToast } from "frontend/src/hooks/use-toast";
import { Toaster } from "frontend/src/components/ui/toaster";

// Login form schema
const loginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required").min(6, { message: "Password must be at least 6 characters" }),
});

// Password reset request form schema
const resetPasswordFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export default function AuthViews({ logoUrl, name, language = "en" }: { logoUrl: string; name: string; language: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"login" | "resetPassword">("login");
  const { t, i18n } = useTranslation();
  const [login] = useLoginMutation();
  const [passwordLink] = usePasswordLinkMutation();
  const { theme, isDark, applyTheme } = useTheme();
  const { toast } = useToast();

  // Set the initial language
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);
  useEffect(() => {
    applyTheme(theme, isDark);
  }, [theme, isDark, applyTheme]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Reset password form
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordFormSchema>>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onLoginSubmit(values: z.infer<typeof loginFormSchema>) {
    setIsLoading(true);
    try {
      // @ts-expect-error
      await login(values).unwrap();
      // Redirect after successful login
      router.visit("/dashboard");
    } catch (error: any) {
      console.log(error);
      
      // Handle specific error cases
      if (error.status === 429) {
        // Rate limiting error
        loginForm.setError("root", { 
          message: error.data?.error || t("errors.tooManyAttempts") 
        });
      } else if (error.status === 401) {
        // Authentication error - use the server's message if available
        loginForm.setError("root", { 
          message: error.data?.error || t("errors.invalidCredentials")
        });
      } else if (error.status === 400) {
        // Validation error
        loginForm.setError("root", { 
          message: error.data?.error || error.data?.details || t("errors.validationFailed")
        });
      } else if (error.data?.error) {
        // Generic error with message from server
        loginForm.setError("root", { message: error.data.error });
      } else {
        // Fallback error
        loginForm.setError("root", { message: t("errors.serverError") });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function onResetPasswordSubmit(values: z.infer<typeof resetPasswordFormSchema>) {
    setIsLoading(true);
    try {
      const language = i18n.language;
      await passwordLink({ email: values.email, language }).unwrap();
      // Show success message
      resetPasswordForm.reset();
      toast({
        title: "Password reset link sent",
        description: `A password reset link has been sent to ${values.email}`,
      });

      // Return to login view
      setView("login");
    } catch (error: any) {
      console.log(error);
      resetPasswordForm.setError("root", {
        message: error.message || t("errors.serverError"),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="auth-background bg-background flex-col md:flex-row">
        {/* Auth Forms */}
        <div className="w-full flex items-center justify-center p-8">
          {view === "login" ? (
            <LoginView form={loginForm} onSubmit={onLoginSubmit} isLoading={isLoading} onForgotPassword={() => setView("resetPassword")} />
          ) : (
            <ResetPasswordView form={resetPasswordForm} onSubmit={onResetPasswordSubmit} isLoading={isLoading} onBack={() => setView("login")} />
          )}
        </div>
      </div>
      <Toaster />
    </>
  );
}

// Login View Component
function LoginView({ form, onSubmit, isLoading, onForgotPassword }: { form: any; onSubmit: (values: any) => void; isLoading: boolean; onForgotPassword: () => void }) {
  const { t } = useTranslation();

  return (
    <Card className="w-full max-w-lg border-primary/10 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center pb-3">
          <CardTitle className="text-4xl mr-4">{t("auth.login")}</CardTitle>
          <div className="w-1/3">
            <LanguageSelector />
            <ThemeSwitcher className="mt-3 w-fit" />
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.email")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder={t("auth.enterEmail")} className="pl-10 bg-background border-input/50 focus:border-primary" {...field} />
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
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
                  <div className="flex justify-between items-center">
                    <FormLabel>{t("auth.password")}</FormLabel>
                    <Button variant="link" className="p-0 h-auto text-xs text-primary" type="button" onClick={onForgotPassword}>
                      {t("auth.forgotPassword")}
                    </Button>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <PasswordInput placeholder={t("auth.enterPassword")} className="pl-10 bg-background border-input/50 focus:border-primary" {...field} />
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <FormMessage className="text-destructive">{form.formState.errors.root.message}</FormMessage>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("auth.loggingIn")}
                </>
              ) : (
                t("auth.logIn")
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

// Reset Password View Component
function ResetPasswordView({ form, onSubmit, isLoading, onBack }: { form: any; onSubmit: (values: any) => void; isLoading: boolean; onBack: () => void }) {
  const { t } = useTranslation();

  return (
    <Card className="w-full max-w-lg border-primary/10 shadow-lg">
      <CardHeader>
        <div className="flex items-center pb-3">
          <Button variant="ghost" size="icon" className="mr-2 h-8 w-8 text-primary" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to login</span>
          </Button>
          <CardTitle className="text-2xl">{t("auth.resetPassword")}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{t("auth.resetPasswordInstructions")}</p>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.email")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder={t("auth.enterEmail")} className="pl-10 bg-background border-input/50 focus:border-primary" {...field} />
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <FormMessage className="text-destructive">{form.formState.errors.root.message}</FormMessage>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("auth.sending")}
                </>
              ) : (
                t("auth.sendResetLink")
              )}
            </Button>
            <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5" type="button" onClick={onBack}>
              {t("auth.backToLogin")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
