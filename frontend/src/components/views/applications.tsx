import { useToast, useWebSocket } from "frontend/src/hooks";
import {
  useCreateApplicationMutation,
  useDeleteApplicationMutation,
  useDeployApplicationMutation,
  useGetAllApplicationsQuery,
  useLoadBranchesQuery,
  useUploadApplicationMutation,
} from "frontend/src/services/api/applications";
import { ActionMessage, ActionResponse, Input, ProgressMessage } from "frontend/src/types";
import { PlusCircle } from "lucide-react";
import {MouseEvent, useEffect, useState} from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ApplicationCard } from "../application-card";
import { ApplicationForm, DynamicForm } from "../forms";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

const uploadFormSchema = z.object({
  appName: z.string().min(1, "Application name is required"),
  description: z.string().optional(),
  repoUrl: z
    .string()
    .refine(
      (value) => {
        if (!value) return true; // Allow empty string
        try {
          const url = new URL(value);
          if (!["github.com", "gitlab.com"].includes(url.hostname)) {
            return false;
          }
          const parts = url.pathname.split("/").filter(Boolean);
          return parts.length === 2; // Should have exactly user and repo
        } catch {
          return false;
        }
      },
      { message: "Must be a valid GitHub or GitLab repository URL" },
    )
    .optional(),
  branch: z.string().optional(),
});

