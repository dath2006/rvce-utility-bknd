"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Eye,
  Download,
  FileText,
  Copy,
  Check,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ContributionCardProps {
  contribution: {
    _id?: string;
    subject: string;
    fileId: string;
    fileName: string;
    webViewLink: string;
    webContentLink: string;
    description?: string;
    docType: string;
    contributedAt?: string;
    contributedTo?: string;
    uploadSessionId: string;
    semester: string;
    branch: string;
    subjectCode: string;
    rejectionComment?: string;
    status: "pending" | "reviewing" | "approved" | "rejected";
    uploadedAt: string;
    contributorEmail?: string;
    contributorName?: string;
  };
  onStatusUpdate?: (
    id: string,
    status: string,
    rejectionComment?: string
  ) => void;
  isRequestContribution?: boolean;
}

export function ContributionCard({
  contribution,
  onStatusUpdate,
  isRequestContribution = false,
}: ContributionCardProps) {
  const [copied, setCopied] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        variant: "secondary" as const,
        color: "bg-yellow-100 text-yellow-800",
      },
      reviewing: {
        variant: "default" as const,
        color: "bg-blue-100 text-blue-800",
      },
      approved: {
        variant: "default" as const,
        color: "bg-green-100 text-green-800",
      },
      rejected: {
        variant: "destructive" as const,
        color: "bg-red-100 text-red-800",
      },
    } as any;

    return (
      <Badge
        className={statusConfig[status]?.color || "bg-gray-100 text-gray-800"}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const fileInfo = {
    fileId: contribution.fileId,
    fileName: contribution.fileName,
    webViewLink: contribution.webViewLink,
    webContentLink: contribution.webContentLink,
    description: contribution.description,
    docType: contribution.docType,
    subject: contribution.subject,
    subjectCode: contribution.subjectCode,
    semester: contribution.semester,
    branch: contribution.branch,
    contributedTo: contribution.contributedTo,
    uploadSessionId: contribution.uploadSessionId,
    status: contribution.status,
    uploadedAt: contribution.uploadedAt,
    contributorEmail: contribution.contributorEmail,
    contributorName: contribution.contributorName,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(fileInfo, null, 2));
      setCopied(true);
      toast.success("JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleView = () => {
    window.open(contribution.webViewLink, "_blank");
  };

  const handleDownload = () => {
    window.open(contribution.webContentLink, "_blank");
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(contribution._id!, "approved");
        toast.success("Contribution approved successfully");
      }
    } catch (error) {
      toast.error("Failed to approve contribution");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionComment.trim()) {
      toast.error("Please provide a rejection comment");
      return;
    }

    setIsProcessing(true);
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(contribution._id!, "rejected", rejectionComment);
        toast.success("Contribution rejected");
        setRejectionComment("");
      }
    } catch (error) {
      toast.error("Failed to reject contribution");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium line-clamp-2 mb-2">
              {contribution.fileName}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(contribution.status)}
              <Badge variant="outline">{contribution.docType}</Badge>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Subject:</strong> {contribution.subject} (
                {contribution.subjectCode})
              </p>
              <p>
                <strong>Branch:</strong> {contribution.branch} - Semester{" "}
                {contribution.semester}
              </p>
              {contribution.contributorName && (
                <p>
                  <strong>Contributor:</strong> {contribution.contributorName}
                </p>
              )}
              {isRequestContribution && contribution.contributedTo && (
                <p>
                  <strong>Contributed to:</strong> {contribution.contributedTo}
                </p>
              )}
              <p>
                <strong>Uploaded:</strong>{" "}
                {new Date(
                  contribution.uploadedAt || contribution.contributedAt || ""
                ).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {contribution.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              <strong>Description:</strong> {contribution.description}
            </p>
          )}

          {contribution.rejectionComment && (
            <div className="bg-red-50 p-2 rounded text-xs">
              <strong className="text-red-800">Rejection Comment:</strong>
              <p className="text-red-700 mt-1">
                {contribution.rejectionComment}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleView}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              View
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Download
            </Button>

            {/* INFO Button (shows all info) */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  INFO
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-lg sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Contribution Information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm overflow-auto max-h-96 break-all whitespace-pre-wrap max-w-full">
                      {JSON.stringify(fileInfo, null, 2)}
                    </pre>
                  </div>
                  <Button onClick={copyToClipboard} className="w-full">
                    {copied ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copied ? "Copied!" : "Copy to Clipboard"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* JSON Button (shows minimal info) */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  JSON
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-lg sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Minimal File JSON</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm overflow-auto max-h-96 break-all whitespace-pre-wrap max-w-full">
                      {JSON.stringify(
                        {
                          id: contribution.fileId,
                          name: contribution.fileName,
                          mimeType: "application/pdf",
                          children: [],
                          webViewLink: contribution.webViewLink,
                          webContentLink: contribution.webContentLink,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          JSON.stringify(
                            {
                              id: contribution.fileId,
                              name: contribution.fileName,
                              mimeType: "application/pdf",
                              children: [],
                              webViewLink: contribution.webViewLink,
                              webContentLink: contribution.webContentLink,
                            },
                            null,
                            2
                          )
                        );
                        toast.success("Minimal JSON copied to clipboard");
                      } catch {
                        toast.error("Failed to copy JSON");
                      }
                    }}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy JSON
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {((isRequestContribution && contribution.status === "reviewing") ||
              (!isRequestContribution && contribution.status === "pending")) &&
              onStatusUpdate && (
                <>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-3 w-3" />
                    {isProcessing ? "Processing..." : "Accept"}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-3 w-3" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Contribution</AlertDialogTitle>
                        <AlertDialogDescription>
                          Please provide a reason for rejecting this
                          contribution.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="my-4">
                        <Textarea
                          placeholder="Enter rejection reason..."
                          value={rejectionComment}
                          onChange={(e) => setRejectionComment(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleReject}
                          disabled={!rejectionComment.trim() || isProcessing}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isProcessing ? "Processing..." : "Reject"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
