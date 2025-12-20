import { Button } from "frontend/src/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "frontend/src/components/ui/form";
import { Input } from "frontend/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "frontend/src/components/ui/select";
import { Textarea } from "frontend/src/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useDropzone } from "react-dropzone";
import React from "react";
import { useTranslation } from "react-i18next";

const baseFields = {
  repoUrl: z
    .string()
    .refine(
      (value) => {
        if (!value) return true;
        try {
          const url = new URL(value);
          const parts = url.pathname.split("/").filter(Boolean);
          return ["github.com", "gitlab.com"].includes(url.hostname) && parts.length === 2;
        } catch {
          return false;
        }
      },
      {
        message: "Must be a valid GitHub or GitLab repository URL (e.g., https://github.com/user/repo)",
      },
    )
    .optional(),
  branch: z.string().optional(),
  description: z.string().optional(),
};

const uploadFormSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("create-app"),
    appName: z.string().min(1, "Application name is required"),
    ...baseFields,
  }),
  z.object({
    mode: z.literal("create-version"),
    appName: z.string().optional(), // No requerido
    ...baseFields,
  }),
]);

interface ApplicationFormProps {
  mode?: "create-app" | "create-version";
  applicationId?: string;
  onSubmit: (values: z.infer<typeof uploadFormSchema>, file: File | null) => void;
  isUploading: boolean;
  branches: string[];
  isLoadingBranches: boolean;
  onRepoUrlChange: (url: string) => void;
}

export function ApplicationForm({ mode = "create-app", onSubmit, isUploading, branches, isLoadingBranches, onRepoUrlChange }: ApplicationFormProps) {
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);

  const form = useForm<z.infer<typeof uploadFormSchema>>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      mode,
      appName: "",
      description: "",
      repoUrl: "",
      branch: "",
    },
  });

  const { t } = useTranslation();

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"],
    },
    maxFiles: 1,
    multiple: undefined,
    onDragEnter: undefined,
    onDragOver: undefined,
    onDragLeave: undefined,
  });

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "repoUrl") {
        onRepoUrlChange(value.repoUrl || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [form, onRepoUrlChange]);

  const handleSubmit = (values: z.infer<typeof uploadFormSchema>) => {
    onSubmit(values, uploadedFile);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {mode === "create-app" && (
          <>
            <FormField
              control={form.control}
              name="appName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dashboard.applications.createNew.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("dashboard.applications.createNew.namePlaceholder")} />
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
                  <FormLabel>{t("dashboard.applications.createNew.description")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("dashboard.applications.createNew.descriptionPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <FormField
          control={form.control}
          name="repoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("dashboard.applications.createNew.fileOrRepo")}</FormLabel>
              <FormControl>
                <Input placeholder="https://github.com/username/repository" {...field} />
              </FormControl>
              <FormDescription>{t("dashboard.applications.createNew.repoUrlDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.watch("repoUrl") && (
          <FormField
            control={form.control}
            name="branch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("dashboard.applications.createNew.branch")}</FormLabel>
                <Select disabled={isLoadingBranches} value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingBranches ? t("dashboard.applications.createNew.loadingBranches") : t("dashboard.applications.createNew.branchPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>{t("dashboard.applications.createNew.dropzoneActive")}</p>
          ) : uploadedFile ? (
            <div>
              <p className="font-medium text-primary">{uploadedFile.name}</p>
            </div>
          ) : (
            <p>{t("dashboard.applications.createNew.dropzoneInactive")}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isUploading}>
          {isUploading ? t("dashboard.applications.createNew.deploying") : t("dashboard.applications.createNew.deploy")}
        </Button>
      </form>
    </Form>
  );
}
