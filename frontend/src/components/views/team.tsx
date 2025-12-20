import { useToast } from "frontend/src/hooks";
import { TeamProps, TechStack } from "frontend/src/types";
import { PlusCircle, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { TechAssignmentDialog } from "frontend/src/components/forms/tech-assignment-dialog";
import { useGetTechStacksQuery } from "frontend/src/services/api/tech-stack";
import { useUpdateUserTechStacksMutation, useInviteUserMutation } from "frontend/src/services/api/users";
import { DialogButton } from "frontend/src/components/forms/dialog-button";

interface InviteMemberData {
  email: string;
  role: string;
}

export function Team({ team, roles, user }: TeamProps) {
  const [open, setOpen] = useState(false);
  const [openTechs, setOpenTechs] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<InviteMemberData>({
    email: "",
    role: "",
  });
  const [teamState, setTeamState] = useState(team);
  const { toast } = useToast();
  const { t } = useTranslation();

  const [updateUserTechStacks] = useUpdateUserTechStacksMutation(); // o usarlo fuera de la función si estás en un componente
  const [inviteUser, { isLoading: isInviting }] = useInviteUserMutation();
  const getTechStacks = useGetTechStacksQuery();
  const [techStacks, setTechStacks] = useState<TechStack[]>([]);

  // Check if current user is admin
  const isAdmin = user?.roles?.includes("administrator");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await inviteUser({ email: formData.email, role: formData.role }).unwrap();
      toast({
        title: t("dashboard.team.inviteSuccess"),
        description: t("dashboard.team.inviteSuccess"),
      });
      setOpen(false);
      setFormData({ email: "", role: "" });
    } catch (err) {
      toast({
        title: t("dashboard.team.inviteError"),
        description: t("dashboard.team.inviteError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(t("dashboard.team.confirmRemove"))) return;

    toast({
      title: t("dashboard.team.removeSuccess"),
      description: t("dashboard.team.removeSuccess"),
    });
    setTeamState(teamState.filter((member) => member.id !== memberId));
  };

  const handleSaveTechs = async (userId: string, techIds: string[]) => {
    setIsLoading(true);
    try {
      await updateUserTechStacks({ userId, techIds }).unwrap();

      toast({
        title: t("dashboard.team.inviteSuccess"),
        description: t("dashboard.team.inviteSuccess"),
      });
      setOpenTechs(false);
      setFormData({ email: "", role: "" });
    } catch (err) {
      console.error(err);
      toast({
        title: t("dashboard.team.inviteError"),
        description: t("dashboard.team.inviteError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (getTechStacks.currentData && getTechStacks.status === "fulfilled") {
      setTechStacks(getTechStacks.currentData);
    }
  }, [getTechStacks.data]);

  return (
    <div className="container mx-auto py-4 px-2 sm:py-6 sm:px-6 w-full max-w-full">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <div>
              <CardTitle className="text-lg font-semibold">{t("dashboard.team.title")}</CardTitle>
              <CardDescription>{t("dashboard.team.description")}</CardDescription>
            </div>
            {isAdmin && <DialogButton
              open={open}
              onOpen={setOpen}
              buttonText={t("dashboard.team.inviteMember")}
              title={t("dashboard.team.inviteMember")}
              description={t("dashboard.team.inviteDescription")}
              icon={PlusCircle}
              variant="text">
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <Label htmlFor="email">{t("dashboard.team.email")}</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="role">{t("dashboard.team.role")}</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("dashboard.team.selectRole")} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("dashboard.team.inviting") : t("dashboard.team.invite")}
                </Button>
              </form>
            </DialogButton>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            {/* Mobile: stacked cards, Desktop: table */}
            <div className="block sm:hidden space-y-4">
              {teamState.map((member) => (
                <div key={member.id} className="rounded-lg border p-4 bg-card flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={`https://unavatar.io/${member.provider === "github" ? `${member.provider}/${member.username}` : member.email}`}
                        alt={member.firstName + " " + member.lastName}
                      />
                      <AvatarFallback>
                        {member.firstName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold">
                        {t("dashboard.team.member")}: <span className="font-normal">{member.firstName + " " + member.lastName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold">{t("dashboard.team.role")}: </span>
                    {member.roles.map((role) => (
                      <Badge key={role.name} variant="default" style={{ backgroundColor: role.color }}>
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                  <div>
                    <span className="font-bold">{t("dashboard.team.status")}: </span>
                    <span className="text-xs">Active</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {isAdmin && (
                      <DialogButton
                        buttonText="Editar pila de tecnologías"
                        description="Edita la pila de tecnologías del miembro"
                        title="Editar pila de tecnologías"
                        open={openTechs}
                        onOpen={setOpenTechs}
                        icon={PlusCircle}
                        variant="tooltip">
                        <TechAssignmentDialog userId={member.id} allTechStacks={techStacks} selectedTechIds={member.techStacks?.map((t) => t.id) ?? []} onSave={handleSaveTechs} />
                      </DialogButton>
                    )}
                    <Button variant="destructive" size="icon" onClick={() => handleRemoveMember(member.id)}>
                      <Trash className="h-4 w-4 text-destructive-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block w-full overflow-x-auto">
              <Table className="min-w-[600px] text-xs md:text-sm w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("dashboard.team.member")}</TableHead>
                    <TableHead>{t("dashboard.team.role")}</TableHead>
                    <TableHead>Móvil</TableHead>
                    {isAdmin && <TableHead className="text-right">{t("dashboard.team.actions")}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamState.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage
                              src={`https://unavatar.io/${member.provider === "github" ? `${member.provider}/${member.username}` : member.email}`}
                              alt={member.firstName + " " + member.lastName}
                            />
                            <AvatarFallback>
                              {member.firstName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.firstName + " " + member.lastName}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.roles.map((role) => (
                          <Badge key={role.name} variant="default" style={{ backgroundColor: role.color }}>
                            {role.name}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {member.phone}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && (
                          <>
                            <DialogButton
                              buttonText="Editar pila de tecnologías"
                              description="Edita la pila de tecnologías del miembro"
                              title="Editar pila de tecnologías"
                              open={openTechs}
                              onOpen={setOpenTechs}
                              icon={PlusCircle}
                              variant="tooltip">
                              <TechAssignmentDialog userId={member.id} allTechStacks={techStacks} selectedTechIds={member.techStacks?.map((t) => t.id) ?? []} onSave={handleSaveTechs} />
                            </DialogButton>
                            <Button variant="destructive" size="icon" className="ml-3" onClick={() => handleRemoveMember(member.id)}>
                              <Trash className="h-4 w-4 text-destructive-foreground" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
