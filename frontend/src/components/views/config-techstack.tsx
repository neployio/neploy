import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "frontend/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "frontend/src/components/ui/table";
import { Badge } from "frontend/src/components/ui/badge";
import { TechStacksSettingsProps } from "frontend/src/types/props";
import { TechIcon } from "frontend/src/components/icons/tech-icon";
import { useTranslation } from "react-i18next";
import { DialogButton } from "../forms/dialog-button";
import { TechStackForm } from "../forms/tech-stack-form";
import { useToast } from "frontend/src/hooks";
import { z } from "zod";
import { useCreateTechStackMutation, useDeleteTechStackMutation, useGetTechStacksQuery, useUpdateTechStackMutation } from "frontend/src/services/api/tech-stack";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { TooltipButton } from "../ui/tooltip-button";

const techStackSchema = z.object({
  name: z.string().min(2).max(64),
  description: z.string().min(2).max(128),
});

const TechStackTab: React.FC<TechStacksSettingsProps> = ({ techStacks: initialTechStacks }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const getTechStacks = useGetTechStacksQuery();
  const [createTechStack] = useCreateTechStackMutation();
  const [updateTechStack] = useUpdateTechStackMutation();
  const [deleteTechStack] = useDeleteTechStackMutation();
  const [openTechStackId, setOpenTechStackId] = useState<string | null>(null);
  const [techStacks, setTechStacks] = useState(initialTechStacks);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (getTechStacks.currentData) {
      setTechStacks(getTechStacks.currentData);
    }
  }, [getTechStacks.data]);

  async function update(techStackId: string, data: z.infer<typeof techStackSchema>) {
    try {
      await updateTechStack({
        id: techStackId,
        name: data.name,
        description: data.description,
      }).unwrap();

      toast({
        title: t("dashboard.settings.techStack.updateSuccess"),
        description: t("dashboard.settings.techStack.updateSuccessDescription"),
      });
      setOpenTechStackId(null);
      getTechStacks.refetch();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("dashboard.settings.techStack.updateError"),
        variant: "destructive",
      });
    }
  }

  async function create(data: z.infer<typeof techStackSchema>) {
    try {
      await createTechStack({
        name: data.name,
        description: data.description,
      }).unwrap();
      toast({
        title: t("dashboard.settings.techStack.createSuccess"),
        description: t("dashboard.settings.techStack.createSuccessDescription"),
      });
      getTechStacks.refetch();
      setOpen(false);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("dashboard.settings.techStack.createError"),
        variant: "destructive",
      });
    }
  }

  async function del(techStackId: string) {
    try {
      await deleteTechStack(techStackId).unwrap();
      toast({
        title: t("dashboard.settings.techStack.deleteSuccess"),
        description: t("dashboard.settings.techStack.deleteSuccessDescription"),
      });
      getTechStacks.refetch();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("dashboard.settings.techStack.deleteError"),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DialogButton
          title={t("dashboard.settings.techStack.add")}
          open={open}
          onOpen={setOpen}
          description={t("dashboard.settings.techStack.editDescriptionDialog")}
          icon={PlusCircle}
          buttonText={t("dashboard.settings.techStack.add")}>
          <TechStackForm onSubmit={create} />
        </DialogButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.settings.techStack.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboard.settings.techStack.tableLogo")}</TableHead>
                <TableHead>{t("dashboard.settings.techStack.tableTechnology")}</TableHead>
                <TableHead>{t("dashboard.settings.techStack.tableDescription")}</TableHead>
                <TableHead>{t("dashboard.settings.techStack.tableTotalApps")}</TableHead>
                <TableHead>{t("dashboard.settings.techStack.tableActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {techStacks.map((techStack) => (
                <TableRow key={techStack.id}>
                  <TableCell>
                    <TechIcon name={techStack.name} size={40} />
                  </TableCell>
                  <TableCell>{techStack.name}</TableCell>
                  <TableCell>{techStack.description}</TableCell>
                  <TableCell>
                    <Badge variant={techStack.applications?.length > 0 ? "destructive" : "default"}>{techStack.applications?.length ?? 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <DialogButton
                        title={t("dashboard.settings.techStack.edit")}
                        description={t("dashboard.settings.techStack.editDescriptionDialog")}
                        icon={Pencil}
                        variant="tooltip"
                        open={openTechStackId === techStack.id}
                        onOpenChange={(isOpen) => {
                          if (!isOpen) {
                            setOpenTechStackId(null);
                          } else {
                            setOpenTechStackId(techStack.id);
                          }
                        }}
                        buttonText={t("dashboard.settings.techStack.editAction")}>
                        <TechStackForm
                          defaultValues={techStack}
                          onSubmit={(data) => {
                            update(techStack.id, data);
                            setOpenTechStackId(null);
                          }}
                        />
                      </DialogButton>
                      <TooltipButton
                        icon={Trash2}
                        tooltip={t("dashboard.settings.techStack.deleteTooltip")}
                        variant="destructive"
                        size="icon"
                        disabled={techStack.applications?.length > 0}
                        onClick={() => del(techStack.id)}>
                        {t("dashboard.settings.techStack.deleteAction")}
                      </TooltipButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechStackTab;