export function Applications() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);
  const [actionDialog, setActionDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    fields: Input[];
    onSubmit: (data: any) => void;
  }>({
    show: false,
    title: "",
    description: "",
    fields: [],
    onSubmit: () => {},
  });
  const [currentRepoUrl, setCurrentRepoUrl] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();
  const { onNotification, onInteractive, sendMessage } = useWebSocket();

  const {
    data: applications,
    refetch: refreshApplications,
    error: applicationsError,
  } = useGetAllApplicationsQuery(undefined, {
    // Refetch cada 30 segundos
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const { data: branchesData, isFetching: isLoadingBranches, error: branchesError } = useLoadBranchesQuery({ repoUrl: currentRepoUrl }, { skip: !currentRepoUrl });

  useEffect(() => {
    if (applicationsError) {
      toast({
        title: t("common.error"),
        description: t("dashboard.applications.errors.fetchFailed"),
        variant: "destructive",
      });
    }
  }, [applicationsError, t]);

  useEffect(() => {
    if (branchesError) {
      toast({
        title: t("common.error"),
        description: t("dashboard.applications.errors.branchesFetchFailed"),
        variant: "destructive",
      });
    }
  }, [branchesError]);

  useEffect(() => {
    if (branchesData?.branches) {
      setBranches(branchesData.branches);
    }
  }, [branchesData]);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const handleRepoUrlChange = (url: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      if (!url) {
        setBranches([]);
        setCurrentRepoUrl("");
      } else {
        setCurrentRepoUrl(url);
      }
    }, 1000);
  };

  const [createApplication] = useCreateApplicationMutation();
  const [deployApplication] = useDeployApplicationMutation();
  const [uploadApplication] = useUploadApplicationMutation();
  const [deleteApplication] = useDeleteApplicationMutation();

  const handleApplicationAction = async (e: MouseEvent<HTMLButtonElement>, appId: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await deleteApplication({ appId });

      toast({
        title: t("common.success"),
        description: t(`dashboard.applications.actions.deleteSuccess`),
      });

      refreshApplications();
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t(`dashboard.applications.errors.deleteFailed`),
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof uploadFormSchema>, file: File | null) => {
    if (!values.appName) {
      toast({
        title: t("common.error"),
        description: t("dashboard.applications.errors.nameRequired"),
        variant: "destructive",
      });
      return;
    }

    if (!file && !values.repoUrl) {
      toast({
        title: t("common.error"),
        description: t("dashboard.applications.errors.fileOrRepoRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const response = await createApplication({
        appName: values.appName,
        description: values.description || `Application created from ${file ? "file upload" : "repository " + values.repoUrl}`,
      });

      if ("error" in response) {
        throw new Error("Failed to create application");
      }

      const applicationId = response.data.id;

      if (values.repoUrl) {
        if (!values.branch) {
          toast({
            title: t("common.error"),
            description: t("dashboard.applications.errors.branchRequired"),
            variant: "destructive",
          });
          return;
        }

        await deployApplication({
          appId: applicationId,
          repoUrl: values.repoUrl,
          branch: values.branch,
        });

        toast({
          title: t("common.success"),
          description: t("dashboard.applications.actions.deploySuccess"),
        });
      }

      if (file) {
        await uploadApplication({
          appId: applicationId,
          file: file,
        });

        toast({
          title: t("common.success"),
          description: t("dashboard.applications.actions.uploadSuccess"),
        });
      }

      refreshApplications();
      setUploadDialogOpen(false);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("dashboard.applications.errors.unknown"),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const unsubProgress = onNotification((message: ProgressMessage) => {
      if (message.type === "progress") {
        toast({
          title: t("dashboard.applications.actions.deploymentProgress"),
          description: message.message,
        });
      }
    });

    const unsubInteractive = onInteractive((message: ActionMessage) => {
      if (!message?.inputs || !Array.isArray(message.inputs)) {
        return;
      }

      setActionDialog({
        show: true,
        title: message.title || t("dashboard.applications.actions.required"),
        description: message.message || "",
        fields: message.inputs.map((input: Input) => ({
          ...input,
          // Add validation for port number
          validate:
            input.name === "port"
              ? (value: string) => {
                  const port = parseInt(value);
                  if (isNaN(port) || port < 1 || port > 65535) {
                    return t("dashboard.applications.errors.portInvalid");
                  }
                  return true;
                }
              : undefined,
        })),
        onSubmit: (data) => {
          const response: ActionResponse = {
            type: message.type,
            action: message.action,
            data: {
              ...data,
              action: message.action,
            },
          };
          sendMessage(response.type, response.action, response.data);
          setActionDialog((prev) => ({ ...prev, show: false }));

          // Show confirmation toast
          toast({
            title: t("dashboard.applications.actions.portConfiguration"),
            description: t("dashboard.applications.actions.portExposed", {
              port: data.port,
            }),
          });
        },
      });
    });

    // Store unsubscribe functions
    const unsubFunctions = [unsubProgress, unsubInteractive];

    return () => {
      // Call all unsubscribe functions
      unsubFunctions.forEach((unsub) => unsub && unsub());
    };
  }, [onNotification, onInteractive, sendMessage, toast, t]);

  useEffect(() => {
    const ws = new WebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "APPLICATION_UPDATE") {
        // Refetch para obtener los datos actualizados
        refreshApplications();
      }
    };

    return () => {
      ws.close();
    };
  }, [refreshApplications]);

  return (
    <div className="space-y-6 p-2 sm:p-3 w-full max-w-full">
      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.applications.stats.totalApplications")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.applications.stats.runningApplications")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications?.filter((app) => app.status === "Running").length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.applications.stats.failedApplications")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications?.filter((app) => app.status === "Error").length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-3 py-1">
        <h1 className="font-bold text-2xl sm:text-3xl truncate w-full sm:w-auto">{t("dashboard.applications.title")}</h1>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("dashboard.applications.create")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("dashboard.applications.createNew.title")}</DialogTitle>
              <DialogDescription>{t("dashboard.applications.createNew.description")}</DialogDescription>
            </DialogHeader>
            <ApplicationForm onSubmit={onSubmit} isUploading={isUploading} branches={branches} isLoadingBranches={isLoadingBranches} onRepoUrlChange={handleRepoUrlChange} />
          </DialogContent>
        </Dialog>
      </div>

      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
        {applications?.map((app) => <ApplicationCard key={app.id} app={app} onDelete={(e) => handleApplicationAction(e, app.id)} />)}
      </div>

      <Dialog open={actionDialog.show} onOpenChange={(open) => !open && setActionDialog({ ...actionDialog, show: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog.title}</DialogTitle>
            <DialogDescription>{actionDialog.description}</DialogDescription>
          </DialogHeader>
          <DynamicForm fields={actionDialog.fields} onSubmit={actionDialog.onSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
