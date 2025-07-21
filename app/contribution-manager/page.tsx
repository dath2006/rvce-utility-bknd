"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ContributionCard } from "@/components/ContributionCard";
import { Search, RefreshCw, Users, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import PendingContributions from "./PendingContributions";
import ReviewingContributions from "./ReviewingContributions";
import ApprovedContributions from "./ApprovedContributions";
import RejectedContributions from "./RejectedContributions";

interface Contribution {
  _id: string;
  subject: string;
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
  description?: string;
  docType: string;
  contributedTo?: string;
  uploadSessionId: string;
  semester: string;
  branch: string;
  subjectCode: string;
  rejectionComment?: string;
  status: "pending" | "reviewing" | "approved" | "rejected";
  uploadedAt: string;
  contributorEmail: string;
  contributorName?: string;
  requestId?: string;
  documentId?: string;
}

export default function ContributionManager() {
  const [openContributions, setOpenContributions] = useState<Contribution[]>(
    []
  );
  const [requestContributions, setRequestContributions] = useState<
    Contribution[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("open");

  useEffect(() => {
    fetchContributions();
  }, []);

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const [openResponse, requestResponse] = await Promise.all([
        fetch("/api/contributions?type=open"),
        fetch("/api/contributions?type=request"),
      ]);

      const openData = await openResponse.json();
      const requestData = await requestResponse.json();

      if (openData.error || requestData.error) {
        toast.error("Failed to fetch contributions");
        return;
      }

      setOpenContributions(openData.contributions || []);
      setRequestContributions(requestData.contributions || []);
    } catch (error) {
      toast.error("Failed to fetch contributions");
      console.error("Error fetching contributions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    contributionId: string,
    status: string,
    rejectionComment?: string
  ) => {
    try {
      const isRequestContribution = activeTab === "request";
      const contribution = isRequestContribution
        ? requestContributions.find((c) => c._id === contributionId)
        : openContributions.find((c) => c._id === contributionId);

      const response = await fetch("/api/contributions/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributionId,
          status,
          rejectionComment,
          isRequestContribution,
          requestId: contribution?.requestId,
          documentId: contribution?.documentId,
        }),
      });

      if (response.ok) {
        // Update local state
        if (isRequestContribution) {
          setRequestContributions((prev) =>
            prev.map((c) =>
              c._id === contributionId
                ? { ...c, status: status as any, rejectionComment }
                : c
            )
          );
        } else {
          setOpenContributions((prev) =>
            prev.map((c) =>
              c._id === contributionId
                ? { ...c, status: status as any, rejectionComment }
                : c
            )
          );
        }

        toast.success(`Contribution ${status} successfully`);
      } else {
        toast.error("Failed to update contribution status");
      }
    } catch (error) {
      toast.error("Failed to update contribution status");
      console.error("Error updating contribution status:", error);
    }
  };

  const filterContributions = (contributions: Contribution[]) => {
    return contributions.filter(
      (contribution) =>
        contribution.fileName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        contribution.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contribution.contributorName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        contribution.contributorEmail
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  };

  const getStatusStats = (contributions: Contribution[]) => {
    const stats = contributions.reduce((acc, contribution) => {
      acc[contribution.status] = (acc[contribution.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: contributions.length,
      pending: stats.pending || 0,
      reviewing: stats.reviewing || 0,
      approved: stats.approved || 0,
      rejected: stats.rejected || 0,
    };
  };

  const openStats = getStatusStats(openContributions);
  const requestStats = getStatusStats(requestContributions);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Contribution Manager
          </h1>
          <p className="text-gray-600">Review and manage user contributions</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchContributions}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contributions by filename, subject, or contributor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Open Contributions
              <Badge variant="secondary">{openStats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="request" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Request Contributions
              <Badge variant="secondary">{requestStats.total}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Open Contributions Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {openStats.total}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {openStats.pending}
                    </div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {openStats.reviewing}
                    </div>
                    <div className="text-sm text-gray-600">Reviewing</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {openStats.approved}
                    </div>
                    <div className="text-sm text-gray-600">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {openStats.rejected}
                    </div>
                    <div className="text-sm text-gray-600">Rejected</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <PendingContributions
              contributions={openContributions.filter(
                (c) => c.status === "pending"
              )}
              onStatusUpdate={handleStatusUpdate}
            />
            <ReviewingContributions
              contributions={openContributions.filter(
                (c) => c.status === "reviewing"
              )}
              onStatusUpdate={handleStatusUpdate}
            />
            <ApprovedContributions
              contributions={openContributions.filter(
                (c) => c.status === "approved"
              )}
            />
            <RejectedContributions
              contributions={openContributions.filter(
                (c) => c.status === "rejected"
              )}
            />
          </TabsContent>

          <TabsContent value="request" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Contributions Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {requestStats.total}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {requestStats.pending}
                    </div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {requestStats.reviewing}
                    </div>
                    <div className="text-sm text-gray-600">Reviewing</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {requestStats.approved}
                    </div>
                    <div className="text-sm text-gray-600">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {requestStats.rejected}
                    </div>
                    <div className="text-sm text-gray-600">Rejected</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <PendingContributions
              contributions={requestContributions.filter(
                (c) => c.status === "pending"
              )}
              onStatusUpdate={handleStatusUpdate}
              isRequestContribution={true}
            />
            <ReviewingContributions
              contributions={requestContributions.filter(
                (c) => c.status === "reviewing"
              )}
              onStatusUpdate={handleStatusUpdate}
              isRequestContribution={true}
            />
            <ApprovedContributions
              contributions={requestContributions.filter(
                (c) => c.status === "approved"
              )}
              isRequestContribution={true}
            />
            <RejectedContributions
              contributions={requestContributions.filter(
                (c) => c.status === "rejected"
              )}
              isRequestContribution={true}
            />
          </TabsContent>
        </Tabs>

        {loading && (
          <Card>
            <CardContent className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loading...
              </h3>
              <p className="text-gray-500">Fetching contributions</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
