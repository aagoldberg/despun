"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredAuthKey } from "@/components/admin/AuthProvider";

interface Variant {
  id: string;
  name: string;
  description?: string;
}

interface ABTest {
  id: number;
  test_name: string;
  test_description?: string;
  variants: Variant[];
  target_metric: string;
  traffic_allocation: number;
  status: "draft" | "running" | "paused" | "completed";
  started_at?: string;
  ended_at?: string;
  winner_variant?: string;
  created_at?: string;
}

const TARGET_METRICS = [
  { value: "story_expand_rate", label: "Story Expand Rate", description: "% of users who expand a story" },
  { value: "source_click_rate", label: "Source Click Rate", description: "% of users who click a source link" },
  { value: "time_on_page", label: "Time on Page", description: "Average seconds spent on page" },
  { value: "scroll_depth", label: "Scroll Depth", description: "Average scroll depth percentage" },
  { value: "newsletter_signup", label: "Newsletter Signups", description: "% of users who sign up" },
  { value: "return_visit", label: "Return Visits", description: "% of users who return within 7 days" },
  { value: "share_rate", label: "Share Rate", description: "% of users who share a story" },
];

export default function ExperimentsPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    test_name: "",
    test_description: "",
    target_metric: "story_expand_rate",
    traffic_allocation: 50,
    variants: [
      { id: "A", name: "Control", description: "Original version" },
      { id: "B", name: "Variant B", description: "" },
    ] as Variant[],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const authKey = getStoredAuthKey();

      const response = await fetch("/api/admin/experiments", {
        headers: { Authorization: `Bearer ${authKey}` },
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setTests(result.data.tests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTest = async () => {
    try {
      setActionLoading(-1);
      const authKey = getStoredAuthKey();

      const response = await fetch("/api/admin/experiments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test_name: formData.test_name,
          test_description: formData.test_description,
          variants: formData.variants,
          target_metric: formData.target_metric,
          traffic_allocation: formData.traffic_allocation / 100,
        }),
      });

      if (!response.ok) throw new Error("Failed to create test");

      setShowCreateModal(false);
      setFormData({
        test_name: "",
        test_description: "",
        target_metric: "story_expand_rate",
        traffic_allocation: 50,
        variants: [
          { id: "A", name: "Control", description: "Original version" },
          { id: "B", name: "Variant B", description: "" },
        ],
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create test");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (testId: number, newStatus: string, winnerVariant?: string) => {
    try {
      setActionLoading(testId);
      const authKey = getStoredAuthKey();

      const response = await fetch("/api/admin/experiments", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: testId,
          status: newStatus,
          winner_variant: winnerVariant,
        }),
      });

      if (!response.ok) throw new Error("Failed to update test");

      fetchData();
      setSelectedTest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update test");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTest = async (testId: number) => {
    if (!confirm("Are you sure you want to delete this experiment? This cannot be undone.")) {
      return;
    }

    try {
      setActionLoading(testId);
      const authKey = getStoredAuthKey();

      const response = await fetch(`/api/admin/experiments?id=${testId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authKey}` },
      });

      if (!response.ok) throw new Error("Failed to delete test");

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete test");
    } finally {
      setActionLoading(null);
    }
  };

  const addVariant = () => {
    const nextId = String.fromCharCode(65 + formData.variants.length); // A, B, C, D...
    setFormData({
      ...formData,
      variants: [...formData.variants, { id: nextId, name: `Variant ${nextId}`, description: "" }],
    });
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length <= 2) return;
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "paused":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        );
      case "paused":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case "completed":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">A/B Experiments</h1>
          <p className="text-zinc-500 mt-1">Test and optimize your user experience</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Experiment
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Total Experiments</p>
          <p className="text-2xl font-bold text-zinc-900">{tests.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Running</p>
          <p className="text-2xl font-bold text-emerald-600">
            {tests.filter((t) => t.status === "running").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Completed</p>
          <p className="text-2xl font-bold text-blue-600">
            {tests.filter((t) => t.status === "completed").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Draft</p>
          <p className="text-2xl font-bold text-zinc-600">
            {tests.filter((t) => t.status === "draft").length}
          </p>
        </div>
      </div>

      {/* Tests List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 p-6 animate-pulse">
              <div className="h-6 bg-zinc-100 rounded w-48 mb-4" />
              <div className="h-4 bg-zinc-100 rounded w-96 mb-2" />
              <div className="h-4 bg-zinc-100 rounded w-32" />
            </div>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No experiments yet</h3>
          <p className="text-zinc-500 mb-6">Create your first A/B test to start optimizing</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Experiment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.id} className="bg-white rounded-xl border border-zinc-200 p-6 hover:border-zinc-300 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-zinc-900">{test.test_name}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(test.status)}`}>
                      {getStatusIcon(test.status)}
                      {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                    </span>
                  </div>
                  {test.test_description && (
                    <p className="text-zinc-500">{test.test_description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {test.status === "draft" && (
                    <button
                      onClick={() => handleStatusChange(test.id, "running")}
                      disabled={actionLoading === test.id}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Start
                    </button>
                  )}
                  {test.status === "running" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(test.id, "paused")}
                        disabled={actionLoading === test.id}
                        className="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => setSelectedTest(test)}
                        disabled={actionLoading === test.id}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Complete
                      </button>
                    </>
                  )}
                  {test.status === "paused" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(test.id, "running")}
                        disabled={actionLoading === test.id}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => setSelectedTest(test)}
                        disabled={actionLoading === test.id}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Complete
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteTest(test.id)}
                    disabled={actionLoading === test.id}
                    className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                    title="Delete experiment"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">Target Metric</p>
                  <p className="font-medium text-zinc-900">
                    {TARGET_METRICS.find((m) => m.value === test.target_metric)?.label || test.target_metric}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Variants</p>
                  <div className="flex gap-1 mt-1">
                    {test.variants.map((v) => (
                      <span
                        key={v.id}
                        className={`px-2 py-0.5 text-xs rounded ${
                          test.winner_variant === v.id
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {v.id}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-zinc-500">Traffic</p>
                  <p className="font-medium text-zinc-900">{Math.round(test.traffic_allocation * 100)}%</p>
                </div>
                <div>
                  <p className="text-zinc-500">Started</p>
                  <p className="font-medium text-zinc-900">
                    {test.started_at ? new Date(test.started_at).toLocaleDateString() : "Not started"}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Created</p>
                  <p className="font-medium text-zinc-900">
                    {test.created_at ? new Date(test.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              {test.winner_variant && (
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  <span className="inline-flex items-center gap-2 text-emerald-700 font-medium">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Winner: {test.variants.find((v) => v.id === test.winner_variant)?.name || `Variant ${test.winner_variant}`}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">How A/B Testing Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-600 font-semibold">1</span>
            </div>
            <div>
              <h4 className="font-medium text-zinc-900">Create Test</h4>
              <p className="text-sm text-zinc-500">Define variants and target metrics</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-600 font-semibold">2</span>
            </div>
            <div>
              <h4 className="font-medium text-zinc-900">Run Experiment</h4>
              <p className="text-sm text-zinc-500">Split traffic between variants</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-600 font-semibold">3</span>
            </div>
            <div>
              <h4 className="font-medium text-zinc-900">Analyze Results</h4>
              <p className="text-sm text-zinc-500">Pick the winning variant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Experiment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-900">Create New Experiment</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Basic Information</h3>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Experiment Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.test_name}
                    onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                    placeholder="e.g., Homepage CTA Button Test"
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.test_description}
                    onChange={(e) => setFormData({ ...formData, test_description: e.target.value })}
                    placeholder="What are you testing and why?"
                    rows={2}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Target Metric */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Target Metric</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TARGET_METRICS.map((metric) => (
                    <label
                      key={metric.value}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        formData.target_metric === metric.value
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="target_metric"
                        value={metric.value}
                        checked={formData.target_metric === metric.value}
                        onChange={(e) => setFormData({ ...formData, target_metric: e.target.value })}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-zinc-900">{metric.label}</p>
                        <p className="text-sm text-zinc-500">{metric.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Variants */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Variants</h3>
                  {formData.variants.length < 4 && (
                    <button
                      onClick={addVariant}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      + Add Variant
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {formData.variants.map((variant, index) => (
                    <div
                      key={variant.id}
                      className="flex items-start gap-3 p-4 bg-zinc-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold">{variant.id}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, "name", e.target.value)}
                          placeholder="Variant name"
                          className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={variant.description || ""}
                          onChange={(e) => updateVariant(index, "description", e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      {formData.variants.length > 2 && (
                        <button
                          onClick={() => removeVariant(index)}
                          className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Traffic Allocation */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Traffic Allocation</h3>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-600">Percentage of traffic in experiment</span>
                    <span className="text-lg font-bold text-indigo-600">{formData.traffic_allocation}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={formData.traffic_allocation}
                    onChange={(e) => setFormData({ ...formData, traffic_allocation: parseInt(e.target.value) })}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-zinc-400 mt-1">
                    <span>10%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                <p className="text-sm text-zinc-500">
                  Traffic will be split evenly between {formData.variants.length} variants.
                  Each variant receives ~{Math.round(formData.traffic_allocation / formData.variants.length)}% of total traffic.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTest}
                disabled={!formData.test_name || actionLoading === -1}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === -1 ? "Creating..." : "Create Experiment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Experiment Modal (Pick Winner) */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-xl font-semibold text-zinc-900">Complete Experiment</h2>
              <p className="text-zinc-500 mt-1">Select the winning variant for &quot;{selectedTest.test_name}&quot;</p>
            </div>

            <div className="p-6 space-y-3">
              {selectedTest.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleStatusChange(selectedTest.id, "completed", variant.id)}
                  disabled={actionLoading === selectedTest.id}
                  className="w-full flex items-center gap-4 p-4 border-2 border-zinc-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-lg">{variant.id}</span>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">{variant.name}</p>
                    {variant.description && (
                      <p className="text-sm text-zinc-500">{variant.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 border-t border-zinc-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTest(null)}
                className="px-4 py-2 text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(selectedTest.id, "completed")}
                disabled={actionLoading === selectedTest.id}
                className="px-4 py-2 text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50"
              >
                Complete Without Winner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
