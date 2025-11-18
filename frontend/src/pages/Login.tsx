import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Building2,
  Globe,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const COUNTRIES_API = import.meta.env.VITE_COUNTRIES_API;

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

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [customState, setCustomState] = useState<string>("");
  const [customCity, setCustomCity] = useState<string>("");

  // API data states
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Cache for states and cities to avoid refetching
  const [statesCache, setStatesCache] = useState<Record<string, string[]>>({});
  const [citiesCache, setCitiesCache] = useState<Record<string, string[]>>({});

  // Fetch countries on component mount (when signup tab is active)
  useEffect(() => {
    if (activeTab === "signup" && countries.length === 0) {
      fetchCountries();
    }
  }, [activeTab]);

  // Fetch states when country is selected
  useEffect(() => {
    if (selectedCountry && selectedCountry !== "Other") {
      // Check cache first
      const cacheKey = selectedCountry;
      if (statesCache[cacheKey]) {
        setStates(statesCache[cacheKey]);
      } else {
        fetchStates(selectedCountry);
      }
    } else {
      setStates([]);
      setCities([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  // Fetch cities when state is selected
  useEffect(() => {
    if (
      selectedState &&
      selectedState !== "Other" &&
      selectedCountry &&
      selectedCountry !== "Other"
    ) {
      // Check cache first
      const cacheKey = `${selectedCountry}-${selectedState}`;
      if (citiesCache[cacheKey]) {
        setCities(citiesCache[cacheKey]);
      } else {
        fetchCities(selectedCountry, selectedState);
      }
    } else {
      setCities([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedCountry]);

  // Reset state and city when country changes
  useEffect(() => {
    if (selectedCountry) {
      setSelectedState("");
      setSelectedCity("");
      setCustomState("");
      setCustomCity("");
    }
  }, [selectedCountry]);

  // Reset city when state changes
  useEffect(() => {
    if (selectedState) {
      setSelectedCity("");
      setCustomCity("");
    }
  }, [selectedState]);

  // Reset custom state when state changes from Other
  useEffect(() => {
    if (selectedState !== "Other") {
      setCustomState("");
    }
  }, [selectedState]);

  // Reset custom city when city changes from Other
  useEffect(() => {
    if (selectedCity !== "Other") {
      setCustomCity("");
    }
  }, [selectedCity]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [navigate]);

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
      setCountries([...countryNames, "Other"]);
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
      const statesList = [...stateNames, "Other"];
      setStates(statesList);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load states",
        variant: "destructive",
      });
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
        body: JSON.stringify({ country: country, state: state }),
      });

      const data: CitiesResponse = await response.json();

      if (data.error) {
        throw new Error(data.msg || "Failed to fetch cities");
      }

      if (!Array.isArray(data.data)) {
        throw new Error("Invalid cities data format");
      }

      const cityNames = data.data;
      const citiesList = [...cityNames, "Other"];
      setCities(citiesList);
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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("login-email") as string;
    const password = formData.get("login-password") as string;

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      if (data.success) {
        // Store authentication data
        localStorage.setItem("isAuthenticated", "true");
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        // Dispatch custom event to trigger context refetch
        window.dispatchEvent(new Event("auth-state-changed"));

        toast({
          title: "Success",
          description: "Login successful",
        });

        navigate("/dashboard");
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during login";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("signup-password") as string;
    const confirmPassword = formData.get("signup-confirm-password") as string;

    // Validate password match
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate location fields
    const finalState = selectedState === "Other" ? customState : selectedState;
    const finalCity = selectedCity === "Other" ? customCity : selectedCity;

    if (!selectedCountry || !finalState || !finalCity) {
      toast({
        title: "Error",
        description: "Please select country, state, and city",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const signupData = {
      first_name: formData.get("signup-first-name") as string,
      last_name: formData.get("signup-last-name") as string,
      email: formData.get("signup-email") as string,
      phone_number: formData.get("signup-phone") as string,
      password: password,
      address: formData.get("signup-address") as string,
      city: finalCity,
      state: finalState,
      country: selectedCountry,
      postal_code: formData.get("signup-postal-code") as string,
    };

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Signup failed");
      }

      if (data.success) {
        // Store authentication data
        localStorage.setItem("isAuthenticated", "true");
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        // Dispatch custom event to trigger context refetch
        window.dispatchEvent(new Event("auth-state-changed"));

        toast({
          title: "Success",
          description: data.message || "Account created successfully",
        });

        navigate("/dashboard");
      } else {
        throw new Error(data.message || "Signup failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during signup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F5F5]">
      <div
        className={`w-full glass-card transition-all duration-500 ease-in-out ${
          activeTab === "signup" ? "max-w-4xl" : "max-w-md"
        }`}
      >
        {/* Logo and Title */}
        <div className="text-center pt-4">
          <div className="flex items-center justify-center gap-3">
            <div
              className={`rounded-lg flex items-center justify-center transition-all duration-500 ${
                activeTab === "signup" ? "w-32 h-32" : "w-48 h-48"
              }`}
            >
              <img
                src="/full_logo.png"
                alt="Spotnere"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <p className="text-xl font-semibold text-muted-foreground">
            Admin Panel
          </p>
        </div>

        {/* Login/Signup Card */}
        <div
          className={`transition-all duration-500 ${
            activeTab === "signup" ? "p-8" : "p-12"
          }`}
        >
          <Tabs
            defaultValue="login"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      name="login-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      name="login-password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-muted-foreground">Remember me</span>
                  </label>
                  <a href="#" className="text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-black text-white hover:bg-gray-900"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-first-name">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-first-name"
                          name="signup-first-name"
                          type="text"
                          placeholder="First name"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-last-name">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-last-name"
                          name="signup-last-name"
                          type="text"
                          placeholder="Last name"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          name="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          name="signup-phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          name="signup-password"
                          type="password"
                          placeholder="Create a password"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          name="signup-confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-address">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                        <Input
                          id="signup-address"
                          name="signup-address"
                          type="text"
                          placeholder="Enter your address"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-country">Country</Label>
                      <Select
                        value={selectedCountry}
                        onValueChange={setSelectedCountry}
                        disabled={isLoadingCountries}
                        required
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue
                            placeholder={
                              isLoadingCountries
                                ? "Loading countries..."
                                : "Select country"
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
                      <Label htmlFor="signup-state">State</Label>
                      <Select
                        value={selectedState}
                        onValueChange={setSelectedState}
                        disabled={
                          !selectedCountry ||
                          selectedCountry === "Other" ||
                          isLoadingStates
                        }
                        required
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue
                            placeholder={
                              isLoadingStates
                                ? "Loading states..."
                                : "Select state/province"
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
                      {selectedState === "Other" && (
                        <Input
                          id="signup-custom-state"
                          name="signup-custom-state"
                          type="text"
                          placeholder="Enter state/province name"
                          className="h-12"
                          value={customState}
                          onChange={(e) => setCustomState(e.target.value)}
                          required
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-city">City</Label>
                      <Select
                        value={selectedCity}
                        onValueChange={setSelectedCity}
                        disabled={
                          !selectedState ||
                          selectedState === "Other" ||
                          isLoadingCities
                        }
                        required
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue
                            placeholder={
                              isLoadingCities
                                ? "Loading cities..."
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
                      {selectedCity === "Other" && (
                        <Input
                          id="signup-custom-city"
                          name="signup-custom-city"
                          type="text"
                          placeholder="Enter city name"
                          className="h-12"
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          required
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-postal-code">Postal Code</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                        <Input
                          id="signup-postal-code"
                          name="signup-postal-code"
                          type="text"
                          placeholder="Postal code"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm pt-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded mt-1" required />
                    <span className="text-muted-foreground">
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-black text-white hover:bg-gray-900 mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mb-6">
          © 2024 Spotnere. All rights reserved.
        </p>
      </div>
    </div>
  );
}
