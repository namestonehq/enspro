/**
 * Domain Storage Utility
 *
 * Provides functions to temporarily store domain information between
 * enabling a domain and obtaining an API key.
 */

// Domain information interface
export interface DomainInfo {
  domain: string;
  address: string;
  text_records: {
    avatar?: string;
    description?: string;
    location?: string;
    "com.twitter"?: string;
    "com.github"?: string;
    "com.discord"?: string;
    "org.telegram"?: string;
    email?: string;
    url?: string;
    status?: string;
    header?: string;
  };
  coin_types?: Record<string, string>;
  contenthash?: string;
}

/**
 * Save domain information temporarily until API key is obtained
 */
export function saveDomainInfoTemporarily(
  domain: string,
  domainInfo: DomainInfo
): void {
  console.log("Saving domain info temporarily", domainInfo);
  if (typeof window !== "undefined") {
    localStorage.setItem(
      `pending_domain_${domain}`,
      JSON.stringify(domainInfo)
    );
  }
}

/**
 * Retrieve stored domain information
 */
export function getSavedDomainInfo(domain: string): DomainInfo | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedData = localStorage.getItem(`pending_domain_${domain}`);
  return savedData ? JSON.parse(savedData) : null;
}

/**
 * Update domain records using the saved domain information after API key is obtained
 */
export async function updateDomainWithSavedInfo(
  domain: string
): Promise<boolean> {
  const savedData = getSavedDomainInfo(domain);

  if (!savedData) {
    console.log("No saved domain data found for", domain);
    return false;
  }

  try {
    // Prepare coin types with L2 addresses if the main ETH address exists
    let coinTypesFull: Record<string, string> = savedData.coin_types || {};
    const ethAddress = savedData.address;

    if (ethAddress) {
      // Default to copying the ETH address to L2 addresses
      coinTypesFull = {
        ...coinTypesFull,
        "0": ethAddress, // ETH
        "2147483658": ethAddress, // Optimism
        "2147483785": ethAddress, // Polygon
        "2147525809": ethAddress, // Arbitrum
        "2147492101": ethAddress, // Base
      };
    }

    // Make API request with saved data
    const response = await fetch("/api/edit-domain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: domain,
        address: savedData.address,
        text_records: savedData.text_records,
        coin_types: coinTypesFull,
        contenthash: savedData.contenthash || "",
      }),
    });

    if (response.ok) {
      // Clear stored data after successful update
      localStorage.removeItem(`pending_domain_${domain}`);
      console.log("Domain info saved successfully");
      return true;
    } else {
      console.error("Failed to save domain info");
      return false;
    }
  } catch (error) {
    console.error("Error updating domain with saved info:", error);
    return false;
  }
}
