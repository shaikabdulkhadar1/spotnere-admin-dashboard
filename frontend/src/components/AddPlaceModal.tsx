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
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BannerImageUpload } from "@/components/BannerImageUpload";
import { getCategoryNames, getSubCategories } from "@/lib/categories";
import { Country, State, City } from "country-state-city";

const API_URL = import.meta.env.VITE_API_URL;

interface Place {
  id: string;
  name: string;
  category: string;
  sub_category?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  avg_price?: number;
  review_count?: number;
  visible?: boolean;
  banner_image_link?: string;
  latitude?: number;
  longitude?: number;
  hours?: any[];
  amenities?: string[];
  website?: string;
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
}

interface AddPlaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaceCreated?: () => void; // Callback when a place is successfully created
}

export function AddPlaceModal({
  open,
  onOpenChange,
  onPlaceCreated,
}: AddPlaceModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Place>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [newAmenity, setNewAmenity] = useState("");
  const [createdPlaceId, setCreatedPlaceId] = useState<string | null>(null);

  // Location dropdown states
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [priceInputValue, setPriceInputValue] = useState<string>("");

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
      setStates([]);
      setCities([]);
      setPriceInputValue("");
      setHoursData([...defaultDays]);
      setCreatedPlaceId(null);
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
      const allCountries = Country.getAllCountries();
      const countryNames = allCountries.map((country) => country.name).sort();
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
      // Find the country ISO code from the country name
      const countryData = Country.getAllCountries().find(
        (c) => c.name === country
      );
      
      if (!countryData) {
        throw new Error(`Country "${country}" not found`);
      }

      const allStates = State.getStatesOfCountry(countryData.isoCode);
      const stateNames = allStates.map((state) => state.name).sort();
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
      // Find the country ISO code from the country name
      const countryData = Country.getAllCountries().find(
        (c) => c.name === country
      );
      
      if (!countryData) {
        throw new Error(`Country "${country}" not found`);
      }

      // Find the state ISO code from the state name
      const allStates = State.getStatesOfCountry(countryData.isoCode);
      const stateData = allStates.find((s) => s.name === state);
      
      if (!stateData) {
        throw new Error(`State "${state}" not found`);
      }

      const allCities = City.getCitiesOfState(
        countryData.isoCode,
        stateData.isoCode
      );
      const cityNames = allCities.map((city) => city.name).sort();
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

  const handleArrayFieldChange = (field: "amenities", value: string[]) => {
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
    // Validate required fields before saving
    const missingFields: string[] = [];

    if (!formData.name || !formData.name.toString().trim()) {
      missingFields.push("Name");
    }
    if (!formData.category || !formData.category.toString().trim()) {
      missingFields.push("Category");
    }
    if (!formData.sub_category || !formData.sub_category.toString().trim()) {
      missingFields.push("Sub Category");
    }
    if (!formData.description || !formData.description.toString().trim()) {
      missingFields.push("Description");
    }
    if (!formData.address || !formData.address.toString().trim()) {
      missingFields.push("Address");
    }
    if (!formData.country || !formData.country.toString().trim()) {
      missingFields.push("Country");
    }
    if (!formData.state || !formData.state.toString().trim()) {
      missingFields.push("State");
    }
    if (!formData.city || !formData.city.toString().trim()) {
      missingFields.push("City");
    }
    if (!formData.phone_number || !formData.phone_number.toString().trim()) {
      missingFields.push("Phone Number");
    }
    if (!formData.website || !formData.website.toString().trim()) {
      missingFields.push("Website");
    }

    const avgPriceValue =
      formData.avg_price !== undefined ? Number(formData.avg_price) : NaN;
    if (!priceInputValue || isNaN(avgPriceValue) || avgPriceValue <= 0) {
      missingFields.push("Average Price");
    }

    if (formData.visible === undefined) {
      missingFields.push("Visible");
    }

    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
      });
      return;
    }

    try {
      setIsSaving(true);

      // Prepare create data
      const createData: any = { ...formData };

      // Hours data is already in the correct format
      if (hoursData && hoursData.length > 0) {
        createData.hours = hoursData;
      }

      // Convert string numbers to proper types
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
          description:
            "Place created successfully! You can now upload a banner image.",
        });
        // Call the callback to notify parent that a place was created
        if (onPlaceCreated) {
          onPlaceCreated();
        }
        // Don't reload - stay in modal to allow image upload
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

  // Banner image handlers (after place creation)
  const handleBannerImageUploaded = useCallback(
    async (imageUrl: string) => {
      if (!createdPlaceId) {
        return;
      }

      try {
        // First, fetch the current place data to ensure we update the existing record
        const accessToken = localStorage.getItem("access_token");

        // Fetch current place data
        const getResponse = await fetch(
          `${API_URL}/api/places/${createdPlaceId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!getResponse.ok) {
          throw new Error("Failed to fetch place data");
        }

        const currentPlace = await getResponse.json();
        console.log("[AddPlaceModal] Current place data:", currentPlace);

        // Update only the banner_image_link field
        const placeToUpdate = {
          ...currentPlace,
          banner_image_link: imageUrl,
        };
        console.log("[AddPlaceModal] Updating place with:", placeToUpdate);

        // Update the place record with the image URL
        const response = await fetch(
          `${API_URL}/api/places/${createdPlaceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(placeToUpdate),
          }
        );

        if (response.ok) {
          const updatedPlaceResponse = await response.json();
          console.log(
            "[AddPlaceModal] Place updated successfully:",
            updatedPlaceResponse
          );
          setFormData(updatedPlaceResponse);
          toast({
            title: "Success",
            description: "Banner image uploaded and place updated successfully",
          });
        } else {
          const errorData = await response.json().catch(() => ({
            detail: "Failed to update place with image URL",
          }));
          toast({
            variant: "destructive",
            title: "Error",
            description:
              errorData.detail || "Failed to update place with image URL",
          });
        }
      } catch (error) {
        console.error("Error updating place with image URL:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while updating place with image URL",
        });
      }
    },
    [createdPlaceId, formData, toast]
  );

  const handleBannerImageRemoved = useCallback(async () => {
    if (!createdPlaceId) {
      return;
    }

    try {
      // Update the place record to remove the image URL
      const accessToken = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/places/${createdPlaceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          banner_image_link: null,
        }),
      });

      if (response.ok) {
        const updatedPlace = await response.json();
        setFormData(updatedPlace);
        toast({
          title: "Success",
          description: "Banner image removed successfully",
        });
      } else {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to remove image from place",
        }));
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.detail || "Failed to remove image from place",
        });
      }
    } catch (error) {
      console.error("Error removing image from place:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while removing image from place",
      });
    }
  }, [createdPlaceId, formData, toast]);

  const handleClose = () => {
    onOpenChange(false);
    setFormData({});
    setNewAmenity("");
    setHoursData([...defaultDays]);
    setCreatedPlaceId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-[#F4F5F5] overflow-y-auto">
        <DialogHeader className="pt-4">
          <DialogTitle>
            {createdPlaceId ? "Upload Banner Image" : "Add New Place"}
          </DialogTitle>
          <DialogDescription>
            {createdPlaceId
              ? "Upload a banner image for the newly created place"
              : "Enter all details for the new place"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Banner Image Upload - Only shown after place is created */}
          {createdPlaceId ? (
            <BannerImageUpload
              placeId={createdPlaceId}
              initialImageUrl={formData.banner_image_link}
              onImageUploaded={handleBannerImageUploaded}
              onImageRemoved={handleBannerImageRemoved}
            />
          ) : (
            <>
              {/* All form fields - Only shown before place creation */}
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
                  <Select
                    value={formData.category || ""}
                    onValueChange={(value) => {
                      handleInputChange("category", value);
                      // Reset sub_category when category changes
                      handleInputChange("sub_category", "");
                    }}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCategoryNames().map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sub_category">Sub Category</Label>
                <Select
                  value={formData.sub_category || ""}
                  onValueChange={(value) =>
                    handleInputChange("sub_category", value)
                  }
                  disabled={!formData.category}
                >
                  <SelectTrigger id="sub_category">
                    <SelectValue
                      placeholder={
                        formData.category
                          ? "Select sub category"
                          : "Select category first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category &&
                      getSubCategories(formData.category).map((subCategory) => (
                        <SelectItem key={subCategory} value={subCategory}>
                          {subCategory}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                        <span className="text-sm text-muted-foreground">
                          to
                        </span>
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
                              handleHoursChange(
                                index,
                                "closed",
                                checked === true
                              )
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
            </>
          )}
        </div>

        <DialogFooter>
          {createdPlaceId ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
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
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
