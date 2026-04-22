import { NextRequest, NextResponse } from "next/server";

// This points to the logout endpoint on your Express server
const BACKEND_LOGOUT_URL = "http://localhost:3001/api/logout";

export async function POST(req: NextRequest) {
    try {
        const auth = req.headers.get('authorization');
        if (!auth) {
            return NextResponse.json({ error: "No authorization header" }, { status: 401 });
        }

        // Forward the request to the backend to add the token to the blacklist
        const res = await fetch(BACKEND_LOGOUT_URL, {
            method: 'POST',
            headers: {
                'Authorization': auth || ""
            }
        });

        // Even if the backend fails (e.g., token already expired), 
        // we want the frontend to proceed with clearing local state.
        if (!res.ok) {
            const errorData = await res.json();
            return NextResponse.json(
                { error: errorData.error || "Backend logout failed" }, 
                { status: res.status }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Logout Proxy Error:", err);
        return NextResponse.json(
            { error: "Internal server error during logout" }, 
            { status: 500 }
        );
    }
}