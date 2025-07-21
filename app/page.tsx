"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  Users,
  FileText,
  TrendingUp,
  Database,
  Cloud,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            College Resource Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline academic resource management with integrated Google Drive
            and MongoDB solutions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                Drive Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Navigate, organize, and manage your college resources stored in
                Google Drive. Access files, folders, and perform operations with
                a user-friendly interface.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Cloud className="h-4 w-4" />
                  Google Drive Integration
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  File Operations (View, Download, Delete)
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Database className="h-4 w-4" />
                  JSON Export & Metadata
                </div>
              </div>
              <Link href="/drive-manager">
                <Button className="w-full">Open Drive Manager</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                Contribution Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Review and manage user contributions with comprehensive
                tracking. Handle open contributions and request-based
                submissions efficiently.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  Status Tracking & Analytics
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  Approval/Rejection Workflow
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Database className="h-4 w-4" />
                  MongoDB Integration
                </div>
              </div>
              <Link href="/contribution-manager">
                <Button className="w-full">Open Contribution Manager</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">System Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Cloud className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Google Drive Integration</h3>
                <p className="text-sm text-gray-600">
                  Seamless integration with Google Drive API for file management
                </p>
              </div>

              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Database className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">MongoDB Storage</h3>
                <p className="text-sm text-gray-600">
                  Robust data storage for user contributions and tracking
                </p>
              </div>

              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Status Tracking</h3>
                <p className="text-sm text-gray-600">
                  Complete workflow management with approval processes
                </p>
              </div>

              <div className="text-center">
                <div className="p-3 bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Rich File Operations</h3>
                <p className="text-sm text-gray-600">
                  Comprehensive file management with metadata support
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
