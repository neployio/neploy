"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "frontend/src/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "frontend/src/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "frontend/src/components/ui/form";
import { Input } from "frontend/src/components/ui/input";
import { Switch } from "frontend/src/components/ui/switch";
import { User } from "frontend/src/types";
import { Avatar, AvatarFallback, AvatarImage } from "frontend/src/components/ui/avatar";
import { DatePicker } from "frontend/src/components/forms/date-picker";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { withMask } from "use-mask-input";
import {format, parse} from "date-fns";
import { useUpdatePasswordMutation, useUpdateProfileMutation } from "frontend/src/services/api/users";
import {useToast} from "frontend/src/hooks";

const profileFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  dob: z.date({ message: "Required" }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  phone: z.string().min(5, {
    message: "Phone number must be at least 5 characters.",
  }),
  notifications: z.boolean().default(false),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
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

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function UserProfile({ user }: { user: User }) {
  const { t } = useTranslation();
  const {toast} = useToast();
  user = {
    ...user,
    dob: format(new Date(user.dob), "yyyy-MM-dd"),
  };
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      ...user,
      dob: (() => {
        try {
          // Try to parse the date string
          const parsedDate = parse(user.dob, "yyyy-MM-dd", new Date());
          // Check if the parsed date is valid
          return !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
        } catch (error) {
          // If parsing fails, return current date as fallback
          console.warn("Failed to parse date of birth:", error);
          return new Date();
        }
      })(),
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [updateProfile] = useUpdateProfileMutation();
  const [updatePassword] = useUpdatePasswordMutation();

  async function onProfileSubmit(data: ProfileFormValues) {
    try {
      await updateProfile({
        ...data,
        dob: data.dob.toISOString(),
      }).unwrap();
      toast({
        title: "Perfil actualizado!",
        description: "Tu perfil ha sido actualizado exitosamente.",
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    try {
      await updatePassword(data).unwrap();
      toast({
        title: "Contraseña actualizada!",
        description: "Tu contraseña ha sido actualizada exitosamente.",
      });
    } catch (error) {
      console.error("Error al actualizar contraseña:", error);
    }
  }

  const avatarUrl = user.provider === "github" ? `https://unavatar.io/github/${user.username}` : `https://unavatar.io/${user.email}`;

  // Get initials for fallback
  const getInitials = () => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  console.log(user);
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Profile Information */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
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
                  control={profileForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
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

                {/*<FormField*/}
                {/*  control={profileForm.control}*/}
                {/*  name="notifications"*/}
                {/*  render={({ field }) => (*/}
                {/*    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">*/}
                {/*      <div className="space-y-0.5">*/}
                {/*        <FormLabel className="text-base">Notifications</FormLabel>*/}
                {/*        <FormDescription>Receive system notifications and alerts.</FormDescription>*/}
                {/*      </div>*/}
                {/*      <FormControl>*/}
                {/*        <Switch checked={field.value} onCheckedChange={field.onChange} />*/}
                {/*      </FormControl>*/}
                {/*    </FormItem>*/}
                {/*  )}*/}
                {/*/>*/}
                <CardFooter className="px-0 pb-0">
                  <Button type="submit">Save Changes</Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Security & Password */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-start flex-col gap-4">
              <Avatar className="h-36 w-36 border-2 border-primary/10">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="text-lg font-medium">{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Security & Password</CardTitle>
                <CardDescription>Update your password and security settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter current password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
                      </FormControl>
                      <FormDescription>Password must be at least 8 characters long.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CardFooter className="px-0 pb-0">
                  <Button type="submit">Update Password</Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
