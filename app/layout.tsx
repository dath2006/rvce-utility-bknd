"use client";

import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import SignInButton from "@/components/SignInButton";
import SignOutButton from "@/components/SignOutButton";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "College Resource Management System",
//   description:
//     "Manage college resources with Google Drive and MongoDB integration",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Navbar with user info and auth buttons
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <NavBar />
          {/* Add top padding to main content to prevent overlap with fixed navbar */}
          <div style={{ paddingTop: "72px" }} />
          {children}
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}

function NavBar() {
  const { data: session, status } = useSession();
  return (
    <nav className="bg-white shadow mb-6 fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto px-4 py-3 flex items-center gap-6 justify-between">
        <div className="flex items-center gap-6">
          <a
            href="/"
            className="font-bold text-lg text-blue-700 hover:underline"
          >
            Home
          </a>
          <a
            href="/drive-manager"
            className="text-gray-700 hover:text-blue-700 hover:underline"
          >
            Drive Manager
          </a>
          <a
            href="/contribution-manager"
            className="text-gray-700 hover:text-blue-700 hover:underline"
          >
            Contribution Manager
          </a>
        </div>
        <div className="flex items-center gap-4">
          {status === "loading" ? null : session ? (
            <>
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border"
                />
              )}
              <span className="text-gray-700 text-sm font-medium">
                {session.user?.name || session.user?.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </nav>
  );
}
