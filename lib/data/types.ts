export interface StatutoryOrder {
  id: string;
  type: "Dangerous Building" | "Unauthorised Building Works" | "Repair Order";
  issuedDate: string;
  status: "Outstanding" | "Complied" | "In Progress";
  section: string;
  description: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  district: string;
  region: "Kowloon" | "HK Island" | "New Territories";
  market: string;
  buildingType: string;
  floors: number;
  units: number;
  occupationPermitDate: string;
  occupationPermitNumber: string;
  blockId: string;
  govDataLastUpdated: string;
  statutoryOrders: StatutoryOrder[];
  landlords: string[];
  avgRating: number;
  totalReviews: number;
}

export interface RedFlag {
  type: string;
  count: number;
  label: string;
}

export interface Landlord {
  id: string;
  name: string;
  company: string;
  verified: boolean;
  verifiedDate?: string;
  activeMarkets: string[];
  activeSince: string;
  totalProperties: number;
  properties: string[];
  avgRating: number;
  totalReviews: number;
  ratings: {
    depositReturn: number;
    responsiveness: number;
    listingAccuracy: number;
    maintenance: number;
    renewalFairness: number;
  };
  redFlags: RedFlag[];
}

export interface Review {
  id: string;
  landlordId: string;
  buildingId: string;
  flatRef: string;
  rating: number;
  headline: string;
  body: string;
  pros?: string;
  cons?: string;
  verifiedTenant: boolean;
  district: string;
  market: string;
  datePosted: string;
  helpfulCount: number;
  dimensions: {
    depositReturn: number;
    responsiveness: number;
    listingAccuracy: number;
    maintenance: number;
    renewalFairness: number;
  };
}

export interface SearchResult {
  type: "building" | "landlord";
  id: string;
  name: string;
  address?: string;
  district: string;
  market: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  govDataAvailable: boolean;
}
