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
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  User,
  MapPin,
  DollarSign,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Booking {
  id: string;
  user_id: string;
  place_id: string;
  amount_paid?: number | null;
  booking_status?: string | null;
  booking_date_and_time?: string | null;
  booking_date_time?: string | null;
  user_name: string;
  user_email: string;
  place_name: string;
  [key: string]: unknown;
}

const ITEMS_PER_PAGE = 15;

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function Bookings() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [placeFilter, setPlaceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const accessToken = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/bookings`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(Array.isArray(data) ? data : []);
      } else {
        setBookings([]);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch bookings",
        });
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while fetching bookings",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [toast]);

  const places = useMemo(() => {
    const set = new Set(
      bookings.map((b) => b.place_name).filter((p): p is string => !!p),
    );
    return Array.from(set).sort();
  }, [bookings]);

  const statuses = useMemo(() => {
    const set = new Set(
      bookings.map((b) => b.booking_status).filter((s): s is string => !!s),
    );
    return Array.from(set).sort();
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        searchQuery === "" ||
        b.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.place_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlace =
        placeFilter === "all" || b.place_name === placeFilter;

      const matchesStatus =
        statusFilter === "all" || b.booking_status === statusFilter;

      return matchesSearch && matchesPlace && matchesStatus;
    });
  }, [bookings, searchQuery, placeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, placeFilter, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setPlaceFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" || placeFilter !== "all" || statusFilter !== "all";

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const displayKeys = [
    "id",
    "user_id",
    "place_id",
    "user_name",
    "user_email",
    "place_name",
    "amount_paid",
    "amount_payable_to_vendor",
    "booking_status",
    "booking_date_time",
  ];

  const getLabel = (key: string): string => {
    const labels: Record<string, string> = {
      id: "Booking ID",
      user_id: "User ID",
      place_id: "Place ID",
      user_name: "User name",
      user_email: "User email",
      place_name: "Place name",
      amount_paid: "Amount paid",
      amount_payable_to_vendor: "Amount payable to vendor",
      booking_status: "Booking status",
      booking_date_time: "Booking date and time",
    };
    return labels[key] || key.replace(/_/g, " ");
  };

  const formatValue = (key: string, value: unknown): string => {
    if (value == null || value === "") return "—";
    if (
      (key === "amount_paid" || key === "amount_payable_to_vendor") &&
      (typeof value === "number" || (typeof value === "string" && !isNaN(Number(value))))
    ) {
      return formatCurrency(typeof value === "number" ? value : Number(value));
    }
    if (
      (key === "booking_date_and_time" || key === "booking_date_time") &&
      typeof value === "string"
    ) {
      return formatDate(value);
    }
    return String(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bookings</h1>
          <p className="text-muted-foreground text-sm">
            View and manage all bookings
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-[#D3D5D9]"
          onClick={fetchBookings}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user or place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={placeFilter} onValueChange={setPlaceFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Place" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Places</SelectItem>
              {places.map((place) => (
                <SelectItem key={place} value={place}>
                  {place}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {paginatedBookings.length} of {filteredBookings.length}{" "}
          bookings
          {hasActiveFilters && " (filtered)"}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">User</TableHead>
                <TableHead className="min-w-[180px]">Place</TableHead>
                <TableHead className="min-w-[120px]">Amount paid</TableHead>
                <TableHead className="min-w-[100px]">Booking status</TableHead>
                <TableHead className="min-w-[160px]">
                  Booking date and time
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-[140px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[140px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[70px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {bookings.length === 0
                          ? "No bookings yet"
                          : hasActiveFilters
                            ? "No bookings match your filters"
                            : "No bookings found"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBookings.map((b) => (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedBooking(b)}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="font-medium">
                            {b.user_name || "—"}
                          </span>
                        </div>
                        {b.user_email && (
                          <span className="text-xs text-muted-foreground pl-5">
                            {b.user_email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm">{b.place_name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {formatCurrency(b.amount_paid)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {b.booking_status ? (
                        <Badge
                          variant="default"
                          className="bg-green-500 text-white"
                        >
                          {b.booking_status}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {formatDate(b.booking_date_time)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && filteredBookings.length > 0 && totalPages > 1 && (
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

      {/* Booking detail modal */}
      <Dialog
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Known fields first */}
              <div className="grid gap-3">
                {displayKeys.map((key) => (
                  <div
                    key={key}
                    className="flex justify-between gap-4 py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm font-medium text-muted-foreground capitalize">
                      {getLabel(key)}
                    </span>
                    <span className="text-sm text-right break-all">
                      {formatValue(key, selectedBooking[key])}
                    </span>
                  </div>
                ))}
              </div>
              {/* Any other fields from the API */}
              {Object.keys(selectedBooking)
                .filter(
                  (k) =>
                    !displayKeys.includes(k) &&
                    selectedBooking[k] !== undefined &&
                    selectedBooking[k] !== null,
                )
                .map((key) => (
                  <div
                    key={key}
                    className="flex justify-between gap-4 py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm font-medium text-muted-foreground capitalize">
                      {getLabel(key)}
                    </span>
                    <span className="text-sm text-right break-all">
                      {formatValue(key, selectedBooking[key])}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
