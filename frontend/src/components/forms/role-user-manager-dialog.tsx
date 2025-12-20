"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, UserPlus, X } from "lucide-react";

import { DialogFooter } from "frontend/src/components/ui/dialog";
import { Button } from "frontend/src/components/ui/button";
import { Input } from "frontend/src/components/ui/input";
import { Checkbox } from "frontend/src/components/ui/checkbox";
import { ScrollArea } from "frontend/src/components/ui/scroll-area";
import { Badge } from "frontend/src/components/ui/badge";
import { useToast } from "frontend/src/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "frontend/src/components/ui/tabs";
import { User } from "frontend/src/types";
import { useGetUsersQuery } from "frontend/src/services/api/users";
import { useAddUsersToRoleMutation, useDeleteUsersFromRoleMutation } from "frontend/src/services/api/role";

interface RoleUserManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: string;
  roleName: string;
  assignedUsers: User[];
}

export function RoleUserManagerDialog({ open, onOpenChange, roleId, roleName, assignedUsers }: RoleUserManagerDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("add");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [usersToRemove, setUsersToRemove] = useState<Set<string>>(new Set());
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const getUsers = useGetUsersQuery(null);
  const [addUsersToRole, { isLoading: isAddingUsers }] = useAddUsersToRoleMutation();
  const [removeUserFromRole, { isLoading: isRemovingUser }] = useDeleteUsersFromRoleMutation();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedUserIds(new Set());
      setUsersToRemove(new Set());
      setSelectedTab("add");
    }
  }, [open]);

  useEffect(() => {
    setIsLoadingUsers(true);
    if (getUsers.data && getUsers.status === "fulfilled") {
      setAvailableUsers(getUsers.data);
      setIsLoadingUsers(false);
    }

    if (getUsers.error) {
      setUsersError(getUsers.error);
      setIsLoadingUsers(false);
    }
  }, [getUsers.data, getUsers.status]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return availableUsers;

    const query = searchQuery.toLowerCase();
    return availableUsers.filter((user) => user.email.toLowerCase().includes(query) || (user.firstName && user.firstName.toLowerCase().includes(query)));
  }, [availableUsers, searchQuery]);

  // Handle user selection
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  // Handle user removal toggle
  const toggleUserRemoval = (userId: string) => {
    const newRemovalList = new Set(usersToRemove);
    if (newRemovalList.has(userId)) {
      newRemovalList.delete(userId);
    } else {
      newRemovalList.add(userId);
    }
    setUsersToRemove(newRemovalList);
  };

  // Handle add users submission
  const handleAddUsers = async () => {
    if (selectedUserIds.size === 0) return;

    try {
      await addUsersToRole({
        roleId,
        userIds: Array.from(selectedUserIds),
      });
      toast({
        title: t("dashboard.settings.roles.addUsersSuccess"),
        description: t("dashboard.settings.roles.addUsersSuccessDescription", {
          count: selectedUserIds.size,
          role: roleName,
        }),
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("dashboard.settings.roles.addUsersError"),
        variant: "destructive",
      });
    }
  };

  // Handle remove users submission
  const handleRemoveUsers = async () => {
    if (usersToRemove.size === 0) return;

    try {
      await removeUserFromRole({
        roleId,
        userIds: Array.from(usersToRemove),
      });
      toast({
        title: t("dashboard.settings.roles.removeUsersSuccess"),
        description: t("dashboard.settings.roles.removeUsersSuccessDescription", {
          count: usersToRemove.size,
          role: roleName,
        }),
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("dashboard.settings.roles.removeUsersError"),
        variant: "destructive",
      });
    }
  };
  const isLoading = isLoadingUsers || isAddingUsers || isRemovingUser;

  return (
    <>
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add">{t("dashboard.settings.roles.addUsers")}</TabsTrigger>
          <TabsTrigger value="remove" disabled={assignedUsers.length === 0}>
            {t("dashboard.settings.roles.removeUsers")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="mt-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("dashboard.settings.roles.searchUsers")} className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : usersError ? (
            <div className="py-4 text-center text-destructive">{t("dashboard.settings.roles.errorLoadingUsers")}</div>
          ) : (
            <>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>{t("dashboard.settings.roles.usersFound", { count: filteredUsers.length })}</span>
                {selectedUserIds.size > 0 && <span>{t("dashboard.settings.roles.usersSelected", { count: selectedUserIds.size })}</span>}
              </div>

              <ScrollArea className="mt-2 h-[240px] rounded-md border">
                <div className="p-4">
                  {filteredUsers.length === 0 ? (
                    <div className="flex h-full items-center justify-center py-4 text-center text-muted-foreground">{t("dashboard.settings.roles.noUsersFound")}</div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUsers.map((user) => {
                        const isAssigned = assignedUsers.some((u) => u.email === user.email);

                        return (
                          <div key={user.email} className="flex items-center space-x-2">
                            <Checkbox id={`user-${user.id}`} checked={selectedUserIds.has(user.id)} onCheckedChange={() => toggleUserSelection(user.id)} disabled={isAssigned} />
                            <label htmlFor={`user-${user.id}`} className="flex flex-1 cursor-pointer items-center justify-between text-sm">
                              <div>
                                <div className="font-medium">{user.email}</div>
                                {user.firstName && (
                                  <p className="text-xs text-muted-foreground">
                                    {user.firstName} {user.lastName}
                                  </p>
                                )}
                              </div>
                              {isAssigned && (
                                <Badge variant="outline" className="ml-2">
                                  {t("dashboard.settings.roles.alreadyAssigned")}
                                </Badge>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </TabsContent>

        <TabsContent value="remove" className="mt-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("dashboard.settings.roles.searchAssignedUsers")} className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("dashboard.settings.roles.assignedUsers", { count: assignedUsers.length })}</span>
            {usersToRemove.size > 0 && <span>{t("dashboard.settings.roles.usersToRemove", { count: usersToRemove.size })}</span>}
          </div>

          <ScrollArea className="mt-2 h-[240px] rounded-md border">
            <div className="p-4">
              {assignedUsers.length === 0 ? (
                <div className="flex h-full items-center justify-center py-4 text-center text-muted-foreground">{t("dashboard.settings.roles.noAssignedUsers")}</div>
              ) : (
                <div className="space-y-4">
                  {assignedUsers
                    .filter(
                      (user) =>
                        !searchQuery.trim() || user.email.toLowerCase().includes(searchQuery.toLowerCase()) || (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())),
                    )
                    .map((user) => (
                      <div key={user.email} className="flex items-center space-x-2">
                        <Checkbox id={`remove-user-${user.id}`} checked={usersToRemove.has(user.id)} onCheckedChange={() => toggleUserRemoval(user.id)} />
                        <label htmlFor={`remove-user-${user.id}`} className="flex flex-1 cursor-pointer text-sm">
                          <div>
                            <div className="font-medium">{user.email}</div>
                            {user.firstName && (
                              <div className="text-xs text-muted-foreground">
                                {user.firstName} {user.lastName}
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <DialogFooter className="flex sm:justify-between">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
          {t("common.cancel")}
        </Button>

        {selectedTab === "add" ? (
          <Button type="button" onClick={handleAddUsers} disabled={selectedUserIds.size === 0 || isLoading} className="gap-2">
            {isAddingUsers ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <UserPlus className="h-4 w-4" />}
            {t("dashboard.settings.roles.addSelectedUsers", { count: selectedUserIds.size })}
          </Button>
        ) : (
          <Button type="button" variant="destructive" onClick={handleRemoveUsers} disabled={usersToRemove.size === 0 || isLoading} className="gap-2">
            {isRemovingUser ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <X className="h-4 w-4" />}
            {t("dashboard.settings.roles.removeSelectedUsers", { count: usersToRemove.size })}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
