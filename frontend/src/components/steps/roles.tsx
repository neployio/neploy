import * as React from "react";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/src/components/ui/card";
import { Button } from "frontend/src/components/ui/button";
import { RoleIcon } from "frontend/src/components/icons/role-icon";
import { Trash2 } from "lucide-react";
import { RoleForm } from "frontend/src/components/forms";
import { useTranslation } from "react-i18next";

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
});

interface Props {
  onNext: () => void;
  onBack: () => void;
  roles: any[];
  setRoles: (roles: any[]) => void;
}

export function RolesStep({ onNext, onBack, roles, setRoles }: Props) {
  const { t } = useTranslation();
  const onSubmit = (data: z.infer<typeof roleSchema>) => {
    setRoles([...roles, data]);
  };

  return (
    <Card className="w-full max-w-screen-md mx-auto">
      <CardHeader>
        <CardTitle>{t("step.role.title")}</CardTitle>
        <CardDescription>{t("step.role.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <RoleForm
          onSubmit={onSubmit}
          renderFooter={(form) => (
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={onBack}>
                {t("actions.back")}
              </Button>
              <div className="space-x-2">
                <Button variant="secondary" type="submit">
                  {t("step.role.add")}
                </Button>
                <Button type="button" onClick={onNext} disabled={roles.length === 0}>
                  {t("actions.next")}
                </Button>
              </div>
            </div>
          )}
        />
        {roles.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-xl">{t("step.role.selected")}</h3>
            <ul>
              {roles.map((role, index) => (
                <li key={index} className="flex justify-between items-center space-x-2 my-1">
                  <div className="flex items-center space-x-2 space-y-2">
                    <RoleIcon icon={role.icon} color={role.color} />
                    <div>
                      <p className="font-semibold">{role.name}</p>
                      <p>{role.description}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="w-12 h-12"
                    onClick={() => {
                      setRoles(roles.filter((r, i) => i !== index));
                    }}>
                    <Trash2 className="!w-7 !h-7" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
