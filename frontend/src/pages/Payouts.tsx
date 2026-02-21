import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  RefreshCw,
  Wallet,
  User,
  MapPin,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface VendorDetails {
  id?: string;
  business_name?: string;
  vendor_full_name?: string;
  vendor_phone_number?: string;
  vendor_email?: string;
  vendor_address?: string;
  vendor_city?: string;
  vendor_state?: string;
  vendor_country?: string;
  vendor_postal_code?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
  paid_so_far?: number;
  created_at?: string;
  updated_at?: string;
}

interface Payout {
  place_id: string;
  vendor_id?: string;
  name: string;
  place_name: string;
  num_bookings: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  vendor?: VendorDetails;
}

const ITEMS_PER_PAGE = 15;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function Payouts() {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPayouts = async () => {
    try {
      setIsLoading(true);
      const accessToken = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/payouts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayouts(Array.isArray(data) ? data : []);
      } else {
        setPayouts([]);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch payouts",
        });
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
      setPayouts([]);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while fetching payouts",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [toast]);

  const filteredPayouts = useMemo(() => {
    if (!searchQuery.trim()) return payouts;
    const q = searchQuery.toLowerCase();
    return payouts.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.place_name?.toLowerCase().includes(q),
    );
  }, [payouts, searchQuery]);

  const totalPages = Math.ceil(filteredPayouts.length / ITEMS_PER_PAGE);
  const paginatedPayouts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayouts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayouts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePayNow = (payout: Payout) => {
    toast({
      title: "Pay now",
      description: `Pay now functionality for ${payout.place_name} coming soon.`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payouts</h1>
          <p className="text-muted-foreground text-sm">
            Manage vendor payouts by place
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-[#D3D5D9]"
          onClick={fetchPayouts}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {paginatedPayouts.length} of {filteredPayouts.length} payouts
          {searchQuery && " (filtered)"}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Name</TableHead>
                <TableHead className="min-w-[180px]">Place name</TableHead>
                <TableHead className="min-w-[120px]">No. of bookings</TableHead>
                <TableHead className="min-w-[120px]">Total amount</TableHead>
                <TableHead className="min-w-[120px]">Amount paid</TableHead>
                <TableHead className="min-w-[120px]">Balance</TableHead>
                <TableHead className="min-w-[120px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[140px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[90px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[90px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[90px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Wallet className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {payouts.length === 0
                          ? "No payouts yet"
                          : searchQuery
                            ? "No payouts match your search"
                            : "No payouts found"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayouts.map((p) => (
                  <TableRow key={p.place_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-medium">{p.name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm">{p.place_name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{p.num_bookings}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {formatCurrency(p.total_amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {formatCurrency(p.amount_paid)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${
                          p.balance > 0 ? "text-amber-600" : ""
                        }`}
                      >
                        {formatCurrency(p.balance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={p.balance <= 0}
                        onClick={() => handlePayNow(p)}
                      >
                        Pay now
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && filteredPayouts.length > 0 && totalPages > 1 && (
          <div className="border-t border-border p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
