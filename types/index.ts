export interface MarketTicker {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  volume24h: number;
  image: string;
  lastUpdated: Date;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface InvestmentPlanType {
  id: string;
  name: string;
  badge: string | null;
  minAmount: number;
  maxAmount: number | null;
  durationDays: number;
  roiPercent: number;
  dailyRoiPercent: number | null;
  referralBonus: number;
  description: string | null;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserType {
  id: string;
  email: string;
  emailVerified: Date | null;
  phone: string | null;
  phoneVerified: boolean;
  firstName: string;
  lastName: string;
  image: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  kycStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  balance: number;
  totalInvested: number;
  totalEarned: number;
  referralCode: string;
  referredBy: string | null;
  referralEarnings: number;
  totalWithdrawn: number;
  isTwoFactorEnabled: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  lastLoginAt: Date | null;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCType {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  nationality: string | null;
  address: string | null;
  idType: string | null;
  idFrontUrl: string | null;
  idBackUrl: string | null;
  selfieUrl: string | null;
  poaUrl: string | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionType {
  id: string;
  userId: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "INVESTMENT" | "RETURN" | "REFERRAL_BONUS" | "ADMIN_CREDIT" | "ADMIN_DEBIT";
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  method: string | null;
  proofUrl: string | null;
  note: string | null;
  accountDetails: string | null;
  fee: number;
  processedBy: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestmentType {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  expectedReturn: number;
  dailyEarning: number | null;
  startDate: Date;
  endDate: Date;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "PENDING";
  earnings: number;
  lastCreditedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  plan?: InvestmentPlanType;
}

export interface NotificationType {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
}

export interface SiteSettingType {
  id: string;
  key: string;
  value: string;
}

export interface DashboardStats {
  totalBalance: number;
  totalInvested: number;
  totalEarned: number;
  totalWithdrawn: number;
  activeInvestments: number;
  totalInvestments: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  referralEarnings: number;
  referralCount: number;
  recentTransactions: TransactionType[];
  activeInvestmentPlans: InvestmentPlanType[];
  chartData: ChartDataPoint[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
