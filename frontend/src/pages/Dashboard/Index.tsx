import DashboardLayout from "frontend/src/components/Layouts/DashboardLayout";

export default function Index(props: any) {
  const { user, teamName, logoUrl } = props;

  return <DashboardLayout user={user} teamName={teamName} logoUrl={logoUrl} props={props} />;
}
