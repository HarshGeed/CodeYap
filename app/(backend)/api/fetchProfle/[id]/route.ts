import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import { connect } from "@/lib/dbConn";

export const GET = async(req: NextRequest, context: {params: Promise<{id: string}>}) => {
    try{
        await connect();
        const params = await context.params;
        const user = await User.findById(params.id).select(
            "-password -__v"
        )

        if(!user){
            return NextResponse.json({error: "User not found"}, {status: 404})
        }

        return NextResponse.json(user, {
            status: 200,
            headers: {"Content-Type" : "application/json"}
        });
    }catch{
        return NextResponse.json({error: "Server error"}, {status: 500})
    }
}