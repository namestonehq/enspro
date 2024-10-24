import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get token from next-auth
  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  const address = token.sub as string; // Assuming the Ethereum address is stored in the `sub` property of the token

  if (!address) {
    return res
      .status(400)
      .json({ error: "Ethereum address not found in token" });
  }

  try {
    const response = await fetch(
      `https://namestone.xyz/api/public_v1/get-siwe-message?address=${address}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to retrieve SIWE message");
    }

    const message = await response.text();
    return res.status(200).json({ message });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Failed to get SIWE message" });
  }
}
