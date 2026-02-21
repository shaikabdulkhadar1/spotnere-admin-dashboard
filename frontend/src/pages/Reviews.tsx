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
  Star,
  X,
  RefreshCw,
  MessageSquare,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Review {
  id: string;
  user_id: string;
  place_id: string;
  review: string;
  rating: number;
  created_at: string;
  user_name: string;
  user_email: string;
  place_name: string;
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

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0"
        />
      ))}
      {hasHalf && (
        <Star className="h-4 w-4 fill-yellow-400/50 text-yellow-400 shrink-0" />
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          className="h-4 w-4 text-muted-foreground/40 shrink-0"
        />
      ))}
      <span className="ml-1 text-sm font-medium">({rating.toFixed(1)})</span>
    </div>
  );
}

export default function Reviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [placeFilter, setPlaceFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const accessToken = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/reviews`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(Array.isArray(data) ? data : []);
      } else {
        setReviews([]);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch reviews",
        });
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while fetching reviews",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [toast]);

  const places = useMemo(() => {
    const set = new Set(
      reviews.map((r) => r.place_name).filter((p): p is string => !!p)
    );
    return Array.from(set).sort();
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        searchQuery === "" ||
        r.review?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.place_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlace =
        placeFilter === "all" || r.place_name === placeFilter;

      const matchesRating =
        ratingFilter === "all" ||
        (ratingFilter === "4+" && r.rating >= 4) ||
        (ratingFilter === "3-4" && r.rating >= 3 && r.rating < 4) ||
        (ratingFilter === "2-3" && r.rating >= 2 && r.rating < 3) ||
        (ratingFilter === "1-2" && r.rating >= 1 && r.rating < 2) ||
        (ratingFilter === "0-1" && r.rating < 1);

      return matchesSearch && matchesPlace && matchesRating;
    });
  }, [reviews, searchQuery, placeFilter, ratingFilter]);

  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReviews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, placeFilter, ratingFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setPlaceFilter("all");
    setRatingFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" || placeFilter !== "all" || ratingFilter !== "all";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reviews</h1>
          <p className="text-muted-foreground text-sm">
            View and manage customer reviews for places
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-[#D3D5D9]"
          onClick={fetchReviews}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by review, user, or place..."
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
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Star className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="4+">4+ stars</SelectItem>
              <SelectItem value="3-4">3 - 4 stars</SelectItem>
              <SelectItem value="2-3">2 - 3 stars</SelectItem>
              <SelectItem value="1-2">1 - 2 stars</SelectItem>
              <SelectItem value="0-1">0 - 1 stars</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {paginatedReviews.length} of {filteredReviews.length} reviews
          {hasActiveFilters && " (filtered)"}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Rating</TableHead>
                <TableHead className="min-w-[250px]">Review</TableHead>
                <TableHead className="min-w-[180px]">User</TableHead>
                <TableHead className="min-w-[180px]">Place</TableHead>
                <TableHead className="min-w-[140px]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {reviews.length === 0
                          ? "No reviews yet"
                          : hasActiveFilters
                            ? "No reviews match your filters"
                            : "No reviews found"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReviews.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <StarRating rating={r.rating} />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm line-clamp-3">{r.review || "—"}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{r.user_name || "—"}</span>
                        {r.user_email && (
                          <span className="text-xs text-muted-foreground">
                            {r.user_email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{r.place_name || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {formatDate(r.created_at)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && filteredReviews.length > 0 && totalPages > 1 && (
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
                  )
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
