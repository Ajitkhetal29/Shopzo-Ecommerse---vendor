"use client";

import { API_ENDPOINTS } from "@/app/lib/api";
import { RootState } from "@/store";
import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

type TransferIssueRow = {
  _id: string;
  transferRequest: string | null;
  transferStatus: string | null;
  fromType: "vendor" | "warehouse" | null;
  fromName: string | null;
  toType: "vendor" | "warehouse" | null;
  toName: string | null;
  sku: string | null;
  issueType: "damaged" | "missing" | "extra";
  issueQuantity: number;
  issueStatus: "pending" | "in_progress" | "resolved";
  issueDescription: string;
  issueImages?: string[];
  issueResolutionType: "return" | "replace" | "adjust" | null;
  issueResolutionDescription: string | null;
  issueResolutionDate: string | null;
  raisedByType: "vendor" | "warehouse";
  raisedByName: string | null;
  createdAt: string;
};

type IssueTab = "all" | "pending" | "in_progress" | "resolved";
type IssueStatus = "pending" | "in_progress" | "resolved";
type IssueResolutionType = "return" | "replace" | "adjust";
type ActorRole = "receiver" | "sender" | "none";

const PAGE_SIZE = 10;

const getActorRole = (
  issue: Pick<TransferIssueRow, "fromType" | "toType">,
  actorType: "warehouse" | "vendor"
): ActorRole => {
  if (issue.toType === actorType) return "receiver";
  if (issue.fromType === actorType) return "sender";
  return "none";
};

