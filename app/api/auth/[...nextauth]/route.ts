import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { NextRequest, NextResponse } from "next/server";

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow only your GitHub account
      if (
        user?.email === "sathishdutt0@gmail.com" ||
        (profile as any)?.login === "dath2006"
      ) {
        return true;
      }
      // Deny all others
      return false;
    },
  },
});

export { handler as GET, handler as POST };
