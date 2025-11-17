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
import Dashboard from "./pages/Dashboard";
import Places from "./pages/Places";
import Cities from "./pages/Cities";
import Users from "./pages/Users";
import Bookings from "./pages/Bookings";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const AdminLayout = () => (
  <div className="min-h-screen w-full bg-[#F4F5F5]">
    <div className="relative z-10 flex min-h-screen p-6">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64 h-screen">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-6 pt-4">
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
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/places" element={<Places />} />
                <Route path="/cities" element={<Cities />} />
                <Route path="/users" element={<Users />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/categories" element={<Dashboard />} />
                <Route path="/hosts" element={<Dashboard />} />
                <Route path="/reviews" element={<Dashboard />} />
                <Route path="/promotions" element={<Dashboard />} />
                <Route path="/settings" element={<Dashboard />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
