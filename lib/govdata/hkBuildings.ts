import { StatutoryOrder } from "@/lib/data/types";

export interface GovBuildingData {
  address: string;
  buildingType: string;
  buildingUsage: string;
  blockId: string;
  occupationPermitDate: string;
  occupationPermitNumber: string;
  lastUpdated: string;
}

// ── Mock datasets ─────────────────────────────────────────────────────────────
// TODO: Replace mock with live CSV fetch from data.gov.hk when in production.
// Primary dataset URL:
// https://static.csdi.gov.hk/csdi-webpage/download/0e55c533715b5da3ae0ca6e6024e90b4/csv

const MOCK_BUILDING_DATA: Record<string, GovBuildingData> = {
  "18 hoi fai road": {
    address: "18 Hoi Fai Road, Tai Kok Tsui, Kowloon",
    buildingType: "Residential",
    buildingUsage: "Domestic",
    blockId: "KL-TKT-0442",
    occupationPermitDate: "1998-06-15",
    occupationPermitNumber: "OP/KL/1998/4421",
    lastUpdated: "2024-11-01",
  },
  "22 cherry street": {
    address: "22 Cherry Street, Tai Kok Tsui, Kowloon",
    buildingType: "Residential",
    buildingUsage: "Domestic",
    blockId: "KL-TKT-1876",
    occupationPermitDate: "2004-03-20",
    occupationPermitNumber: "OP/KL/2004/1876",
    lastUpdated: "2024-11-01",
  },
  "3 wing lok street": {
    address: "3 Wing Lok Street, Sheung Wan, HK Island",
    buildingType: "Composite",
    buildingUsage: "Domestic/Commercial",
    blockId: "HK-SW-0892",
    occupationPermitDate: "1987-11-30",
    occupationPermitNumber: "OP/HK/1987/0892",
    lastUpdated: "2024-11-01",
  },
  "15 carnarvon road": {
    address: "15 Carnarvon Road, Tsim Sha Tsui, Kowloon",
    buildingType: "Residential",
    buildingUsage: "Domestic",
    blockId: "KL-TST-3341",
    occupationPermitDate: "2001-09-08",
    occupationPermitNumber: "OP/KL/2001/3341",
    lastUpdated: "2024-11-01",
  },
};

// TODO: Replace mock with live fetch from Buildings Department dangerous buildings dataset.
// Source: data.gov.hk Buildings Department statutory orders open data.
const MOCK_STATUTORY_ORDERS: Record<string, StatutoryOrder[]> = {
  "18 hoi fai road": [
    {
      id: "so-001",
      type: "Unauthorised Building Works",
      issuedDate: "2023-08-12",
      status: "Outstanding",
      section: "Section 24",
      description: "Removal of unauthorised rooftop structures",
    },
    {
      id: "so-002",
      type: "Repair Order",
      issuedDate: "2024-01-05",
      status: "In Progress",
      section: "Section 26",
      description: "External wall repair required",
    },
  ],
  "3 wing lok street": [
    {
      id: "so-003",
      type: "Dangerous Building",
      issuedDate: "2023-11-20",
      status: "Outstanding",
      section: "Section 26",
      description: "Structural inspection required — building exceeds 50 years",
    },
  ],
};

// ── Public API ────────────────────────────────────────────────────────────────

function addressKey(address: string): string {
  return address.toLowerCase().split(",")[0].trim();
}

/**
 * Fetch building data from the Buildings Department, HKSAR.
 * Simulates async network latency for realistic skeleton loading.
 */
export async function fetchBuildingData(address: string): Promise<GovBuildingData | null> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  return MOCK_BUILDING_DATA[addressKey(address)] ?? null;
}

/**
 * Fetch statutory orders for a given address.
 * Returns empty array for buildings with a clean record.
 */
export async function fetchStatutoryOrders(address: string): Promise<StatutoryOrder[]> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return MOCK_STATUTORY_ORDERS[addressKey(address)] ?? [];
}
