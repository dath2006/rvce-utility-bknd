"use client";

import { signIn } from "next-auth/react";

const SignInButton = () => {
  return (
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded"
      onClick={() => signIn("github")}
    >
      Sign In
    </button>
  );
};

export default SignInButton;
