import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter, Route, Switch, Redirect } from "wouter";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

import { Dashboard } from "@/routes/index";
import { CandidatesPage } from "@/routes/candidates";
import { KanbanPage } from "@/routes/kanban";
import { AssessmentsPage } from "@/routes/assessments";
import { ScreeningPage } from "@/routes/screening";
import { OffersPage } from "@/routes/offers";
import { JoiningPage } from "@/routes/joining";
import { ClientInterviewsPage } from "@/routes/client-interviews";
import { ProcessFlowPage } from "@/routes/process-flow";
import { RequirementsPage } from "@/routes/requirements";
import { AssessmentPage } from "@/routes/assessment";
import { LoginPage } from "@/pages/login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, employee, logout } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <LoginPage />}
      </Route>
      <Route>
        <AuthGuard>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar employee={employee} onLogout={logout} />
              <div className="flex-1 min-w-0">
                <AppShell>
                  <Switch>
                    <Route path="/" component={Dashboard} />
                    <Route path="/process-flow" component={ProcessFlowPage} />
                    <Route path="/requirements" component={RequirementsPage} />
                    <Route path="/candidates" component={CandidatesPage} />
                    <Route path="/screening" component={ScreeningPage} />
                    <Route path="/assessments" component={AssessmentsPage} />
                    <Route path="/assessment/:candidateId" component={AssessmentPage} />
                    <Route path="/kanban" component={KanbanPage} />
                    <Route path="/client-interviews" component={ClientInterviewsPage} />
                    <Route path="/offers" component={OffersPage} />
                    <Route path="/joining" component={JoiningPage} />
                    <Route component={NotFound} />
                  </Switch>
                </AppShell>
              </div>
            </div>
          </SidebarProvider>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={base}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
