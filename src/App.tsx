import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PaletteProvider } from "@/contexts/PaletteContext";
import AuthPage from "./pages/AuthPage.tsx";
import Index from "./pages/Index.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import DesignSystemPage from "./pages/DesignSystemPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthPage />;

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/design-system" element={<DesignSystemPage />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="capsule-theme">
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <PaletteProvider>
          <BrowserRouter>
            <AuthGate />
          </BrowserRouter>
        </PaletteProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
