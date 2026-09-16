"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/app/lib/api";
import { getAddress } from "@/services/address";
import { vendorPageHeader, vendorSubtitle, vendorTitle } from "@/lib/vendor-ui";
import type { AppDispatch, RootState } from "@/store";
import { setVendor } from "@/store/slices/authSlice";
import { Address } from "@/store/types/address";

const MapBase = dynamic(() => import("@/app/components/MapBase"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center bg-shop-surface text-sm text-shop-muted">
      Loading map...
    </div>
  ),
});

const inputClass =
  "h-11 w-full rounded-xl border border-shop-border bg-shop-surface px-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-shop-muted focus:border-shop-accent focus:ring-2 focus:ring-shop-accent/20";
const disabledInputClass =
  "cursor-not-allowed border-shop-border bg-neutral-100 text-shop-muted dark:bg-neutral-800";

export default function EditVendorProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const vendor = useSelector((state: RootState) => state.auth.vendor);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.CURRENT_USER, { withCredentials: true });
        if (!mounted || !res.data?.success || !res.data.vendor) return;
        const next = res.data.vendor;
        dispatch(setVendor(next));
        setName(next.name || "");
        setEmail(next.email || "");
        setContactNumber(next.contactNumber || "");
        if (next.location?.lat !== undefined && next.location?.lng !== undefined) {
          setLocation({ lat: next.location.lat, lng: next.location.lng });
        }
        if (next.address) {
          setAddress({
            formatted: next.address.formatted || next.address.line1 || "",
            city: next.address.city || "",
            state: next.address.state || "",
            pincode: next.address.pincode || "",
            area: next.address.area || "",
            country: next.address.country || "",
            landmark: next.address.landmark || "",
          });
        }
      } catch {
        toast.error("Could not load profile");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  const handleGetAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const addressData = await getAddress({ lat, lng });
      if (addressData) {
        setAddress({
          ...addressData,
          landmark: address?.landmark || addressData.landmark || "",
        });
      } else {
        toast.error("Failed to fetch address. Try selecting the location again.");
      }
    } catch {
      toast.error("Failed to fetch address. Try selecting the location again.");
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!address) return;
    setAddress({ ...address, [e.target.name]: e.target.value } as Address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim() || !email.trim() || !contactNumber.trim()) {
      toast.error("Please fill in name, email, and contact number");
      return;
    }
    if (!location) {
      toast.error("Please select a location on the map");
      return;
    }
    if (!address || !address.formatted || !address.state || !address.city || !address.pincode) {
      toast.error("Please ensure address is loaded from the map");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.put(
        API_ENDPOINTS.UPDATE_PROFILE,
        {
          name: name.trim(),
          email: email.trim(),
          contactNumber: contactNumber.trim(),
          location,
          address: {
            formatted: address.formatted,
            line1: address.formatted,
            state: address.state,
            city: address.city,
            pincode: address.pincode,
            area: address.area,
            landmark: address.landmark || undefined,
          },
        },
        { withCredentials: true },
      );

      if (res.data?.success && res.data.vendor) {
        dispatch(setVendor(res.data.vendor));
        toast.success("Profile updated");
        router.push("/profile");
      } else {
        toast.error(res.data?.message || "Failed to update profile");
      }
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !vendor) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-shop-accent border-t-transparent" />
          <p className="text-sm font-medium text-shop-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className={vendorPageHeader}>
        <h1 className={vendorTitle}>Edit profile</h1>
        <p className={vendorSubtitle}>
          Update contact details and pin your pickup location. City, state, and pincode come from the map.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
        <div className="overflow-hidden rounded-3xl border border-shop-border bg-shop-surface-raised shadow-sm">
          <div className="border-b border-shop-border bg-shop-surface px-6 py-4">
            <h2 className="text-base font-semibold">Select location</h2>
            <p className="mt-1 text-xs text-shop-muted">Click the map or search. Latitude and longitude are saved with the address.</p>
          </div>
          <div className="relative h-[500px] w-full">
            <MapBase
              defaultPosition={location ? [location.lat, location.lng] : undefined}
              onLocationSelect={(lat, lng) => {
                setLocation({ lat, lng });
                void handleGetAddress(lat, lng);
              }}
            />
          </div>
          {location ? (
            <div className="border-t border-shop-border bg-emerald-50/70 px-6 py-3 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                Location selected:{" "}
                <span className="font-medium">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              </p>
            </div>
          ) : (
            <div className="border-t border-amber-200/80 bg-amber-50 px-6 py-3 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              Map pin is required.
            </div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-shop-border bg-shop-surface-raised shadow-sm xl:sticky xl:top-20">
          <div className="border-b border-shop-border bg-shop-surface px-6 py-4">
            <h2 className="text-base font-semibold">Vendor details</h2>
          </div>

          {isLoadingAddress ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-shop-surface-raised/95 backdrop-blur-sm">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-shop-accent border-t-transparent" />
                <p className="text-sm font-semibold">Fetching address details...</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-5 p-6 md:p-7">
            <Field label="Business name" value={name} onChange={setName} />
            <Field label="Email" type="email" value={email} onChange={setEmail} />
            <Field
              label="Contact number"
              value={contactNumber}
              onChange={setContactNumber}
              maxLength={10}
              placeholder="10 digit mobile number"
            />
            <Field
              label="Landmark"
              required={false}
              value={address?.landmark || ""}
              onChange={(value) => setAddress((prev) => (prev ? { ...prev, landmark: value } : prev))}
              disabled={isLoadingAddress}
              placeholder="e.g., Near Metro Station"
            />

            <div className="border-t border-shop-border pt-5">
              <h3 className="text-sm font-semibold">Address details</h3>
              <p className="mt-1 text-xs text-shop-muted">Auto-filled from the selected map pin</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Full address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="formatted"
                value={address?.formatted || ""}
                onChange={handleAddressChange}
                rows={3}
                disabled={isLoadingAddress}
                className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm shadow-sm ${
                  isLoadingAddress ? disabledInputClass : inputClass
                }`}
                placeholder="Address will be auto-filled"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Area"
                required={false}
                value={address?.area || ""}
                onChange={(value) => setAddress((prev) => (prev ? { ...prev, area: value } : prev))}
                disabled={isLoadingAddress}
              />
              <Field
                label="City"
                value={address?.city || ""}
                onChange={(value) => setAddress((prev) => (prev ? { ...prev, city: value } : prev))}
                disabled={isLoadingAddress}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="State"
                value={address?.state || ""}
                onChange={(value) => setAddress((prev) => (prev ? { ...prev, state: value } : prev))}
                disabled={isLoadingAddress}
              />
              <Field
                label="Pincode"
                value={address?.pincode || ""}
                onChange={(value) => setAddress((prev) => (prev ? { ...prev, pincode: value } : prev))}
                disabled={isLoadingAddress}
              />
            </div>
            <Field
              label="Country"
              required={false}
              value={address?.country || ""}
              onChange={(value) => setAddress((prev) => (prev ? { ...prev, country: value } : prev))}
              disabled={isLoadingAddress}
            />

            <div className="flex justify-end gap-3 border-t border-shop-border pt-6">
              <Link
                href="/profile"
                className="inline-flex h-10 items-center rounded-xl border border-shop-border px-4 text-sm font-medium text-foreground transition hover:bg-shop-surface"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || isLoadingAddress}
                className={`inline-flex h-10 min-w-36 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white ${
                  isSubmitting || isLoadingAddress
                    ? "cursor-not-allowed bg-neutral-400"
                    : "bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                }`}
              >
                {isSubmitting ? "Saving..." : "Save profile"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  disabled,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`${inputClass} ${disabled ? disabledInputClass : ""}`}
      />
    </div>
  );
}
