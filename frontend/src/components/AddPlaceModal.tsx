import { useEffect, useState, useCallback, useRef, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BannerImageUpload } from "@/components/BannerImageUpload";
import { getAuthenticatedSupabase } from "@/lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;
const COUNTRIES_API =
  import.meta.env.VITE_COUNTRIES_API || "https://countriesnow.space/api/v0.1";

interface CountryPosition {
  name: string;
  lat: number;
  lng: number;
}

interface CountriesResponse {
  error: boolean;
  msg: string;
  data: CountryPosition[];
}

interface StatesResponse {
  error: boolean;
  msg: string;
  data: {
    name: string;
    iso2: string;
    iso3: string;
    states: Array<{
      name: string;
      state_code: string;
    }>;
  };
}

interface CitiesResponse {
  error: boolean;
  msg: string;
  data: string[];
}

interface Place {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  avg_price: number;
  review_count: number;
  open_now: boolean;
  visible?: boolean;
  banner_image_link?: string;
  latitude?: number;
  longitude?: number;
  hours?: any[];
  amenities?: string[];
  tags?: string[];
  website?: string;
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
}

interface AddPlaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPlaceModal({ open, onOpenChange }: AddPlaceModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Place>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [newAmenity, setNewAmenity] = useState("");
  const [newTag, setNewTag] = useState("");
  const [createdPlaceId, setCreatedPlaceId] = useState<string | null>(null);

  // Location dropdown states
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [priceInputValue, setPriceInputValue] = useState<string>("");

  // Banner image upload states (for before place creation)
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(
    null
  );
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputId = useId();

  // Hours state - structured format
  interface DayHours {
    day: string;
    open: string;
    close: string;
    closed?: boolean;
  }

  const defaultDays: DayHours[] = [
    { day: "Monday", open: "09:00", close: "17:00", closed: false },
    { day: "Tuesday", open: "09:00", close: "17:00", closed: false },
    { day: "Wednesday", open: "09:00", close: "17:00", closed: false },
    { day: "Thursday", open: "09:00", close: "17:00", closed: false },
    { day: "Friday", open: "09:00", close: "17:00", closed: false },
    { day: "Saturday", open: "09:00", close: "17:00", closed: false },
    { day: "Sunday", open: "09:00", close: "17:00", closed: false },
  ];

  const [hoursData, setHoursData] = useState<DayHours[]>(defaultDays);

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      // Reset form to empty state
      setFormData({});
      setNewAmenity("");
      setNewTag("");
      setStates([]);
      setCities([]);
      setPriceInputValue("");
      setHoursData([...defaultDays]);
      setCreatedPlaceId(null);
      // Reset banner image states
      setBannerImagePreview(null);
      setBannerImageFile(null);
      setIsImageSelected(false);
      setIsUploadingImage(false);
    }
  }, [open]);

  // Fetch countries when modal opens
  useEffect(() => {
    if (open && countries.length === 0) {
      fetchCountries();
    }
  }, [open, countries.length]);

  // Fetch states when country changes
  useEffect(() => {
    if (formData.country && formData.country.trim() !== "") {
      fetchStates(formData.country);
    } else {
      setStates([]);
      setCities([]);
    }
  }, [formData.country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (formData.country && formData.state && formData.state.trim() !== "") {
      fetchCities(formData.country, formData.state);
    } else {
      setCities([]);
    }
  }, [formData.country, formData.state]);

  // API Functions
  const fetchCountries = async () => {
    setIsLoadingCountries(true);
    try {
      const response = await fetch(`${COUNTRIES_API}/countries/positions`);
      const data: CountriesResponse = await response.json();

      if (data.error) {
        throw new Error(data.msg || "Failed to fetch countries");
      }

      const countryNames = data.data.map((country) => country.name).sort();
      setCountries(countryNames);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load countries",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCountries(false);
    }
  };

  const fetchStates = async (country: string) => {
    setIsLoadingStates(true);
    setStates([]);
    setCities([]);
    try {
      const response = await fetch(`${COUNTRIES_API}/countries/states`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country }),
      });

      const data: StatesResponse = await response.json();

      if (data.error) {
        throw new Error(data.msg || "Failed to fetch states");
      }

      const stateNames = data.data.states.map((state) => state.name).sort();
      setStates(stateNames);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load states",
        variant: "destructive",
      });
      setStates([]);
    } finally {
      setIsLoadingStates(false);
    }
  };

  const fetchCities = async (country: string, state: string) => {
    setIsLoadingCities(true);
    setCities([]);
    try {
      const response = await fetch(`${COUNTRIES_API}/countries/state/cities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country, state }),
      });

      const data: CitiesResponse = await response.json();

      if (data.error) {
        throw new Error(data.msg || "Failed to fetch cities");
      }

      if (!Array.isArray(data.data)) {
        throw new Error("Invalid cities data format");
      }

      const cityNames = data.data.sort();
      setCities(cityNames);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load cities",
        variant: "destructive",
      });
      setCities([]);
    } finally {
      setIsLoadingCities(false);
    }
  };

  const handleInputChange = useCallback(
    (field: keyof Place, value: string | number | boolean | undefined) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // Handle price input change
  const handlePriceChange = (value: string) => {
    setPriceInputValue(value);

    const cleaned = value.replace(/[^\d.]/g, "");

    if (cleaned === "") {
      handleInputChange("avg_price", undefined);
      return;
    }

    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return;
    }

    const numValue = parseFloat(cleaned);

    if (!isNaN(numValue)) {
      handleInputChange("avg_price", numValue);
    }
  };

  // Handle price input blur - format to 2 decimal places
  const handlePriceBlur = () => {
    const value = formData.avg_price;
    if (value !== undefined && value !== null && !isNaN(value)) {
      const formatted = value.toFixed(2);
      setPriceInputValue(formatted);
      handleInputChange("avg_price", parseFloat(formatted));
    } else {
      setPriceInputValue("");
    }
  };

  const handleArrayFieldChange = (
    field: "amenities" | "tags",
    value: string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities?.includes(newAmenity.trim())) {
      handleArrayFieldChange("amenities", [
        ...(formData.amenities || []),
        newAmenity.trim(),
      ]);
      setNewAmenity("");
    }
  };

  const removeAmenity = (index: number) => {
    const updated = [...(formData.amenities || [])];
    updated.splice(index, 1);
    handleArrayFieldChange("amenities", updated);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      handleArrayFieldChange("tags", [...(formData.tags || []), newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    const updated = [...(formData.tags || [])];
    updated.splice(index, 1);
    handleArrayFieldChange("tags", updated);
  };

  const handleHoursChange = (
    dayIndex: number,
    field: "open" | "close" | "closed",
    value: string | boolean
  ) => {
    const updatedHours = [...hoursData];
    if (updatedHours[dayIndex]) {
      if (field === "closed") {
        updatedHours[dayIndex] = {
          ...updatedHours[dayIndex],
          closed: value as boolean,
        };
      } else {
        updatedHours[dayIndex] = {
          ...updatedHours[dayIndex],
          [field]: value as string,
        };
      }
      setHoursData(updatedHours);
      setFormData((prev) => ({
        ...prev,
        hours: updatedHours,
      }));
    }
  };

  const handleApplyToAllDays = (open: string, close: string) => {
    const updatedHours = hoursData.map((day) => ({
      ...day,
      open,
      close,
      closed: false,
    }));
    setHoursData(updatedHours);
    setFormData((prev) => ({
      ...prev,
      hours: updatedHours,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Prepare create data
      const createData: any = { ...formData };

      // Hours data is already in the correct format
      if (hoursData && hoursData.length > 0) {
        createData.hours = hoursData;
      }

      // Convert string numbers to proper types
      if (createData.rating !== undefined) {
        createData.rating = parseFloat(String(createData.rating)) || 0;
      }
      if (createData.avg_price !== undefined) {
        createData.avg_price = parseFloat(String(createData.avg_price)) || 0;
      }

      // Set timestamps
      const now = new Date().toISOString();
      createData.created_at = now;
      createData.updated_at = now;

      const accessToken = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/places`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createData),
      });

      if (response.ok) {
        const newPlace = await response.json();
        setCreatedPlaceId(newPlace.id);
        setFormData(newPlace);
        toast({
          title: "Success",
          description: "Place created successfully",
        });
        // Refresh the page to update the listing
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to create place",
        }));
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.detail || "Failed to create place",
        });
      }
    } catch (error) {
      console.error("Error creating place:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while creating place",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Banner image handlers (for before place creation)
  const handleBannerImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (file) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            variant: "destructive",
            title: "Invalid File",
            description: "Please select an image file",
          });
          e.target.value = "";
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            variant: "destructive",
            title: "File Too Large",
            description: "Image must be less than 5MB",
          });
          e.target.value = "";
          return;
        }

        setBannerImageFile(file);
        setIsImageSelected(true);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setBannerImagePreview(reader.result as string);
          }
        };
        reader.onerror = () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to read image file",
          });
          e.target.value = "";
          setBannerImageFile(null);
          setIsImageSelected(false);
        };
        reader.readAsDataURL(file);
      }
    },
    [toast]
  );

  const handleUploadBannerImage = async () => {
    if (!bannerImageFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an image first",
      });
      return;
    }

    try {
      setIsUploadingImage(true);

      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        throw new Error("No access token found. Please log in.");
      }

      const supabase = await getAuthenticatedSupabase();
      const bucketName = import.meta.env.VITE_SUPABASE_BUCKET_NAME;

      if (!bucketName) {
        throw new Error("Bucket name not configured");
      }

      // Create a temporary file path (we'll need placeId later, so use a temp path)
      // For now, we'll store it temporarily and move it after place creation
      const timestamp = Date.now();
      const fileExtension = bannerImageFile.name.split(".").pop() || "jpg";
      const tempFilePath = `temp-banners/${timestamp}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExtension}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(tempFilePath, bannerImageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: bannerImageFile.type,
        });

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(tempFilePath);

      if (!publicUrl) {
        throw new Error("Failed to get public URL for uploaded image");
      }

      // Store the URL in form data
      handleInputChange("banner_image_link", publicUrl);
      setBannerImagePreview(publicUrl);
      setIsImageSelected(false);
      setBannerImageFile(null);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload image. Please try again.",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveBannerImage = () => {
    setBannerImageFile(null);
    setBannerImagePreview(null);
    setIsImageSelected(false);
    handleInputChange("banner_image_link", "");
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = "";
    }
  };

  const handleBannerImageUploaded = useCallback(
    (imageUrl: string) => {
      handleInputChange("banner_image_link", imageUrl);
    },
    [handleInputChange]
  );

  const handleBannerImageRemoved = useCallback(() => {
    handleInputChange("banner_image_link", "");
  }, [handleInputChange]);

  const handleClose = () => {
    onOpenChange(false);
    setFormData({});
    setNewAmenity("");
    setNewTag("");
    setHoursData([...defaultDays]);
    setCreatedPlaceId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-[#F4F5F5] overflow-y-auto">
        <DialogHeader className="pt-4">
          <DialogTitle>Add New Place</DialogTitle>
          <DialogDescription>
            Enter all details for the new place
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Banner Image Upload */}
          {createdPlaceId ? (
            // Show upload component after place is created
            <BannerImageUpload
              placeId={createdPlaceId}
              initialImageUrl={formData.banner_image_link}
              onImageUploaded={handleBannerImageUploaded}
              onImageRemoved={handleBannerImageRemoved}
            />
          ) : (
            // Show upload UI before place is created (similar to BannerImageUpload)
            <div className="space-y-2">
              <Label htmlFor={bannerInputId}>Banner Image</Label>
              <div className="space-y-4">
                {bannerImagePreview ? (
                  <div className="relative w-full h-48 rounded-lg border border-border overflow-hidden bg-muted">
                    <img
                      src={bannerImagePreview}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveBannerImage}
                      disabled={isUploadingImage}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg bg-muted/50">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        No image selected
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={bannerFileInputRef}
                    id={bannerInputId}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerImageChange}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-[#D3D5D9]"
                    disabled={isUploadingImage}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (bannerFileInputRef.current) {
                        bannerFileInputRef.current.click();
                      }
                    }}
                  >
                    Choose Image
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleUploadBannerImage}
                    className="flex-1"
                    disabled={
                      !isImageSelected || isUploadingImage || !bannerImageFile
                    }
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                {/* Also allow URL input as fallback */}
                <div className="space-y-2">
                  <Label htmlFor="banner_image_url">Or enter image URL</Label>
                  <Input
                    id="banner_image_url"
                    value={formData.banner_image_link || ""}
                    onChange={(e) =>
                      handleInputChange("banner_image_link", e.target.value)
                    }
                    placeholder="Enter banner image URL (optional)"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category || ""}
                onChange={(e) => handleInputChange("category", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Address Fields - Rearranged: Address, Country, State, City, Postal Code */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country || ""}
                onValueChange={(value) => {
                  handleInputChange("country", value);
                  handleInputChange("state", "");
                  handleInputChange("city", "");
                }}
                disabled={isLoadingCountries}
              >
                <SelectTrigger id="country">
                  <SelectValue
                    placeholder={
                      isLoadingCountries ? "Loading..." : "Select country"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select
                value={formData.state || ""}
                onValueChange={(value) => {
                  handleInputChange("state", value);
                  handleInputChange("city", "");
                }}
                disabled={!formData.country || isLoadingStates}
              >
                <SelectTrigger id="state">
                  <SelectValue
                    placeholder={
                      !formData.country
                        ? "Select country first"
                        : isLoadingStates
                        ? "Loading..."
                        : "Select state"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Select
                value={formData.city || ""}
                onValueChange={(value) => handleInputChange("city", value)}
                disabled={!formData.state || isLoadingCities}
              >
                <SelectTrigger id="city">
                  <SelectValue
                    placeholder={
                      !formData.state
                        ? "Select state first"
                        : isLoadingCities
                        ? "Loading..."
                        : "Select city"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              value={formData.postal_code || ""}
              onChange={(e) => handleInputChange("postal_code", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number || ""}
                onChange={(e) =>
                  handleInputChange("phone_number", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ""}
                onChange={(e) => handleInputChange("website", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                value={formData.rating || 0}
                onChange={(e) =>
                  handleInputChange("rating", parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avg_price">Average Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="avg_price"
                  type="text"
                  value={priceInputValue}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onBlur={handlePriceBlur}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visible">Visible</Label>
            <Select
              value={
                formData.visible === false
                  ? "hidden"
                  : formData.visible === true
                  ? "visible"
                  : "not_set"
              }
              onValueChange={(value) => {
                if (value === "visible") {
                  handleInputChange("visible", true);
                } else if (value === "hidden") {
                  handleInputChange("visible", false);
                } else {
                  handleInputChange("visible", undefined);
                }
              }}
            >
              <SelectTrigger id="visible">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="not_set">Not Set</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.amenities?.map((amenity, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add amenity"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAmenity();
                  }
                }}
              />
              <Button
                className="border-[#D3D5D9]"
                type="button"
                onClick={addAmenity}
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button
                className="border-[#D3D5D9]"
                type="button"
                onClick={addTag}
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Operating Hours</Label>
              {hoursData.length > 0 && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    className="w-32 h-8 text-sm"
                    value={hoursData[0]?.open || "09:00"}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleApplyToAllDays(
                          e.target.value,
                          hoursData[0]?.close || "17:00"
                        );
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    className="w-32 h-8 text-sm"
                    value={hoursData[0]?.close || "17:00"}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleApplyToAllDays(
                          hoursData[0]?.open || "09:00",
                          e.target.value
                        );
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[#D3D5D9] text-xs h-8"
                    onClick={() => {
                      const open = hoursData[0]?.open || "09:00";
                      const close = hoursData[0]?.close || "17:00";
                      handleApplyToAllDays(open, close);
                    }}
                  >
                    Apply to All
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2 border border-border rounded-lg p-4 bg-card">
              {hoursData.map((dayHours, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 py-2 border-b border-border last:border-b-0"
                >
                  <div className="w-24 text-sm font-medium">{dayHours.day}</div>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={dayHours.open || ""}
                      onChange={(e) =>
                        handleHoursChange(index, "open", e.target.value)
                      }
                      disabled={dayHours.closed}
                      className="w-32 h-9 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={dayHours.close || ""}
                      onChange={(e) =>
                        handleHoursChange(index, "close", e.target.value)
                      }
                      disabled={dayHours.closed}
                      className="w-32 h-9 text-sm"
                    />
                    <div className="flex items-center gap-2 ml-auto">
                      <Checkbox
                        id={`closed-${index}`}
                        checked={dayHours.closed || false}
                        onCheckedChange={(checked) =>
                          handleHoursChange(index, "closed", checked === true)
                        }
                      />
                      <Label
                        htmlFor={`closed-${index}`}
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Closed
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="border-[#D3D5D9]"
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Place"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
