"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FileCard } from "@/components/FileCard";
import { FolderCard } from "@/components/FolderCard";
import { ArrowLeft, Search, RefreshCw, FolderOpen, File } from "lucide-react";
import { toast } from "sonner";

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink: string;
  description?: string;
  parents?: string[];
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export default function DriveManager() {
  const [files, setFiles] = useState<DriveItem[]>([]);
  const [folders, setFolders] = useState<DriveItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>("");
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      performGlobalSearch(searchTerm);
    } else {
      fetchFiles();
      // Initialize breadcrumbs with root folder if not already set
      setBreadcrumbs((prev) =>
        prev.length === 0 ? [{ id: "", name: "Root" }] : prev
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId, searchTerm]);

  const performGlobalSearch = async (term: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/drive/files?search=${encodeURIComponent(term)}`
      );
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      const filesData = data.files || [];
      const folderItems = filesData.filter(
        (item: DriveItem) =>
          item.mimeType === "application/vnd.google-apps.folder"
      );
      const fileItems = filesData.filter(
        (item: DriveItem) =>
          item.mimeType !== "application/vnd.google-apps.folder"
      );
      setFolders(folderItems);
      setFiles(fileItems);
    } catch (error) {
      toast.error("Failed to search files");
      console.error("Error searching files:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/drive/files?folderId=${currentFolderId}`
      );
      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const filesData = data.files || [];
      const folderItems = filesData.filter(
        (item: DriveItem) =>
          item.mimeType === "application/vnd.google-apps.folder"
      );
      const fileItems = filesData.filter(
        (item: DriveItem) =>
          item.mimeType !== "application/vnd.google-apps.folder"
      );

      setFolders(folderItems);
      setFiles(fileItems);
    } catch (error) {
      toast.error("Failed to fetch files");
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fix breadcrumb logic: update breadcrumbs as you navigate folders
  const handleFolderNavigation = (folderId: string, folderName?: string) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs((prev) => {
      // If navigating to a folder already in breadcrumbs, trim after it
      const existingIdx = prev.findIndex((item) => item.id === folderId);
      if (existingIdx !== -1) {
        return prev.slice(0, existingIdx + 1);
      }
      // Otherwise, add new folder to breadcrumbs
      return [...prev, { id: folderId, name: folderName || "Folder" }];
    });
  };

  const handleBreadcrumbNavigation = (targetId: string) => {
    const targetIndex = breadcrumbs.findIndex((item) => item.id === targetId);
    if (targetIndex !== -1) {
      setBreadcrumbs((prev) => prev.slice(0, targetIndex + 1));
      setCurrentFolderId(targetId);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/drive/delete?fileId=${fileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("File deleted successfully");
        fetchFiles(); // Refresh the file list
      } else {
        toast.error("Failed to delete file");
      }
    } catch (error) {
      toast.error("Failed to delete file");
      console.error("Error deleting file:", error);
    }
  };

  const handleGoBack = () => {
    if (breadcrumbs.length > 1) {
      const previousFolder = breadcrumbs[breadcrumbs.length - 2];
      handleBreadcrumbNavigation(previousFolder.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Drive Manager
          </h1>
          <p className="text-gray-600">
            Manage your college resources in Google Drive
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Current Location
              </CardTitle>
              <div className="flex items-center gap-2">
                {breadcrumbs.length > 1 && !searchTerm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGoBack}
                    className="flex items-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={
                    searchTerm
                      ? () => performGlobalSearch(searchTerm)
                      : fetchFiles
                  }
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Hide breadcrumbs during search */}
              {!searchTerm && (
                <Breadcrumb
                  items={breadcrumbs}
                  onNavigate={handleBreadcrumbNavigation}
                />
              )}

              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files and folders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Folders Section */}
          {folders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Folders ({folders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {folders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onNavigate={(id) =>
                        handleFolderNavigation(id, folder.name)
                      }
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files Section */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="h-5 w-5" />
                  Files ({files.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {files.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {files.length === 0 && folders.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "No items found" : "Empty folder"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "This folder doesn't contain any files or subfolders"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Loading...
                </h3>
                <p className="text-gray-500">Fetching files and folders</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
