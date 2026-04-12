import { Landlord } from "./types";

export const landlords: Landlord[] = [
  {
    id: "pacific-realty-holdings",
    name: "Pacific Realty Holdings Ltd",
    company: "Pacific Realty Holdings Ltd",
    verified: false,
    activeMarkets: ["Hong Kong"],
    activeSince: "2019",
    totalProperties: 3,
    properties: ["harbour-view-tower", "sheung-wan-plaza"],
    avgRating: 3.8,
    totalReviews: 47,
    ratings: {
      depositReturn: 2.9,
      responsiveness: 4.1,
      listingAccuracy: 3.6,
      maintenance: 3.2,
      renewalFairness: 4.4,
    },
    redFlags: [
      { type: "deposit", count: 14, label: "Deposit disputes reported" },
      { type: "maintenance", count: 8, label: "Delayed maintenance response" },
      { type: "listing", count: 6, label: "Property condition below listing standard" },
    ],
  },
  {
    id: "sunrise-property-group",
    name: "Sunrise Property Group Ltd",
    company: "Sunrise Property Group Ltd",
    verified: true,
    verifiedDate: "2024-06-01",
    activeMarkets: ["Hong Kong"],
    activeSince: "2015",
    totalProperties: 2,
    properties: ["metro-residences", "tst-court"],
    avgRating: 4.3,
    totalReviews: 89,
    ratings: {
      depositReturn: 4.2,
      responsiveness: 4.5,
      listingAccuracy: 4.1,
      maintenance: 4.0,
      renewalFairness: 4.6,
    },
    redFlags: [],
  },
];

export function getLandlordById(id: string): Landlord | undefined {
  return landlords.find((l) => l.id === id);
}