const TransferIssuesPage = () => {
  const vendor = useSelector((state: RootState) => state.auth.vendor);
  const [rows, setRows] = useState<TransferIssueRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<IssueTab>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIssue, setSelectedIssue] = useState<TransferIssueRow | null>(null);
  const [statusInput, setStatusInput] = useState<IssueStatus>("pending");
  const [resolutionTypeInput, setResolutionTypeInput] = useState("");
  const [resolutionDescription, setResolutionDescription] = useState("");
  const [allowedResolutionTypes, setAllowedResolutionTypes] = useState<IssueResolutionType[]>([]);
  const [updatingIssue, setUpdatingIssue] = useState(false);
  const [loadingResolutionRules, setLoadingResolutionRules] = useState(false);

  const loadIssues = useCallback(async () => {
    if (!vendor?._id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_ENDPOINTS.GET_TRANSFER_ISSUES, {
        withCredentials: true,
        params: {
          userType: "vendor",
          userId: vendor._id,
          issueStatus: statusTab,
          page,
          limit: PAGE_SIZE,
        },
      });
      if (res.data.success) {
        setRows(res.data.issues ?? []);
        setTotalPages(Math.max(1, Number(res.data.totalPages) || 1));
        setTotalCount(Number(res.data.totalCount) || 0);
      } else {
        setError(res.data.message || "Failed to load transfer issues");
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(e.response?.data?.message || e.message);
      } else {
        setError("Failed to load transfer issues");
      }
    } finally {
      setLoading(false);
    }
  }, [vendor?._id, page, statusTab]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const formatDate = (date?: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
  };

  const openIssueModal = async (issue: TransferIssueRow) => {
    setSelectedIssue(issue);
    setStatusInput(issue.issueStatus);
    setResolutionTypeInput(issue.issueResolutionType || "");
    setResolutionDescription(issue.issueResolutionDescription || "");
    setAllowedResolutionTypes([]);
    setLoadingResolutionRules(true);
    try {
      const res = await axios.get(API_ENDPOINTS.GET_TRANSFER_ISSUE_RESOLUTION_RULES, {
        withCredentials: true,
        params: { issueType: issue.issueType },
      });
      if (res.data.success) {
        setAllowedResolutionTypes(res.data.allowedResolutionTypes ?? []);
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        toast.error(e.response?.data?.message || e.message);
      } else {
        toast.error("Failed to load resolution rules");
      }
    } finally {
      setLoadingResolutionRules(false);
    }
  };

  const closeIssueModal = () => {
    setSelectedIssue(null);
    setResolutionTypeInput("");
    setResolutionDescription("");
    setAllowedResolutionTypes([]);
    setUpdatingIssue(false);
  };

  const handleUpdateIssue = async () => {
    if (!selectedIssue || !vendor?._id) return;
    const actorRole = getActorRole(selectedIssue, "vendor");
    const nextStatus: IssueStatus = actorRole === "sender" ? "in_progress" : statusInput;
    if (actorRole === "none") {
      toast.error("You are not allowed to update this issue");
      return;
    }
    if (actorRole === "receiver" && !["pending", "resolved"].includes(nextStatus)) {
      toast.error("Receiver can only set status to pending or resolved");
      return;
    }
    if (actorRole === "receiver" && nextStatus === "resolved" && !effectiveResolutionType) {
      toast.error("Select resolution type before marking as resolved");
      return;
    }

    setUpdatingIssue(true);
    try {
      const payload: {
        issueId: string;
        newStatus: IssueStatus;
        userType: "vendor";
        userId: string;
        issueResolutionType?: IssueResolutionType;
        issueResolutionDescription?: string;
      } = {
        issueId: selectedIssue._id,
        newStatus: nextStatus,
        userType: "vendor",
        userId: vendor._id,
      };

      if (actorRole === "receiver" && effectiveResolutionType) {
        payload.issueResolutionType = effectiveResolutionType as IssueResolutionType;
      }

      if (nextStatus === "resolved") {
        if (resolutionDescription.trim()) {
          payload.issueResolutionDescription = resolutionDescription.trim();
        }
      }

      const res = await axios.patch(API_ENDPOINTS.UPDATE_TRANSFER_ISSUE_STATUS, payload, {
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success("Issue updated successfully");
        closeIssueModal();
        await loadIssues();
      } else {
        toast.error(res.data.message || "Failed to update issue");
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        toast.error(e.response?.data?.message || e.message);
      } else {
        toast.error("Failed to update issue");
      }
    } finally {
      setUpdatingIssue(false);
    }
  };

  const isResolutionTypeLocked =
    !!selectedIssue?.issueResolutionType ||
    statusInput === "in_progress" ||
    selectedIssue?.toType !== "vendor";

  const actorRoleForSelectedIssue = selectedIssue ? getActorRole(selectedIssue, "vendor") : "none";

  const effectiveResolutionType =
    resolutionTypeInput || selectedIssue?.issueResolutionType || allowedResolutionTypes[0] || "";

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Transfer Issues</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Issues raised on transfer settlement</p>
        </div>

        <div className="mb-6 flex items-center gap-2 overflow-x-auto">
          {(["all", "pending", "in_progress", "resolved"] as IssueTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setStatusTab(tab);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                statusTab === tab
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading && (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-gray-600 dark:text-gray-300">
            Loading transfer issues...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center text-gray-600 dark:text-gray-300">
            No transfer issues found
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">Issue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">Transfer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">Raised At</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {rows.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 capitalize text-gray-900 dark:text-white">{row.issueType}</td>
                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-slate-300">{row.sku || "-"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">{row.issueQuantity}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300">
                      {row.transferRequest ? (
                        <Link className="underline" href={`/TransferInventory/${row.transferRequest}`}>
                          View Transfer
                        </Link>
                      ) : (
                        "-"
                      )}
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {row.fromName || "-"} to {row.toName || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700 dark:text-slate-300">{row.issueStatus}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {row.issueStatus !== "resolved" ? (
                        <button
                          type="button"
                          onClick={() => openIssueModal(row)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Manage
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalCount > 0 && (
          <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-200 dark:border-slate-700 pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages} - {totalCount} total
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Issue Details</h2>
              <button
                type="button"
                onClick={closeIssueModal}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-gray-500 dark:text-slate-400">Issue Type</p>
                <p className="font-semibold capitalize text-gray-900 dark:text-white">{selectedIssue.issueType}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-gray-500 dark:text-slate-400">Issue Quantity</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedIssue.issueQuantity}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-gray-500 dark:text-slate-400">Raised By</p>
                <p className="font-medium capitalize text-gray-900 dark:text-white">
                  {selectedIssue.raisedByName || "-"} ({selectedIssue.raisedByType})
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-gray-500 dark:text-slate-400">Current Status</p>
                <p className="font-medium capitalize text-gray-900 dark:text-white">{selectedIssue.issueStatus}</p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <p className="text-gray-500 dark:text-slate-400">Description</p>
              <p>{selectedIssue.issueDescription}</p>
            </div>

            {selectedIssue.issueType === "damaged" && (selectedIssue.issueImages?.length || 0) > 0 && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <p className="mb-2 text-gray-500 dark:text-slate-400">Damaged Images</p>
                <div className="flex flex-wrap gap-2">
                  {selectedIssue.issueImages?.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt="Damaged issue"
                        className="h-16 w-16 rounded border border-gray-300 object-cover dark:border-slate-600"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selectedIssue.issueResolutionType && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <p className="text-gray-500 dark:text-slate-400">Existing Resolution</p>
                <p className="capitalize">{selectedIssue.issueResolutionType}</p>
                {selectedIssue.issueResolutionDescription ? (
                  <p className="mt-1">{selectedIssue.issueResolutionDescription}</p>
                ) : null}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-700 dark:text-slate-300">Issue Status</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as IssueStatus)}
                  disabled={actorRoleForSelectedIssue === "none"}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  {actorRoleForSelectedIssue === "receiver" ? (
                    <>
                      {selectedIssue &&
                      !["pending", "resolved"].includes(selectedIssue.issueStatus) ? (
                        <option value={selectedIssue.issueStatus}>
                          {selectedIssue.issueStatus} (current)
                        </option>
                      ) : null}
                      <option value="pending">pending</option>
                      <option value="resolved">resolved</option>
                    </>
                  ) : actorRoleForSelectedIssue === "sender" ? (
                    <>
                      <option value="in_progress">in_progress</option>
                    </>
                  ) : (
                    <option value={statusInput}>{statusInput}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700 dark:text-slate-300">
                  Resolution Type
                </label>
                <select
                  value={effectiveResolutionType}
                  onChange={(e) => setResolutionTypeInput(e.target.value)}
                  disabled={loadingResolutionRules || isResolutionTypeLocked}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  {effectiveResolutionType &&
                    !allowedResolutionTypes.includes(effectiveResolutionType as IssueResolutionType) && (
                    <option value={effectiveResolutionType}>{effectiveResolutionType}</option>
                  )}
                  {allowedResolutionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-sm text-gray-700 dark:text-slate-300">
                Resolution Note (optional)
              </label>
              <textarea
                value={resolutionDescription}
                onChange={(e) => setResolutionDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                rows={3}
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeIssueModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateIssue}
                disabled={updatingIssue}
                className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
              >
                {updatingIssue ? "Updating..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferIssuesPage;
