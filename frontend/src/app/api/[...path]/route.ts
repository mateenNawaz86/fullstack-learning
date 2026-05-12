import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:4000";

// Catch-all API route handler that proxies requests to the backend
// and properly forwards cookies in both directions
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join("/");
    const url = `${API_URL}/api/${pathString}`;

    // Forward search params from the original request
    const searchParams = req.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;

    // Prepare headers to forward to backend
    const headers = new Headers();

    // Forward content-type and other relevant headers
    if (req.headers.get("content-type")) {
      headers.set("content-type", req.headers.get("content-type")!);
    }

    // Forward cookies from the request to the backend
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      headers.set("cookie", cookieHeader);
    }

    // Use arrayBuffer for ALL body types (JSON, text, or multipart/form-data).
    // req.text() corrupts binary file data in multipart uploads — arrayBuffer preserves it.
    let body: ArrayBuffer | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.arrayBuffer();
    }

    // Make the request to the backend
    const response = await fetch(fullUrl, {
      method: req.method,
      headers,
      body,
      credentials: "include",
    });

    // Get response body
    const responseBody = await response.text();

    // Create NextResponse with the backend's response
    const nextResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
    });

    // Forward all headers from backend response (except set-cookie, handle separately)
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie") {
        nextResponse.headers.set(key, value);
      }
    });

    // Explicitly forward Set-Cookie headers from backend to client
    // This is crucial for authentication cookies to work properly
    const setCookieHeaders = response.headers.getSetCookie();
    setCookieHeaders.forEach((cookie) => {
      nextResponse.headers.append("set-cookie", cookie);
    });

    return nextResponse;
  } catch (error) {
    console.error("API proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Internal proxy error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(req, context);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(req, context);
}
