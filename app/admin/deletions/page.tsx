"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Download, TrendingDown, AlertCircle, ArrowLeft } from "lucide-react";

interface AccountDeletion {
  id: string;
  email: string;
  full_name: string;
  deletion_reason: string;
  deletion_category: string;
  feedback: string | null;
  deleted_at: string;
}

export default function AccountDeletionsPage() {
  const router = useRouter();
  const [deletions, setDeletions] = useState<AccountDeletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    categories: {} as Record<string, number>,
  });
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadDeletions();
  }, []);

  const loadDeletions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("account_deletions")
        .select("*")
        .order("deleted_at", { ascending: false });

      if (error) throw error;

      setDeletions(data || []);

      // Calculate stats
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthDeletions = data?.filter(
        (d) => new Date(d.deleted_at) >= thisMonthStart
      ).length || 0;

      const categories: Record<string, number> = {};
      data?.forEach((d) => {
        const cat = d.deletion_category || "other";
        categories[cat] = (categories[cat] || 0) + 1;
      });

      setStats({
        total: data?.length || 0,
        thisMonth: thisMonthDeletions,
        categories,
      });
    } catch (error) {
      // console.error("Error loading deletions:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Email", "Name", "Category", "Reason", "Feedback"];
    const rows = deletions.map((d) => [
      new Date(d.deleted_at).toLocaleDateString(),
      d.email,
      d.full_name || "N/A",
      d.deletion_category || "other",
      d.deletion_reason.replace(/,/g, ";"),
      (d.feedback || "N/A").replace(/,/g, ";"),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `account-deletions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filteredDeletions =
    filter === "all"
      ? deletions
      : deletions.filter((d) => d.deletion_category === filter);

  const categoryColors: Record<string, string> = {
    found_match: "bg-green-100 text-green-800",
    privacy_concerns: "bg-red-100 text-red-800",
    not_useful: "bg-yellow-100 text-yellow-800",
    too_expensive: "bg-orange-100 text-orange-800",
    other: "bg-gray-100 text-gray-800",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          onClick={() => router.push('/admin/dashboard')}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trash2 className="w-8 h-8 text-red-500" />
          Account Deletions
        </h1>
        <p className="text-gray-600 mt-2">
          Track and analyze why users are deleting their accounts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Deletions</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <TrendingDown className="w-12 h-12 text-red-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-3xl font-bold mt-2">{stats.thisMonth}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-3xl font-bold mt-2">
                {Object.keys(stats.categories).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Deletion Reasons Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.categories).map(([category, count]) => (
            <div
              key={category}
              className="p-4 bg-gray-50 rounded-lg text-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setFilter(filter === category ? "all" : category)}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-gray-600 capitalize mt-1">
                {category.replace(/_/g, " ")}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All ({deletions.length})
          </Button>
          {Object.keys(stats.categories).map((category) => (
            <Button
              key={category}
              variant={filter === category ? "default" : "outline"}
              onClick={() => setFilter(category)}
            >
              {category.replace(/_/g, " ")} ({stats.categories[category]})
            </Button>
          ))}
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Deletions List */}
      <Card className="p-6">
        <div className="space-y-4">
          {filteredDeletions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Trash2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>No account deletions found</p>
            </div>
          ) : (
            filteredDeletions.map((deletion) => (
              <div
                key={deletion.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{deletion.full_name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          categoryColors[deletion.deletion_category] ||
                          categoryColors.other
                        }`}
                      >
                        {deletion.deletion_category?.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(deletion.deleted_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Email:</span> {deletion.email}
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Reason:</span>{" "}
                      {deletion.deletion_reason}
                    </p>
                    {deletion.feedback && (
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg mt-2">
                        <span className="font-medium">Additional Feedback:</span>{" "}
                        {deletion.feedback}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
