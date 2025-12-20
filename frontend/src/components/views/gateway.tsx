import { GatewayProps } from "frontend/src/types";
import { Globe } from "lucide-react";
import { GatewayTable } from "../gateway-table";
import { useTranslation } from "react-i18next";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "frontend/src/components/ui/form";
import { Button } from "frontend/src/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "frontend/src/components/ui/radio-group";
import { useSaveGatewayConfigMutation } from "frontend/src/services/api/gateways";
import { useToast } from "frontend/src/hooks";

export function Gateways({ gateways, config, user }: GatewayProps) {
  const { t } = useTranslation();
  const isAdministrator = user.roles.includes("administrator");
  const formSchema = z.object({
    defaultVersioning: z.enum(["header", "uri"], { required_error: "You need to select a default versioning type." }),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      defaultVersioning: config.defaultVersioningType,
    },
  });
  const { toast } = useToast();
  const [setConfig] = useSaveGatewayConfigMutation();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await setConfig({
        defaultVersioning: values.defaultVersioning,
      }).unwrap();
      toast({
        title: "Config saved!",
        description: "Gateway Config was saved successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Config not saved.",
        description: e?.data?.message || "Error saving config.",
      });
    }
  }

  return (
    <div className="container mx-auto p-2 sm:p-6 w-full max-w-full">
      <div className="flex-1 overflow-auto">
        <div className="p-2 sm:p-6">
          <section>
            <h2 className="text-2xl font-semibold mb-5">{t("dashboard.gateways.config")}</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 grid grid-cols-1 md:grid-cols-3 items-center">
                <FormField
                  control={form.control}
                  name="defaultVersioning"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("dashboard.gateways.defaultVersioning")}</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          defaultValue={field.value} 
                          className="flex flex-col space-y-1"
                          disabled={!isAdministrator}
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="header" disabled={!isAdministrator} />
                            </FormControl>
                            <FormLabel className="font-normal">{t("dashboard.gateways.defaultVersioningHeader")}</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="uri" disabled={!isAdministrator} />
                            </FormControl>
                            <FormLabel className="font-normal">{t("dashboard.gateways.defaultVersioningURI")}</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-full flex justify-end items-center gap-x-2">
                  {isAdministrator && (
                    <>
                      <Button type="button" variant="ghost">
                        {t("actions.cancel")}
                      </Button>
                      <Button type="submit" variant="default">
                        {t("actions.save")}
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </Form>
          </section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{t("dashboard.gateways.title")}</h1>
            </div>
          </div>
          <div className="w-full overflow-x-auto mb-8">
            {!gateways || gateways?.length === 0 ? (
              <p className="text-muted-foreground">{t("dashboard.gateways.noGateways")}</p>
            ) : (
              <div className="min-w-[600px]">
                <GatewayTable gateways={gateways} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
