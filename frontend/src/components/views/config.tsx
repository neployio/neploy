import { SettingsProps } from "frontend/src/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Boxes, GitBranch, Settings, UsersRound } from "lucide-react";
import GeneralTab from "./config-general";
import RolesTab from "./config-roles";
import TechStackTab from "./config-techstack";
import TraceabilityTab from "./config-traceability";
import { useTranslation } from "react-i18next";

export const Config = ({ teamName, logoUrl, language, roles = [], techStacks = [], traces = [] }: SettingsProps) => {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto p-6 print:w-full print:mx-0 print:p-0">
      <h1 className="text-2xl font-bold mb-6 print:hidden">System Configuration</h1>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full md:grid-cols-2 lg:grid-cols-4 h-fit print:hidden">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            {t("dashboard.settings.general.title")}
          </TabsTrigger>
          <TabsTrigger value="roles">
            <UsersRound className="h-4 w-4 mr-2" />
            {t("dashboard.settings.roles.title")}
          </TabsTrigger>
          <TabsTrigger value="techstack">
            <Boxes className="h-4 w-4 mr-2" />
            {t("dashboard.settings.techStack.title")}
          </TabsTrigger>
          <TabsTrigger value="traceability">
            <GitBranch className="h-4 w-4 mr-2" />
            {t("dashboard.settings.trace.title")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab teamName={teamName} logoUrl={logoUrl} language={language} />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab roles={roles} />
        </TabsContent>

        <TabsContent value="techstack">
          <TechStackTab techStacks={techStacks} />
        </TabsContent>

        <TabsContent value="traceability">
          <TraceabilityTab traces={traces} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
