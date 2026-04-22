import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:3001/api/user";

export async function GET(req: NextRequest) {
    const auth = req.headers.get('authorization');
    
    // Check for "Bearer null" which happens if localStorage.getItem('accessToken') is null
    if (!auth || auth === "Bearer null" || auth === "Bearer undefined" || auth === "Bearer ") {
        return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    try {
        const res = await fetch(BACKEND_URL, { 
            headers: { 'Authorization': auth } 
        });
        
        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        // NORMALIZE & ENFORCE: Ensure the keys match what AccountPage.tsx expects.
        // Your AccountPage has: if (data.username) { setForm(...) }
        const normalizedData = {
            ...data,
            // Guaranteed keys for the frontend
            username: data.username || "User", 
            firstName: data.firstName || data.first_name || "",
            lastName: data.lastName || data.last_name || "",
            email: data.email || "",
            phone: data.phone || "",
            role: data.role || "user"
        };

        return NextResponse.json(normalizedData, { status: 200 });
    } catch (err) {
        console.error("Proxy GET Error:", err);
        return NextResponse.json({ error: "Backend connection failed" }, { status: 502 });
    }
}

export async function PATCH(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (!auth || auth.includes("null")) {
        return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    try {
        const body = await req.json();
        
        // Convert camelCase from frontend to snake_case for the database/backend
        const backendBody = {
            first_name: body.first_name || body.firstName,
            last_name: body.last_name || body.lastName,
            email: body.email,
            phone: body.phone
        };

        const res = await fetch(BACKEND_URL, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': auth 
            },
            body: JSON.stringify(backendBody)
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const auth = req.headers.get('authorization');
    
    // Check for "Bearer null" or missing headers to prevent 500 errors
    if (!auth || auth === "Bearer null" || auth === "Bearer undefined" || auth === "Bearer ") {
        return NextResponse.json({ error: "No authorization header provided" }, { status: 401 });
    }

    try {
        const res = await fetch(BACKEND_URL, {
            method: 'DELETE',
            headers: { 
                'Authorization': auth,
                'Content-Type': 'application/json' 
            }
        });
        
        const data = await res.json();

        // If the backend failed (e.g., Foreign Key constraint), pass that error to the UI
        if (!res.ok) {
            return NextResponse.json(
                { error: data.error || "Backend failed to deactivate account" }, 
                { status: res.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (err) {
        console.error("Proxy DELETE Error:", err);
        return NextResponse.json({ error: "Connection to backend failed" }, { status: 502 });
    }
}