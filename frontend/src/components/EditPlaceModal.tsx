import { useEffect, useState } from "react";
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
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface EditPlaceModalProps {
  placeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlaceModal({
  placeId,
  open,
  onOpenChange,
}: EditPlaceModalProps) {
  const { toast } = useToast();
  const [placeDetails, setPlaceDetails] = useState<Place | null>(null);
  const [formData, setFormData] = useState<Partial<Place>>({});
  const [isLoadingPlaceDetails, setIsLoadingPlaceDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newAmenity, setNewAmenity] = useState("");
  const [newTag, setNewTag] = useState("");

  // Location dropdown states
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [priceInputValue, setPriceInputValue] = useState<string>("");
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(
    null
  );
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);

  // Hours state - structured format
  interface DayHours {
    day: string;
    open: string;
    close: string;
    closed?: boolean;
  }

  const [hoursData, setHoursData] = useState<DayHours[]>([]);

  // Fetch place details when modal opens
  useEffect(() => {
    if (open && placeId) {
      setIsLoadingPlaceDetails(true);
      const fetchPlaceDetails = async () => {
        try {
          const accessToken = localStorage.getItem("access_token");
          const response = await fetch(`${API_URL}/api/places/${placeId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            setPlaceDetails(data);
            setFormData(data); // Initialize form data
            // Initialize price input value
            if (data.avg_price !== undefined && data.avg_price !== null) {
              setPriceInputValue(data.avg_price.toFixed(2));
            } else {
              setPriceInputValue("");
            }
            // Initialize banner image preview
            if (data.banner_image_link) {
              setBannerImagePreview(data.banner_image_link);
            } else {
              setBannerImagePreview(null);
            }
            setBannerImageFile(null);
            // Initialize hours data
            if (
              data.hours &&
              Array.isArray(data.hours) &&
              data.hours.length > 0
            ) {
              setHoursData(data.hours as DayHours[]);
            } else {
              // Initialize with default days
              const defaultDays: DayHours[] = [
                { day: "Monday", open: "09:00", close: "17:00", closed: false },
                {
                  day: "Tuesday",
                  open: "09:00",
                  close: "17:00",
                  closed: false,
                },
                {
                  day: "Wednesday",
                  open: "09:00",
                  close: "17:00",
                  closed: false,
                },
                {
                  day: "Thursday",
                  open: "09:00",
                  close: "17:00",
                  closed: false,
                },
                { day: "Friday", open: "09:00", close: "17:00", closed: false },
                {
                  day: "Saturday",
                  open: "09:00",
                  close: "17:00",
                  closed: false,
                },
                { day: "Sunday", open: "09:00", close: "17:00", closed: false },
              ];
              setHoursData(defaultDays);
            }
          } else {
            const errorData = await response.json().catch(() => ({
              detail: "Failed to fetch place details",
            }));
            toast({
              variant: "destructive",
              title: "Error",
              description: errorData.detail || "Failed to load place details",
            });
            onOpenChange(false);
          }
        } catch (error) {
          console.error("Error fetching place details:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "An error occurred while loading place details",
          });
          onOpenChange(false);
        } finally {
          setIsLoadingPlaceDetails(false);
        }
      };

      fetchPlaceDetails();
    } else {
      // Reset when modal closes
      setPlaceDetails(null);
      setFormData({});
      setNewAmenity("");
      setNewTag("");
      setStates([]);
      setCities([]);
      setPriceInputValue("");
      setBannerImagePreview(null);
      setBannerImageFile(null);
      setHoursData([]);
    }
  }, [open, placeId, onOpenChange, toast]);

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

  const handleInputChange = (
    field: keyof Place,
    value: string | number | boolean | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle price input change
  const handlePriceChange = (value: string) => {
    // Update the input value state for display
    setPriceInputValue(value);

    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, "");

    // Allow empty string
    if (cleaned === "") {
      handleInputChange("avg_price", undefined);
      return;
    }

    // Prevent multiple decimal points
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return; // Invalid input, don't update
    }

    // Parse the value
    const numValue = parseFloat(cleaned);

    // Only update if it's a valid number
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
      // Update form data
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
    if (!placeId) return;

    try {
      setIsSaving(true);

      // Prepare update data
      const updateData: any = { ...formData };

      // Hours data is already in the correct format
      if (hoursData && hoursData.length > 0) {
        updateData.hours = hoursData;
      }

      // Convert string numbers to proper types
      if (updateData.rating !== undefined) {
        updateData.rating = parseFloat(String(updateData.rating)) || 0;
      }
      if (updateData.avg_price !== undefined) {
        updateData.avg_price = parseFloat(String(updateData.avg_price)) || 0;
      }

      // Set updated_at to current timestamp
      updateData.updated_at = new Date().toISOString();

      const accessToken = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/places/${placeId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedPlace = await response.json();
        setPlaceDetails(updatedPlace);
        setFormData(updatedPlace);
        toast({
          title: "Success",
          description: "Place details updated successfully",
        });
        // Refresh the page to update the listing
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to update place",
        }));
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.detail || "Failed to update place details",
        });
      }
    } catch (error) {
      console.error("Error updating place:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating place details",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: "Please select an image file",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Image must be less than 5MB",
        });
        return;
      }

      setBannerImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImagePreview(reader.result as string);
        // Store base64 in form data
        handleInputChange("banner_image_link", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBannerImage = () => {
    setBannerImageFile(null);
    setBannerImagePreview(null);
    handleInputChange("banner_image_link", "");
  };

  const handleClose = () => {
    onOpenChange(false);
    setPlaceDetails(null);
    setFormData({});
    setNewAmenity("");
    setNewTag("");
    setBannerImagePreview(null);
    setBannerImageFile(null);
    setHoursData([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-[#F4F5F5] overflow-y-auto">
        <DialogHeader className="pt-4">
          <DialogTitle>Edit Place Details</DialogTitle>
          <DialogDescription>
            View and edit all details for this place
          </DialogDescription>
        </DialogHeader>

        {isLoadingPlaceDetails ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading place details...
            </span>
          </div>
        ) : formData ? (
          <div className="grid gap-4 py-4">
            {/* Banner Image Upload - Moved to top */}
            <div className="space-y-2">
              <Label htmlFor="banner_image">Banner Image</Label>
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
                  <Input
                    id="banner_image"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("banner_image")?.click()
                    }
                    className="w-full border-[#D3D5D9]"
                  >
                    {bannerImagePreview ? "Change Image" : "Upload Image"}
                  </Button>
                </div>
              </div>
            </div>

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
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
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
                    // Reset state and city when country changes
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
                    // Reset city when state changes
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
                onChange={(e) =>
                  handleInputChange("postal_code", e.target.value)
                }
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
                    <div className="w-24 text-sm font-medium">
                      {dayHours.day}
                    </div>
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
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No place details available
          </div>
        )}

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
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
