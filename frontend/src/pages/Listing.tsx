import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
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
  MapPin,
  Star,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Filter,
  X,
  Loader2,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdmin } from "@/contexts/AdminContext";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditPlaceModal } from "@/components/EditPlaceModal";
import { AddPlaceModal } from "@/components/AddPlaceModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/** Place fields rendered in the listing table (matches public.places schema) */
interface Place {
  id: string;
  name: string;
  banner_image_link?: string | null;
  category?: string | null;
  sub_category?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  rating?: number | null;
  avg_price?: number | null;
  visible?: boolean;
  [key: string]: unknown; // Allow extra fields from API
}

const ITEMS_PER_PAGE = 15;

export default function Listing() {
  const navigate = useNavigate();
  const { admin, isLoading: isLoadingAdmin, refreshAdmin } = useAdmin();
  const { adminRole, hasRole, hasAnyRole, isAdmin } = useAccessControl();
  const { toast } = useToast();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingPlaceId, setTogglingPlaceId] = useState<string | null>(null);
  const [deletingPlaceId, setDeletingPlaceId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Ensure admin data is fetched when component mounts
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (isAuthenticated && !isLoadingAdmin && !admin) {
      refreshAdmin();
    }
  }, [admin, isLoadingAdmin, refreshAdmin]);

  // Log role information for debugging
  useEffect(() => {
    if (adminRole) {
      console.log("Admin Role:", adminRole);
      console.log("Is Admin:", isAdmin);
      console.log(
        "Access control functions available: hasRole(), hasAnyRole(), isAdmin",
      );
    }
  }, [adminRole, isAdmin]);

  // Handle edit click - open modal
  const handleEditClick = (placeId: string) => {
    setEditingPlaceId(placeId);
    setEditDialogOpen(true);
  };

  // Handle delete confirmation dialog
  const handleDeleteClick = (place: Place) => {
    setPlaceToDelete(place);
    setDeleteDialogOpen(true);
  };

  // Handle delete place
  const handleDeletePlace = async () => {
    if (!placeToDelete) return;

    try {
      setDeletingPlaceId(placeToDelete.id);
      const accessToken = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/places/${placeToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        toast({
          title: "Place Deleted",
          description: `${placeToDelete.name} has been deleted successfully`,
        });

        setDeleteDialogOpen(false);
        setPlaceToDelete(null);

        // Refresh the page to reload data
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to delete place",
        }));
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.detail || "Failed to delete place",
        });
      }
    } catch (error) {
      console.error("Error deleting place:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while deleting the place",
      });
    } finally {
      setDeletingPlaceId(null);
    }
  };

  // Handle toggle visibility
  const handleToggleVisibility = async (placeId: string) => {
    try {
      setTogglingPlaceId(placeId);
      const accessToken = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/places/${placeId}/toggle-visibility`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const updatedPlace = await response.json();

        // Update the place in local state immediately
        setPlaces((prevPlaces) =>
          prevPlaces.map((place) =>
            place.id === placeId
              ? { ...place, ...updatedPlace } // Merge to preserve all fields
              : place,
          ),
        );

        toast({
          title: "Visibility Updated",
          description: `Place is now ${
            updatedPlace.visible !== false ? "Visible" : "Hidden"
          }`,
        });
      } else {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to toggle visibility",
        }));
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.detail || "Failed to toggle place visibility",
        });
      }
    } catch (error) {
      console.error("Error toggling place visibility:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while toggling place visibility",
      });
    } finally {
      setTogglingPlaceId(null);
    }
  };

  // Fetch places from API - extracted as reusable function
  const fetchPlaces = async () => {
    try {
      setIsLoading(true);
      const accessToken = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/places`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlaces(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to fetch places" }));
        const errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : "Failed to fetch places";
        toast({
          variant: "destructive",
          title: "Error loading places",
          description: errorMessage,
        });
        setPlaces([]);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Network error. Ensure the backend is running.";
      toast({
        variant: "destructive",
        title: "Error loading places",
        description: message,
      });
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch places on component mount
  useEffect(() => {
    fetchPlaces();
  }, []);

  // Get unique categories and countries for filters
  const categories = useMemo(() => {
    const cats = new Set<string>();
    places.forEach((place) => {
      if (place.category) cats.add(place.category);
    });
    return Array.from(cats).sort();
  }, [places]);

  const countries = useMemo(() => {
    const countriesSet = new Set<string>();
    places.forEach((place) => {
      if (place.country) countriesSet.add(place.country);
    });
    return Array.from(countriesSet).sort();
  }, [places]);

  // Filter places based on search and filters
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        String(place.name ?? "")
          .toLowerCase()
          .includes(query) ||
        String(place.category ?? "")
          .toLowerCase()
          .includes(query) ||
        String(place.sub_category ?? "")
          .toLowerCase()
          .includes(query) ||
        String(place.address ?? "")
          .toLowerCase()
          .includes(query) ||
        String(place.city ?? "")
          .toLowerCase()
          .includes(query) ||
        String(place.state ?? "")
          .toLowerCase()
          .includes(query) ||
        String(place.country ?? "")
          .toLowerCase()
          .includes(query) ||
        String(place.postal_code ?? "")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        categoryFilter === "all" || place.category === categoryFilter;

      const matchesCountry =
        countryFilter === "all" || place.country === countryFilter;

      return matchesSearch && matchesCategory && matchesCountry;
    });
  }, [places, searchQuery, categoryFilter, countryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPlaces.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPlaces = filteredPlaces.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, countryFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setCountryFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" || categoryFilter !== "all" || countryFilter !== "all";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Listings</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Manage and view all your venue listings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 border-[#D3D5D9]"
            onClick={fetchPlaces}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
            <MapPin className="h-4 w-4" />
            Add New Listing
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, address, city, country, postal code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Country Filter */}
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
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

        {/* Results count */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {paginatedPlaces.length} of {filteredPlaces.length} listings
          {hasActiveFilters && " (filtered)"}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Image</TableHead>
                <TableHead className="min-w-[220px]">Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="min-w-[200px]">Location</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-12 w-12 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[200px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[60px] mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px] ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px] mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px] ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedPlaces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <MapPin className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No listings found
                        {hasActiveFilters && ". Try adjusting your filters."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPlaces.map((place) => (
                  <TableRow
                    key={place.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/listings/${place.id}`)}
                  >
                    {/* Image: string (URL) */}
                    <TableCell>
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        {typeof place.banner_image_link === "string" &&
                        place.banner_image_link ? (
                          <img
                            src={place.banner_image_link}
                            alt={String(place.name ?? "")}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    {/* Name: string */}
                    <TableCell className="font-medium">
                      <span className="font-semibold">
                        {String(place.name ?? "—")}
                      </span>
                    </TableCell>
                    {/* Category: string */}
                    <TableCell>
                      <div>
                        <Badge variant="secondary" className="m-1">
                          {String(place.category ?? "—")}
                        </Badge>
                        {place.sub_category && (
                          <Badge variant="secondary" className="m-1">
                            {String(place.sub_category)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {/* Location: strings (address, city, state, country, postal_code) */}
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        {place.address && (
                          <span className=" line-clamp-1">
                            {String(place.address)}
                          </span>
                        )}
                        <span>
                          {[
                            place.city,
                            place.state,
                            place.country,
                            place.postal_code,
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </span>
                      </div>
                    </TableCell>
                    {/* Rating: number */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                        <span className="font-medium">
                          {place.rating != null &&
                          !Number.isNaN(Number(place.rating))
                            ? Number(place.rating).toFixed(1)
                            : "—"}
                        </span>
                      </div>
                    </TableCell>
                    {/* Price: number */}
                    <TableCell className="text-right">
                      {place.avg_price != null &&
                      !Number.isNaN(Number(place.avg_price)) ? (
                        <span className="font-medium">
                          ₹{Number(place.avg_price).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {/* Status: boolean (visible) */}
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          place.visible !== false ? "default" : "outline"
                        }
                        className={
                          place.visible !== false
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-700"
                        }
                      >
                        {place.visible !== false ? "Visible" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={
                            place.visible === false
                              ? "Make Visible"
                              : "Make Hidden"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVisibility(place.id);
                          }}
                          disabled={togglingPlaceId === place.id}
                        >
                          {togglingPlaceId === place.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : place.visible === false ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(place.id);
                          }}
                          disabled={editingPlaceId === place.id}
                        >
                          {editingPlaceId === place.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(place);
                          }}
                          disabled={deletingPlaceId === place.id}
                        >
                          {deletingPlaceId === place.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredPlaces.length > 0 && totalPages > 1 && (
          <div className="border-t border-border p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
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
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
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

      {/* Add Place Modal */}
      <AddPlaceModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onPlaceCreated={() => {
          // Refresh listings when a place is successfully created
          // Small delay to ensure the place is saved before refreshing
          setTimeout(() => {
            fetchPlaces();
          }, 500);
        }}
      />

      {/* Edit Place Modal */}
      <EditPlaceModal
        placeId={editingPlaceId}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingPlaceId(null);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">
                {placeToDelete?.name || "this place"}
              </span>{" "}
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setPlaceToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlace}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingPlaceId !== null}
            >
              {deletingPlaceId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
