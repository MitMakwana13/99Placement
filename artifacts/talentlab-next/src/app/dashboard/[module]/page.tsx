"use client";

import { useParams as useNextParams, useRouter as useNextRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Construction, ArrowLeft } from "lucide-react";

export default function ModulePlaceholderPage() {
  const params = useNextParams();
  const router = useNextRouter();
  const moduleName = typeof params.module === "string" ? params.module : "Module";

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).replace("-", " ");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center space-y-6">
      <div className="p-4 bg-pastel-pink/20 text-pastel-pink-ink rounded-3xl animate-bounce">
        <Construction className="h-10 w-10 text-pastel-pink" />
      </div>

      <Card className="border border-border p-6 shadow-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-pastel-pink-ink uppercase tracking-wider">
            <Sparkles className="h-4.5 w-4.5" /> Workspace Component
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight">
            {capitalize(moduleName)} Module
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            This module is registered in the sidebar routing maps but has not been deployed yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            The core DDL schemas, database indices, and backend routes for {capitalize(moduleName)} have been fully stabilized. 
            Frontend client integrations will begin in the next phase.
          </p>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
