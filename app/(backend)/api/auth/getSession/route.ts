import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(){
    const session = await auth();

    if(!session || !session.user){
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({userId: session.user.id}, {status: 200});
}