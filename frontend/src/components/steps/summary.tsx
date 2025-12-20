import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "frontend/src/components/ui/card";
import { Button } from "frontend/src/components/ui/button";
import { SummaryStepProps } from "frontend/src/types/props";
import { useTranslation } from "react-i18next";

export function SummaryStep({ data, onBack, onSubmit }: SummaryStepProps) {
  return (
    <Card className="w-full max-w-screen-md mx-auto">
      <CardHeader>
        <CardTitle>Review Your Information</CardTitle>
        <CardDescription>Please verify your details before continuing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium">Personal Information</h3>
            <dl className="mt-2 space-y-1">
              <div>
                <dt className="text-sm text-muted-foreground">Name</dt>
                <dd>
                  {data.firstName} {data.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Date of Birth</dt>
                <dd>{data.dob ? new Date(data.dob).toLocaleDateString() : "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Phone</dt>
                <dd>{data.phone}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="font-medium">Account Information</h3>
            <dl className="mt-2 space-y-1">
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd>{data.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Username</dt>
                <dd>{data.username}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Address</dt>
                <dd>{data.address}</dd>
              </div>
            </dl>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit}>Complete Registration</Button>
      </CardFooter>
    </Card>
  );
}
