import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminTopbar } from "@/components/AdminTopbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProvider } from "@/contexts/AdminContext";
import { AccessControlProvider } from "@/contexts/AccessControlContext";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Listing from "./pages/Listing";
import PlaceDetail from "./pages/PlaceDetail";
import Customers from "./pages/Customers";
import Reviews from "./pages/Reviews";
import Promotions from "./pages/Promotions";
import Analytics from "./pages/Analytics";
import Administration from "./pages/Administration";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const AdminLayout = () => (
  <div className="min-h-screen w-full bg-[#F4F5F5]">
    <div className="relative z-10 flex min-h-screen p-6">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64 h-screen">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-6 pt-4 mt-[88px]">
          <Outlet />
        </main>
      </div>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminProvider>
        <AccessControlProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/listings" element={<Listing />} />
                  <Route path="/listings/:placeId" element={<PlaceDetail />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/promotions" element={<Promotions />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/administration" element={<Administration />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AccessControlProvider>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
