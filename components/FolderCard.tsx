"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Folder, Trash2 } from 'lucide-react';

interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    createdTime: string;
    modifiedTime: string;
  };
  onNavigate: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function FolderCard({ folder, onNavigate, onDelete }: FolderCardProps) {
  const handleNavigate = () => {
    onNavigate(folder.id);
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete(folder.id);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
      <CardHeader className="pb-3" onClick={handleNavigate}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Folder className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-sm font-medium line-clamp-2">
                {folder.name}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">Folder</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            <p>Created: {new Date(folder.createdTime).toLocaleDateString()}</p>
            <p>Modified: {new Date(folder.modifiedTime).toLocaleDateString()}</p>
          </div>

          {onDelete && (
            <div className="flex gap-2 pt-2">
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
                    <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{folder.name}"? This will also delete all files and subfolders within it. This action cannot be undone.
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}