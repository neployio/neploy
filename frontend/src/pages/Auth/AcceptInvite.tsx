import { router } from "@inertiajs/react";
import { Button } from "frontend/src/components/ui/button";
import { useToast } from "frontend/src/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "frontend/src/components/ui/card";
import { AcceptInviteProps } from "frontend/src/types/props";
import { useTheme } from "frontend/src/hooks";
import { useEffect, useState } from "react";

export default function AcceptInvite({ token, expired, alreadyAccepted, provider }: AcceptInviteProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { theme, isDark, applyTheme } = useTheme();

  useEffect(() => {
    applyTheme(theme, isDark);
  }, [theme, isDark, applyTheme]);

  if (expired) {
    return (
      <div className="auth-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>This invitation has expired. Please request a new invitation from your team administrator.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (alreadyAccepted) {
    return (
      <div className="auth-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invitation Already Accepted</CardTitle>
            <CardDescription>This invitation has already been used. Please log in to access your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.visit("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAcceptInvite = () => {
    setIsLoading(true);
    router.post(
      "/users/accept-invite",
      { token },
      {
        onSuccess: () => {
          if (!provider) {
            router.visit("/login", {
              data: { invite_accepted: true },
            });
          } else {
            router.visit("/onboard", {
              data: { invite_accepted: true },
            });
          }
        },
        onError: (errors) => {
          toast({
            title: "Error",
            description: errors.message || "Failed to accept invitation",
            variant: "destructive",
          });
        },
        onFinish: () => setIsLoading(false),
      },
    );
  };

  return (
    <div className="auth-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Accept Team Invitation</CardTitle>
          <CardDescription>Click below to join your team on Neploy</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleAcceptInvite} disabled={isLoading}>
            {isLoading ? "Accepting..." : "Accept Invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
