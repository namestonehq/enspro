import { Name } from "@ensdomains/ensjs/subgraph";

declare global {
  // Define custom global types here
  type SubnameType = "offchain" | "onchain" | "L2";

  type ManageMethodType = "set" | "delete" | "edit";

  // Assuming 'Name' is already defined elsewhere and you want to extend it globally
  type Subname = Name & {
    nameType?: SubnameType;
    address: string;
    text_records: {
      avatar: string;
      description: string;
      location: string;
      "com.twitter": string;
      "com.github": string;
      "com.discord": string;
      "org.telegram": string;
      email: string;
      url: string;
      status: string;
      banner: string;
    };
    coin_types: {
      "0": string;
      "501": string;
      "2147483658": string;
    };
    contenthash: string;
  };

  type DomainInfo = {
    domain: string;
    address: string;
    text_records: {
      avatar: string;
      description: string;
      location: string;
      "com.twitter": string;
      "com.github": string;
      "com.discord": string;
      url: string;
      status: string;
      banner: string;
    };
  };
}

export {}; // This is required to prevent TS from throwing an error on the file
