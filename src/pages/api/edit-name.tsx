// pages/api/namestone-set-name.tsx
import { NextRequest, NextResponse } from "next/server";

async function makeRequest(url: string, apiKey: string, body: any) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.API_KEY || "default_api_key";
  const { method, ...body } = await req.json();

  try {
    if (method === "delete") {
      const data = await makeRequest(
        "https://namestone.xyz/api/public_v1/revoke-name",
        apiKey,
        body
      );
      return NextResponse.json(data);
    } else if (method === "set") {
      const data = await makeRequest(
        "https://namestone.xyz/api/public_v1/set-name",
        apiKey,
        body
      );
      return NextResponse.json(data);
    } else if (method === "edit") {
      // Creates the new name with relevant data
      await makeRequest(
        "https://namestone.xyz/api/public_v1/set-name",
        apiKey,
        body
      );

      // Deletes the old name
      await makeRequest(
        "https://namestone.xyz/api/public_v1/revoke-name",
        apiKey,
        {
          domain: body.domain,
          name: body.originalName,
          address: body.address,
        }
      );

      return NextResponse.json({ message: "Name edited successfully" });
    } else {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
