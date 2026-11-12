import { PrismaClient, UserRole, KYCStatus, TransactionStatus, InvestmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@investplatform.com" },
    update: {},
    create: {
      email: "admin@investplatform.com",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: UserRole.SUPER_ADMIN,
      kycStatus: KYCStatus.APPROVED,
      referralCode: "ADMIN001",
      balance: 100000,
      emailVerified: new Date(),
    },
  });

  const plans = [
    {
      name: "Starter",
      badge: "Beginner Friendly",
      minAmount: 25,
      maxAmount: 999,
      durationDays: 7,
      roiPercent: 5,
      dailyRoiPercent: 0.71,
      referralBonus: 3,
      features: ["Daily profit returns", "Capital included in return", "Instant withdrawals", "24/7 support"],
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Silver",
      badge: "Popular",
      minAmount: 1000,
      maxAmount: 4999,
      durationDays: 14,
      roiPercent: 12,
      dailyRoiPercent: 0.86,
      referralBonus: 4,
      features: ["Daily profit returns", "Capital included in return", "Instant withdrawals", "24/7 support", "Referral bonus"],
      isActive: true,
      sortOrder: 2,
    },
    {
      name: "Gold",
      badge: "Best Value",
      minAmount: 5000,
      maxAmount: 14999,
      durationDays: 21,
      roiPercent: 21,
      dailyRoiPercent: 1.0,
      referralBonus: 5,
      features: ["Daily profit returns", "Capital included in return", "Instant withdrawals", "Priority support", "Referral bonus", "Weekly market insights"],
      isActive: true,
      sortOrder: 3,
    },
    {
      name: "Platinum",
      badge: "Premium",
      minAmount: 15000,
      maxAmount: 49999,
      durationDays: 30,
      roiPercent: 35,
      dailyRoiPercent: 1.17,
      referralBonus: 6,
      features: ["Daily profit returns", "Capital included in return", "Instant withdrawals", "VIP support", "Increased referral bonus", "Weekly market insights", "Dedicated account manager"],
      isActive: true,
      sortOrder: 4,
    },
    {
      name: "Diamond",
      badge: "Elite",
      minAmount: 50000,
      maxAmount: 99999,
      durationDays: 45,
      roiPercent: 60,
      dailyRoiPercent: 1.33,
      referralBonus: 8,
      features: ["Daily profit returns", "Capital included in return", "Instant withdrawals", "VIP support", "Increased referral bonus", "Daily market insights", "Dedicated account manager", "Early access to new features"],
      isActive: true,
      sortOrder: 5,
    },
    {
      name: "Exclusive",
      badge: "Whale",
      minAmount: 100000,
      durationDays: 60,
      roiPercent: 100,
      dailyRoiPercent: 1.67,
      referralBonus: 10,
      features: ["Daily profit returns", "Capital included in return", "Instant withdrawals", "24/7 VIP support", "Maximum referral bonus", "Real-time market insights", "Personal wealth manager", "Early access to new features", "Custom investment strategies"],
      isActive: true,
      sortOrder: 6,
    },
  ];

  for (const plan of plans) {
    await prisma.investmentPlan.upsert({
      where: { id: plan.name.toLowerCase() },
      update: plan,
      create: { id: plan.name.toLowerCase(), ...plan },
    });
  }

  const siteSettings = [
    { key: "site_name", value: "InvestPro" },
    { key: "site_description", value: "Modern investment platform for everyone" },
    { key: "site_logo", value: "/logo.svg" },
    { key: "site_favicon", value: "/favicon.ico" },
    { key: "support_email", value: "support@investpro.com" },
    { key: "support_phone", value: "+1 (555) 000-0000" },
    { key: "min_deposit", value: "25" },
    { key: "max_deposit", value: "500000" },
    { key: "min_withdrawal", value: "10" },
    { key: "max_withdrawal", value: "100000" },
    { key: "withdrawal_fee_percent", value: "0" },
    { key: "withdrawal_fee_fixed", value: "0" },
    { key: "referral_bonus_percent", value: "5" },
    { key: "referral_bonus_type", value: "percentage" },
    { key: "kyc_required", value: "true" },
    { key: "kyc_required_for_withdrawal", value: "true" },
    { key: "auto_approve_deposits", value: "false" },
    { key: "allow_registration", value: "true" },
    { key: "maintenance_mode", value: "false" },
    { key: "currency_symbol", value: "$" },
    { key: "currency_code", value: "USD" },
    { key: "interest_crediting_hour", value: "0" },
    { key: "default_user_role", value: "USER" },
    { key: "terms_url", value: "/terms" },
    { key: "privacy_url", value: "/privacy" },
    { key: "primary_color", value: "#3b82f6" },
    { key: "secondary_color", value: "#10b981" },
  ];

  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  const paymentMethods = [
    {
      id: "bitcoin",
      type: "crypto",
      label: "Bitcoin",
      isActive: true,
      instructions: "Send BTC to the address below. Your deposit will be credited after 1 network confirmation.",
      walletAddress: "bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      sortOrder: 1,
    },
    {
      id: "ethereum",
      type: "crypto",
      label: "Ethereum",
      isActive: true,
      instructions: "Send ETH to the address below. Your deposit will be credited after 12 network confirmations.",
      walletAddress: "0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      sortOrder: 2,
    },
    {
      id: "usdt_trc20",
      type: "crypto",
      label: "USDT (TRC20)",
      isActive: true,
      instructions: "Send USDT (TRC20) to the address below. Minimum deposit: $25.",
      walletAddress: "TXxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      sortOrder: 3,
    },
    {
      id: "bank_transfer",
      type: "bank",
      label: "Bank Transfer",
      isActive: true,
      instructions: "Use the bank details below to make your transfer. Include your user ID as reference.",
      bankDetails: JSON.stringify({
        bankName: "Global Investment Bank",
        accountName: "InvestPro Ltd",
        accountNumber: "1234567890",
        routingNumber: "021000021",
        swiftCode: "GIBKUS33",
        iban: "US12 3456 7890 1234 5678 9012",
      }),
      sortOrder: 4,
    },
  ];

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { id: method.id },
      update: method,
      create: method,
    });
  }

  const emailTemplates = [
    {
      type: "WELCOME",
      subject: "Welcome to {{site_name}} - Start Your Investment Journey",
      body: `<h1>Welcome {{firstName}}!</h1><p>Thank you for joining {{site_name}}. You're now ready to start investing and growing your wealth.</p><p>Get started by making your first deposit and choosing an investment plan that suits your goals.</p><p>Best regards,<br>The {{site_name}} Team</p>`,
    },
    {
      type: "VERIFY_EMAIL",
      subject: "Verify Your Email Address",
      body: `<h1>Email Verification</h1><p>Hi {{firstName}},</p><p>Please use the code below to verify your email address:</p><h2 style="text-align:center;letter-spacing:5px;font-size:32px;">{{code}}</h2><p>This code expires in 15 minutes.</p>`,
    },
    {
      type: "RESET_PASSWORD",
      subject: "Reset Your Password",
      body: `<h1>Password Reset</h1><p>Hi {{firstName}},</p><p>We received a request to reset your password. Use the code below:</p><h2 style="text-align:center;letter-spacing:5px;font-size:32px;">{{code}}</h2><p>If you didn't request this, please ignore this email.</p>`,
    },
    {
      type: "DEPOSIT_CONFIRMED",
      subject: "Deposit Confirmed - {{amount}} {{currency}}",
      body: `<h1>Deposit Confirmed</h1><p>Hi {{firstName}},</p><p>Your deposit of <strong>{{amount}} {{currency}}</strong> has been confirmed and credited to your account.</p><p>You can now use your funds to invest in any of our plans.</p>`,
    },
    {
      type: "WITHDRAWAL_CONFIRMED",
      subject: "Withdrawal Completed - {{amount}} {{currency}}",
      body: `<h1>Withdrawal Completed</h1><p>Hi {{firstName}},</p><p>Your withdrawal of <strong>{{amount}} {{currency}}</strong> has been processed successfully.</p><p>Funds should arrive in your wallet within the expected timeframe based on your payment method.</p>`,
    },
    {
      type: "INVESTMENT_ACTIVATED",
      subject: "Investment Activated - {{plan}}",
      body: `<h1>Investment Activated</h1><p>Hi {{firstName}},</p><p>Your investment of <strong>{{amount}} {{currency}}</strong> in the <strong>{{plan}}</strong> plan is now active.</p><p>Expected return: <strong>{{expectedReturn}} {{currency}}</strong></p><p>Duration: {{duration}} days</p>`,
    },
    {
      type: "INVESTMENT_COMPLETED",
      subject: "Investment Completed - {{plan}}",
      body: `<h1>Investment Completed</h1><p>Hi {{firstName}},</p><p>Your <strong>{{plan}}</strong> investment has matured. You earned <strong>{{earnings}} {{currency}}</strong>.</p><p>Your capital of <strong>{{amount}} {{currency}}</strong> plus earnings is now available in your balance.</p>`,
    },
    {
      type: "KYC_APPROVED",
      subject: "KYC Verified Successfully",
      body: `<h1>KYC Approved</h1><p>Hi {{firstName}},</p><p>Your identity verification has been approved. You now have full access to all platform features including withdrawals.</p>`,
    },
    {
      type: "KYC_REJECTED",
      subject: "KYC Verification Needs Attention",
      body: `<h1>KYC Rejected</h1><p>Hi {{firstName}},</p><p>Unfortunately, your KYC verification was not approved.</p><p>Reason: {{reason}}</p><p>Please resubmit with correct documents.</p>`,
    },
    {
      type: "TWO_FACTOR_CODE",
      subject: "Your Two-Factor Authentication Code",
      body: `<h1>2FA Code</h1><p>Hi {{firstName}},</p><p>Your two-factor authentication code is:</p><h2 style="text-align:center;letter-spacing:5px;font-size:32px;">{{code}}</h2><p>This code expires in 5 minutes.</p>`,
    },
    {
      type: "ACCOUNT_SUSPENDED",
      subject: "Account Suspended",
      body: `<h1>Account Suspended</h1><p>Hi {{firstName}},</p><p>Your account has been suspended.</p><p>Reason: {{reason}}</p><p>Please contact support for more information.</p>`,
    },
    {
      type: "ACCOUNT_UNSUSPENDED",
      subject: "Account Reactivated",
      body: `<h1>Account Reactivated</h1><p>Hi {{firstName}},</p><p>Your account has been reactivated. You may now use all platform features again.</p>`,
    },
    {
      type: "REFERRAL_CREDIT",
      subject: "Referral Bonus Credited - {{amount}} {{currency}}",
      body: `<h1>Referral Bonus!</h1><p>Hi {{firstName}},</p><p>You've received a referral bonus of <strong>{{amount}} {{currency}}</strong> from your referral's investment.</p><p>Keep sharing your referral link to earn more!</p>`,
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { type: template.type as any },
      update: { subject: template.subject, body: template.body },
      create: template as any,
    });
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
