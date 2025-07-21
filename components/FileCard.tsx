"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Download, FileText, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface FileCardProps {
  file: {
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
  };
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function FileCard({ file, onDelete, showActions = true }: FileCardProps) {
  const [copied, setCopied] = useState(false);

  const formatFileSize = (size: number) => {
    if (!size) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('document')) return '📝';
    if (mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    return '📄';
  };

  const fileInfo = {
    fileId: file.id,
    fileName: file.name,
    mimeType: file.mimeType,
    webViewLink: file.webViewLink,
    webContentLink: file.webContentLink,
    children: file.parents,
    description: file.description || null,
    size: file.size ? formatFileSize(file.size) : 'Unknown',
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(fileInfo, null, 2));
      setCopied(true);
      toast.success('JSON copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleView = () => {
    window.open(file.webViewLink, '_blank');
  };

  const handleDownload = () => {
    window.open(file.webContentLink, '_blank');
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete(file.id);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
            <div>
              <CardTitle className="text-sm font-medium line-clamp-2">
                {file.name}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                {file.size ? formatFileSize(file.size) : 'Unknown size'}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            <p>Created: {new Date(file.createdTime).toLocaleDateString()}</p>
            <p>Modified: {new Date(file.modifiedTime).toLocaleDateString()}</p>
          </div>
          
          {file.description && (
            <p className="text-xs text-gray-600 line-clamp-2">{file.description}</p>
          )}

          {showActions && (
            <div className="flex flex-wrap gap-2 pt-2">
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
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>File Information</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm overflow-auto max-h-96">
                        {JSON.stringify(fileInfo, null, 2)}
                      </pre>
                    </div>
                    <Button onClick={copyToClipboard} className="w-full">
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete File</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{file.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}