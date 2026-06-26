"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { API_ENDPOINTS } from "@/app/lib/api";
import { RootState } from "@/store";
import { setVendor } from "@/store/slices/authSlice";
import ThemeToggleButton from "@/app/components/ThemeToggleButton";
import { publicUrl } from "@/lib/basePath";

const LoginPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const vendor = useSelector((state: RootState) => state.auth.vendor);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (vendor) router.push("/Dashboard");
  }, [vendor, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(API_ENDPOINTS.LOGIN, formData, { withCredentials: true });

      if (!res.data.success) {
        setError(res.data.message || "Login failed");
        return;
      }

      if (res.data.vendor) {
        dispatch(setVendor(res.data.vendor));
      }
      router.push("/Dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_40%_at_20%_15%,rgba(245,158,11,0.12),transparent),radial-gradient(ellipse_42%_34%_at_85%_90%,rgba(14,165,233,0.08),transparent)] dark:bg-[radial-gradient(ellipse_58%_40%_at_20%_15%,rgba(245,158,11,0.1),transparent),radial-gradient(ellipse_42%_34%_at_85%_90%,rgba(14,165,233,0.06),transparent)]"
        aria-hidden
      />

      <ThemeToggleButton
        className={[
          "fixed right-4 top-4 z-20 rounded-full border p-2.5 shadow-sm backdrop-blur-sm",
          "border-slate-200/90 bg-white/95 text-slate-600 hover:bg-slate-50",
          "dark:border-slate-700/80 dark:bg-slate-900/95 dark:text-amber-200/90 dark:hover:bg-slate-800/95",
        ].join(" ")}
      />

      <div className="relative z-[1] grid min-h-dvh grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden border-r border-slate-200/80 bg-white/70 p-12 backdrop-blur lg:flex lg:flex-col lg:justify-between dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">Shopzo Vendor</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight text-slate-900 dark:text-white">
              Sell smarter
              <span className="mt-3 block text-2xl font-medium text-slate-500 dark:text-slate-300">
                with your vendor workspace
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Manage products, stock levels, and inventory transfers from one clean seller dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Seller Console</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Catalog, inventory, and fulfillment tools built for vendor partners.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="w-full max-w-[430px] rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7 dark:border-slate-700/80 dark:bg-slate-900/95">
            <div className="mb-6 flex justify-center">
              <div className="relative h-14 w-[10.5rem] overflow-hidden sm:h-16 sm:w-[12rem]">
                <Image
                  src={publicUrl("/shopzo_logo.png")}
                  alt="Shopzo"
                  fill
                  sizes="(max-width: 640px) 168px, 192px"
                  className="object-contain object-center scale-[1.55] dark:hidden"
                  priority
                />
                <Image
                  src={publicUrl("/shopzo_logo_tp.png")}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 168px, 192px"
                  className="hidden object-contain object-center scale-[1.55] dark:block"
                  priority
                  aria-hidden
                />
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Welcome back
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Sign in</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Vendor email and password</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[0.95rem] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-amber-500/50 dark:focus:ring-amber-500/20"
                  placeholder="you@vendor.com"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-12 text-[0.95rem] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-amber-500/50 dark:focus:ring-amber-500/20"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error ? (
                <div
                  className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-2 focus:ring-offset-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-900"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">Authorized vendor access only.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

export default LoginPage;
