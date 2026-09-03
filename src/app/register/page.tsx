"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useState } from "react";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/app/lib/api";
import { AuthThemeToggle } from "@/app/components/ThemeToggle";
import { publicUrl } from "@/lib/basePath";
import { Address } from "@/store/types/address";
import { getAddress } from "@/services/address";

const MapBase = dynamic(() => import("@/app/components/MapBase"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
      Loading map...
    </div>
  ),
});

export default function RegisterPage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [formdata, setFormdata] = useState({
    name: "",
    contactNumber: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500";
  const disabledInputClass =
    "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (address) {
      setAddress({ ...address, [e.target.name]: e.target.value } as Address);
    }
  };

  const handleGetAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const addressData = await getAddress({ lat, lng });
      if (addressData) {
        setAddress(addressData);
      } else {
        toast.error("Failed to fetch address. Please try selecting the location again.");
      }
    } catch {
      toast.error("Failed to fetch address. Please try selecting the location again.");
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!formdata.name || !formdata.contactNumber || !formdata.email || !formdata.password) {
      toast.error("Please fill in name, contact number, email, and password");
      return;
    }
    if (!location) {
      toast.error("Please select a location on the map");
      return;
    }
    if (!address || !address.formatted || !address.state || !address.city || !address.pincode) {
      toast.error("Please ensure address is properly loaded from the map");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        API_ENDPOINTS.REGISTER,
        {
          name: formdata.name,
          contactNumber: formdata.contactNumber,
          email: formdata.email.trim(),
          password: formdata.password,
          location: { lat: location.lat, lng: location.lng },
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

      if (response.data.success) {
        setSubmitted(true);
        toast.success("Registration submitted. Waiting for Super Admin approval.");
      } else {
        toast.error(response.data.message || "Registration failed");
      }
    } catch (error: unknown) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Error submitting registration. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#f5f7fb] text-slate-950 dark:bg-zinc-950 dark:text-white">
      <AuthThemeToggle />
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 pb-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/login" className="inline-flex rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
            <Image src={publicUrl("/shopzo_logo.png")} alt="Shopzo" width={112} height={42} priority />
          </Link>
          <Link href="/login" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
            Sign in
          </Link>
        </div>

        {submitted ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-900">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              Request sent
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Waiting for approval</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-zinc-400">
              Super Admin will review your vendor account. You can sign in after approval.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white to-emerald-50/70 px-6 py-6 shadow-sm dark:border-zinc-800 dark:from-zinc-900/70 dark:to-zinc-900/30">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Register as vendor</h1>
              <p className="mt-2 max-w-3xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-zinc-400">
                Pin your location on the map. Address is filled from reverse geocoding. Login stays locked until Super
                Admin approves.
              </p>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.12)] dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <h2 className="text-base font-semibold">Select location</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    Click the map, search, or use your location. Latitude and longitude are required.
                  </p>
                </div>
                <div className="relative h-[500px] w-full">
                  <MapBase
                    onLocationSelect={(lat, lng) => {
                      setLocation({ lat, lng });
                      handleGetAddress(lat, lng);
                    }}
                  />
                </div>
                {location ? (
                  <div className="border-t border-slate-200/80 bg-emerald-50/70 px-6 py-3 dark:border-zinc-800 dark:bg-emerald-950/30">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                      Location selected:{" "}
                      <span className="font-medium">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="border-t border-amber-200/80 bg-amber-50 px-6 py-3 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    Map pin is required. Click the map to set lat/lng.
                  </div>
                )}
                <div className="border-t border-slate-200/80 bg-slate-50/70 px-6 py-2.5 text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  Tip: dropping a pin reverse-geocodes city, state, pincode, and full address.
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.12)] dark:border-zinc-800 dark:bg-zinc-900 xl:sticky xl:top-6">
                <div className="border-b border-slate-200/80 bg-slate-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <h2 className="text-base font-semibold">Vendor details</h2>
                </div>

                {isLoadingAddress ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-zinc-900/95">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                      <p className="text-sm font-semibold">Fetching address details...</p>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-5 p-6 md:p-7">
                  <Field label="Business name" required name="name" value={formdata.name} onChange={handleChange} className={inputClass} />
                  <Field
                    label="Contact number"
                    required
                    name="contactNumber"
                    value={formdata.contactNumber}
                    onChange={handleChange}
                    className={inputClass}
                    maxLength={10}
                    placeholder="10 digit mobile number"
                  />
                  <Field
                    label="Email"
                    required
                    name="email"
                    type="email"
                    value={formdata.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="you@vendor.com"
                  />
                  <Field
                    label="Password"
                    required
                    name="password"
                    type="password"
                    value={formdata.password}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Set vendor login password"
                  />
                  <Field
                    label="Landmark"
                    name="landmark"
                    value={address?.landmark || ""}
                    onChange={handleAddressChange}
                    className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                    disabled={isLoadingAddress}
                    placeholder="e.g., Near Metro Station"
                    required={false}
                  />

                  <div className="border-t border-slate-200/80 pt-5 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold">Address details</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Auto-filled from selected map pin</p>
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
                        isLoadingAddress
                          ? disabledInputClass
                          : "border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                      }`}
                      placeholder="Address will be auto-filled"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Area/Neighbourhood"
                      name="area"
                      value={address?.area || ""}
                      onChange={handleAddressChange}
                      className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                      disabled={isLoadingAddress}
                      required={false}
                    />
                    <Field
                      label="City"
                      required
                      name="city"
                      value={address?.city || ""}
                      onChange={handleAddressChange}
                      className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                      disabled={isLoadingAddress}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="State"
                      required
                      name="state"
                      value={address?.state || ""}
                      onChange={handleAddressChange}
                      className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                      disabled={isLoadingAddress}
                    />
                    <Field
                      label="Pincode"
                      required
                      name="pincode"
                      value={address?.pincode || ""}
                      onChange={handleAddressChange}
                      className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                      disabled={isLoadingAddress}
                    />
                  </div>
                  <Field
                    label="Country"
                    name="country"
                    value={address?.country || ""}
                    onChange={handleAddressChange}
                    className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                    disabled={isLoadingAddress}
                    required={false}
                  />

                  <div className="flex justify-end gap-3 border-t border-slate-200/80 pt-6 dark:border-zinc-800">
                    <Link
                      href="/login"
                      className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      Cancel
                    </Link>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={`inline-flex h-10 min-w-36 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white ${
                        isSubmitting ? "cursor-not-allowed bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {isSubmitting ? "Submitting..." : "Submit for approval"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  className,
  type = "text",
  required = true,
  disabled,
  maxLength,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  className: string;
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
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}
