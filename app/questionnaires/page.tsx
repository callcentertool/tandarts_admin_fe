"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuestionnairesPage() {
  return (
    <MainLayout>
      <div className="sm:space-y-6">
        <div>
          <CardHeader className="px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl font-semibold">
              Questionnaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              No questionnaires available yet.
            </p>
          </CardContent>
        </div>
      </div>
    </MainLayout>
  );
}
