import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  Clock,
  ImageIcon,
  ExternalLink,
  User,
  Mail,
  Building2,
  CreditCard,
  Images,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Place {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  banner_image_link?: string | null;
  location_map_link?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_updated?: string | null;
  category?: string | null;
  sub_category?: string | null;
  description?: string | null;
  avg_price?: number | null;
  review_count?: number | null;
  rating?: number | null;
  phone_number?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hours?: Array<{
    day?: string;
    open?: string;
    close?: string;
    closed?: boolean;
  }> | null;
  amenities?: string[] | null;
  website?: string | null;
  visible?: boolean;
  [key: string]: unknown;
}

interface Vendor {
  id?: string;
  business_name?: string | null;
  vendor_full_name?: string | null;
  vendor_phone_number?: string | null;
  vendor_email?: string | null;
  vendor_address?: string | null;
  vendor_city?: string | null;
  vendor_state?: string | null;
  vendor_country?: string | null;
  vendor_postal_code?: string | null;
  place_id?: string | null;
  account_holder_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  upi_id?: string | null;
  razorpay_contact_ref?: string | null;
  razorpay_fa_ref?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface GalleryImage {
  id: string;
  place_id: string;
  gallery_image_url: string;
  created_at?: string | null;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

const DAY_ORDER: Record<string, number> = {
  monday: 0,
  mon: 0,
  tuesday: 1,
  tue: 1,
  wednesday: 2,
  wed: 2,
  thursday: 3,
  thu: 3,
  friday: 4,
  fri: 4,
  saturday: 5,
  sat: 5,
  sunday: 6,
  sun: 6,
};

function sortHoursByDay(
  hours: Array<{
    day?: string;
    open?: string;
    close?: string;
    closed?: boolean;
  }>,
): typeof hours {
  return [...hours].sort((a, b) => {
    const dayA = (a.day || "").toLowerCase().trim();
    const dayB = (b.day || "").toLowerCase().trim();
    const orderA = DAY_ORDER[dayA] ?? 999;
    const orderB = DAY_ORDER[dayB] ?? 999;
    return orderA - orderB;
  });
}

export default function PlaceDetail() {
  const { placeId } = useParams<{ placeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [place, setPlace] = useState<Place | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!placeId) return;

    const fetchPlace = async () => {
      try {
        setIsLoading(true);
        const accessToken = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/api/places/${placeId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPlace(data);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Place not found",
          });
          navigate("/listings");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load place details",
        });
        navigate("/listings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlace();
  }, [placeId, navigate, toast]);

  // Fetch vendor/owner when place is loaded
  useEffect(() => {
    if (!placeId) return;

    const fetchVendor = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        const response = await fetch(
          `${API_URL}/api/places/${placeId}/vendor`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const text = await response.text();
          const data = text ? JSON.parse(text) : null;
          setVendor(
            data && typeof data === "object" && !Array.isArray(data)
              ? data
              : null,
          );
        } else {
          setVendor(null);
        }
      } catch {
        setVendor(null);
      }
    };

