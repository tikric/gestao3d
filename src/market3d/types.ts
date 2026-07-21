export interface Category {
  id: string;
  name: string;
  iconName: string; // Lucide icon identifier
  color: string; // Tailwind classes for bg/text
  imageUrl?: string; // Optional image for category
}

export interface ProductDeal {
  id: string;
  title: string;
  description: string;
  priceOriginal: number;
  pricePromo: number;
  discount: number; // percentage (e.g. 45 for 45% off)
  category: string; // matches Category.id
  shopeeUrl: string; // Affiliate link
  imageUrl: string;
  rating: number; // 1-5 scale
  salesCount: number; // e.g. 1500+ vendidos
  couponCode?: string;
  isHot?: boolean;
  createdAt: string;
}

export interface SiteSettings {
  title: string;
  subtitle: string;
  telegramLink: string;
  whatsappLink: string;
  instagramLink: string;
  bannerText: string;
}

export interface SellerReport {
  id: string;
  categoryId: string;
  rank: string;
  title: string;
  description: string;
  priceRange: string;
  pricePromo: number;
  materialCost: number;
  monthlySales: number;
  estimatedMargin: number;
  reviewsRating: number;
  reviewsCount: number;
  competitorsCount: number;
  trend: string;
  dailySalesEst: number;
  printHours: number;
  filamentGrams: number;
  peakDemand: string;
  keywords: string[];
  competitorStores: string[];
  historyData: { month: string; sales: number }[];
  shopeeLink: string;
  imageUrl: string;
  slicerTips: string;
  finishingTips: string;
  listingSEO: string;
}
