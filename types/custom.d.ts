import { Name } from "@ensdomains/ensjs/subgraph";

declare global {
  // Define custom global types here
  type SubnameType = "offchain" | "onchain" | "L2";

  type ManageMethodType = "set" | "delete" | "edit";

  // Assuming 'Name' is already defined elsewhere and you want to extend it globally
  type Subname = Name & {
    nameType?: SubnameType;
  };
}

export {}; // This is required to prevent TS from throwing an error on the file
