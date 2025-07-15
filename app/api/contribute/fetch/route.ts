import { getUsersContribution } from "@/app/actions/userUpload";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  // const userId = req.headers.get("x-user-id");
  // console.log(userId);

  try {
    const res = await getUsersContribution();
    return NextResponse.json({
      success: true,
      contributors: res,
    });
  } catch (error) {
    console.error("error fetching user contributions :", error);
    return NextResponse.json({
      success: false,
    });
  }
};
