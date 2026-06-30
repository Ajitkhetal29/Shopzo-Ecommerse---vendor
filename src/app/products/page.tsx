"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { setProducts } from "@/store/slices/productSlice";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/app/lib/api";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/store/types/product";
import { vendorCard, vendorPrimaryBtn } from "@/lib/vendor-ui";

const LIMIT = 20;

type CategoryOption = { _id: string; name: string };
type SubcategoryOption = { _id: string; name: string };

export default function ProductsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const vendor = useSelector((state: RootState) => state.auth.vendor);
  const products = useSelector((state: RootState) => state.product.products);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT });

  const fetchProducts = async () => {
    if (!vendor?._id) return;
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(API_ENDPOINTS.GET_PRODUCTS, {
        withCredentials: true,
        params: {
          page: pagination.page,
          limit: pagination.limit,
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || undefined,
        },
      });
      if (res.data.success) {
        dispatch(setProducts(res.data.products ?? []));
        setTotalCount(res.data.totalCount ?? 0);
      }
    } catch (err) {
      setError("Failed to fetch products.");
      toast.error("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axios.get(API_ENDPOINTS.GET_CATEGORIES, { withCredentials: true })
      .then((res) => setCategories(res.data.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      setSubcategoryId("");
      return;
    }
    axios
      .get(`${API_ENDPOINTS.GET_SUBCATEGORIES}?categoryId=${categoryId}`, { withCredentials: true })
      .then((res) => setSubcategories(res.data.subcategories ?? []))
      .catch(() => setSubcategories([]));
    setSubcategoryId("");
  }, [categoryId]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor?._id, pagination.page, pagination.limit, categoryId, subcategoryId]);

  const totalPages = Math.ceil(totalCount / pagination.limit) || 1;

  if (loading && products.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-shop-border bg-shop-surface-raised py-16`}>
        <div className="text-center">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-shop-accent border-t-transparent" />
          <p className="text-sm font-medium text-shop-muted">Loading products…</p>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div
        className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        role="alert"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Products</h1>
            <p className="mt-1 text-sm text-shop-muted">Manage your catalog</p>
          </div>
          <Link href="/products/add" className={vendorPrimaryBtn}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-3 justify-end">
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-xl border border-shop-border bg-shop-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-shop-accent focus:ring-2 focus:ring-shop-accent/10"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            value={subcategoryId}
            onChange={(e) => {
              setSubcategoryId(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-xl border border-shop-border bg-shop-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-shop-accent focus:ring-2 focus:ring-shop-accent/10"
            disabled={!categoryId}
          >
            <option value="">All subcategories</option>
            {subcategories.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        {products.length === 0 ? (
          <div className={`${vendorCard} p-12 text-center`}>
            <h3 className="text-sm font-medium text-foreground">No products</h3>
            <p className="mt-1 text-sm text-shop-muted">Get started by adding a product.</p>
            <Link href="/products/add" className={`mt-6 ${vendorPrimaryBtn}`}>
              Add Product
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((p: Product) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => router.push(`/products/${p._id}`)}
                  className="group overflow-hidden rounded-2xl border border-shop-border bg-shop-surface-raised text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-shop-accent/35 hover:shadow-md"
                >
                  <div className="relative aspect-square overflow-hidden bg-shop-surface">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="truncate font-medium text-foreground group-hover:text-shop-accent">{p.name}</h3>
                    <p className="mt-0.5 text-xs text-shop-muted">
                      {p.category?.name}
                      {p.subcategory ? ` · ${p.subcategory.name}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="rounded-full border border-shop-border px-4 py-2 text-sm font-medium text-foreground transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:enabled:hover:bg-neutral-800"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm">Page {pagination.page} of {totalPages}</span>
                <button
                  type="button"
                  disabled={pagination.page >= totalPages || loading}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="rounded-full border border-shop-border px-4 py-2 text-sm font-medium text-foreground transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:enabled:hover:bg-neutral-800"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
    </div>
  );
}