    fetchVendor();
  }, [placeId]);

  // Fetch gallery images when place is loaded
  useEffect(() => {
    if (!placeId) return;

    const fetchGalleryImages = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        const response = await fetch(
          `${API_URL}/api/places/${placeId}/gallery-images`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setGalleryImages(Array.isArray(data) ? data : []);
        } else {
          setGalleryImages([]);
        }
      } catch {
        setGalleryImages([]);
      }
    };

    fetchGalleryImages();
  }, [placeId]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!place) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Button
        variant="ghost"
        className="gap-2 -ml-2"
        onClick={() => navigate("/listings")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Listings
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{place.name}</h1>
            <Badge
              variant={place.visible !== false ? "default" : "outline"}
              className={
                place.visible !== false
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }
            >
              {place.visible !== false ? "Visible" : "Hidden"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            {place.category && (
              <Badge variant="outline">{place.category}</Badge>
            )}
            {place.sub_category && (
              <Badge variant="outline">{place.sub_category}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Banner image */}
      <div className="rounded-xl border border-border overflow-hidden bg-muted">
        {place.banner_image_link ? (
          <img
            src={place.banner_image_link}
            alt={place.name}
            className="w-full h-64 md:h-80 object-cover"
          />
        ) : (
          <div className="w-full h-64 md:h-80 flex items-center justify-center">
            <ImageIcon className="h-24 w-24 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Gallery */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <Images className="h-5 w-5" />
          Gallery
        </h2>
        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {galleryImages.map((img) => (
              <button
                key={img.id}
                type="button"
                className="aspect-square rounded-lg overflow-hidden border border-border bg-muted hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => setSelectedImage(img)}
              >
                <img
                  src={img.gallery_image_url}
                  alt={`Gallery ${img.id}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No gallery images for this place
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic info */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-lg">Basic Information</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{place.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Description</dt>
              <dd className="font-medium">{place.description || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-medium">{place.category || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sub-category</dt>
              <dd className="font-medium">{place.sub_category || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge
                  variant={place.visible !== false ? "default" : "outline"}
                  className={
                    place.visible !== false
                      ? "bg-green-500"
                      : "bg-gray-200 text-gray-700"
                  }
                >
                  {place.visible !== false ? "Visible" : "Hidden"}
                </Badge>
              </dd>
            </div>
            {vendor && (
              <>
                <div>
                  <dt className="text-muted-foreground">
                    Razorpay Contact Ref
                  </dt>
                  <dd className="font-medium font-mono">
                    {vendor.razorpay_contact_ref || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Razorpay FA Ref</dt>
                  <dd className="font-medium font-mono">
                    {vendor.razorpay_fa_ref || "—"}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {/* Location */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Address</dt>
              <dd className="font-medium">{place.address || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">City</dt>
              <dd className="font-medium">{place.city || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">State</dt>
              <dd className="font-medium">{place.state || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Country</dt>
              <dd className="font-medium">{place.country || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Postal Code</dt>
              <dd className="font-medium">{place.postal_code || "—"}</dd>
            </div>
            {(place.latitude != null || place.longitude != null) && (
              <div>
                <dt className="text-muted-foreground">Coordinates</dt>
                <dd className="font-medium font-mono text-xs">
                  {place.latitude}, {place.longitude}
                </dd>
              </div>
            )}
            {place.location_map_link && (
              <div>
                <a
                  href={place.location_map_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  View on map <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </dl>
        </div>

        {/* Ratings & pricing */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            Ratings & Pricing
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Rating</dt>
              <dd className="font-medium">
                {place.rating != null && !Number.isNaN(Number(place.rating))
                  ? `${Number(place.rating).toFixed(1)} / 10`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Review Count</dt>
              <dd className="font-medium">{place.review_count ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Average Price</dt>
              <dd className="font-medium">
                {place.avg_price != null &&
                !Number.isNaN(Number(place.avg_price))
                  ? new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(Number(place.avg_price)) + " per person"
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Contact */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{place.phone_number || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Website</dt>
              <dd>
                {place.website ? (
                  <a
                    href={
                      place.website.startsWith("http")
                        ? place.website
                        : `https://${place.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {place.website} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Owner Info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <User className="h-5 w-5" />
          Owner Info
        </h2>
        {vendor ? (
          <dl className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-sm">
            <div>
              <dt className="text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Business Name
              </dt>
              <dd className="font-medium">{vendor.business_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Vendor Name
              </dt>
              <dd className="font-medium">{vendor.vendor_full_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                Email
              </dt>
              <dd>
                {vendor.vendor_email ? (
                  <a
                    href={`mailto:${vendor.vendor_email}`}
                    className="text-primary hover:underline"
                  >
                    {vendor.vendor_email}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                Phone
              </dt>
              <dd>
                {vendor.vendor_phone_number ? (
                  <a
                    href={`tel:${vendor.vendor_phone_number}`}
                    className="text-primary hover:underline"
                  >
                    {vendor.vendor_phone_number}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Address</dt>
              <dd className="font-medium">{vendor.vendor_address || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">City</dt>
              <dd className="font-medium">{vendor.vendor_city || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">State</dt>
              <dd className="font-medium">{vendor.vendor_state || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Country</dt>
              <dd className="font-medium">{vendor.vendor_country || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Postal Code</dt>
              <dd className="font-medium">
                {vendor.vendor_postal_code || "—"}
              </dd>
            </div>
            {/* Bank Details */}
            {(vendor.account_holder_name ||
              vendor.account_number ||
              vendor.ifsc_code ||
              vendor.upi_id) && (
              <>
                <div className="sm:col-span-2 md:col-span-3 w-full border-t pt-4 mt-2">
                  <h3 className="font-medium flex items-center gap-2 mb-3 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Bank Details
                  </h3>
                </div>
                {vendor.account_holder_name && (
                  <div>
                    <dt className="text-muted-foreground">Account Holder</dt>
                    <dd className="font-medium">
                      {vendor.account_holder_name}
                    </dd>
                  </div>
                )}
                {vendor.account_number && (
                  <div>
                    <dt className="text-muted-foreground">Account Number</dt>
                    <dd className="font-medium font-mono">
                      {vendor.account_number}
                    </dd>
                  </div>
                )}
                {vendor.ifsc_code && (
                  <div>
                    <dt className="text-muted-foreground">IFSC Code</dt>
                    <dd className="font-medium font-mono">
                      {vendor.ifsc_code}
                    </dd>
                  </div>
                )}
                {vendor.upi_id && (
                  <div>
                    <dt className="text-muted-foreground">UPI ID</dt>
                    <dd className="font-medium font-mono">{vendor.upi_id}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            No owner information linked to this place
          </p>
        )}
      </div>

      {/* Hours & Amenities - side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Hours */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5" />
            Operating Hours
          </h2>
          {place.hours && place.hours.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {sortHoursByDay(place.hours).map((h, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm py-2 px-3 rounded-lg bg-muted/50"
                >
                  <span className="font-medium">{h.day || "—"}</span>
                  <span>
                    {h.closed
                      ? "Closed"
                      : `${h.open || "—"} – ${h.close || "—"}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hours set</p>
          )}
        </div>

        {/* Amenities */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-lg mb-4">Amenities</h2>
          {place.amenities && place.amenities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {place.amenities.map((a, i) => (
                <Badge key={i} variant="secondary">
                  {a}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No amenities listed</p>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold text-lg mb-4">Record Info</h2>
        <dl className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 text-sm">
          <div>
            <dt className="text-muted-foreground">ID</dt>
            <dd className="font-medium font-mono truncate">{place.id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium">{formatDate(place.created_at)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Updated</dt>
            <dd className="font-medium">{formatDate(place.updated_at)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last Updated</dt>
            <dd className="font-medium">{formatDate(place.last_updated)}</dd>
          </div>
        </dl>
      </div>

      {/* Gallery image lightbox */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl p-0 border-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Gallery Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage.gallery_image_url}
              alt="Gallery"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
