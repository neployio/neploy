import { router } from "@inertiajs/react";
import { useToast } from "frontend/src/hooks/use-toast";
import { useTheme } from "frontend/src/hooks";
import { ProviderStep, UserDataStep, SummaryStep } from "frontend/src/components/steps";
import { CompleteInviteProps } from "frontend/src/types/props";
import { User } from "frontend/src/types/common";
import { useCompleteInviteMutation } from "frontend/src/services/api/auth";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Step = "provider" | "data" | "summary";

export default function CompleteInvite({ token, email, username, provider, error, status }: CompleteInviteProps) {
  const [step, setStep] = useState<Step>(() => {
    return provider ? "data" : "provider";
  });
  const [userData, setUserData] = useState<User>({
    firstName: "",
    lastName: "",
    dob: "",
    phone: "",
    address: "",
    email: email || "",
    username: username || "",
    password: "",
  });
  const { toast } = useToast();
  const { theme, isDark, applyTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [completeInvite] = useCompleteInviteMutation();

  useEffect(() => {
    applyTheme(theme, isDark);
  }, [theme, isDark, applyTheme]);

  useEffect(() => {
    if (status === "expired") {
      toast({
        title: t("invite.expired.title"),
        description: t("invite.expired.description"),
        variant: "destructive",
      });
    } else if (status === "accepted") {
      toast({
        title: t("invite.accepted.title"),
        description: t("invite.accepted.description"),
        variant: "destructive",
      });
    } else if (status === "invalid") {
      toast({
        title: t("invite.invalid.title"),
        description: error || t("invite.invalid.description"),
        variant: "destructive",
      });
    }
  }, [status, error, t]);

  if (status !== "valid") {
    router.visit("/login");
    return null;
  }

  const handleProviderNext = () => {
    setStep("data");
  };

  const handleDataNext = (data: User) => {
    const formattedData = {
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      dob: data.dob || "",
      phone: data.phone || "",
      address: data.address || "",
      email: data.email || "",
      username: data.username || "",
      password: data.password || "",
    };
    setUserData(formattedData);
    setStep("summary");
  };

  const handleDataBack = () => {
    setStep("provider");
  };

  const handleSummaryBack = () => {
    setStep("data");
  };

  const handleSubmit = () => {
    if (!userData.firstName || !userData.lastName || !userData.phone || !userData.address || !userData.email || !userData.username) {
      toast({
        title: t("common.error"),
        description: t("invite.validation.requiredFields"),
      });
      return;
    }

    const submitData = {
      token,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      address: userData.address,
      email: userData.email,
      username: userData.username,
    };

    completeInvite(submitData)
      .unwrap()
      .then(() => {
        toast({
          title: t("common.success"),
          description: t("invite.success.accountCreated"),
        });
        window.location.replace("/");
      })
      .catch((error) => {
        const errorMessage = error.data?.error || t("invite.error.registrationFailed");
        toast({
          title: t("common.error"),
          description: errorMessage,
          variant: "destructive",
        });
      });
  };

  const renderStep = () => {
    switch (step) {
      case "provider":
        return <ProviderStep onNext={handleProviderNext} token={token} />;
      case "data":
        return <UserDataStep email={email} username={username} onNext={handleDataNext} onBack={handleDataBack} />;
      case "summary":
        return <SummaryStep data={userData} onBack={handleSummaryBack} onSubmit={handleSubmit} />;
    }
  };

  return (
    <div className="auth-background">
      <div className="w-full">{renderStep()}</div>
    </div>
  );
}
