import { prisma } from "./prisma"

export async function processInvestmentReturns() {
  const activeInvestments = await prisma.investment.findMany({
    where: { status: "ACTIVE" },
    include: { user: true, plan: true },
  })

  const results = { processed: 0, completed: 0, errors: 0, details: [] as string[] }

  for (const inv of activeInvestments) {
    try {
      const now = new Date()
      const endDate = new Date(inv.endDate)
      const lastCredited = inv.lastCreditedAt ? new Date(inv.lastCreditedAt) : new Date(inv.startDate)

      const hoursSinceLastCredit = (now.getTime() - lastCredited.getTime()) / (1000 * 60 * 60)

      if (hoursSinceLastCredit < 23) {
        continue
      }

      if (now >= endDate) {
        await prisma.$transaction(async (tx) => {
          const remainingEarnings = Number(inv.expectedReturn) - Number(inv.earnings)
          if (remainingEarnings > 0) {
            await tx.user.update({
              where: { id: inv.userId },
              data: {
                balance: { increment: remainingEarnings },
                totalEarned: { increment: remainingEarnings },
              },
            })
            await tx.transaction.create({
              data: {
                userId: inv.userId,
                type: "RETURN",
                amount: remainingEarnings,
                status: "APPROVED",
                note: `Final return on ${inv.plan.name}`,
              },
            })
          }
          await tx.investment.update({
            where: { id: inv.id },
            data: { status: "COMPLETED", lastCreditedAt: now, earnings: Number(inv.expectedReturn) },
          })
          await tx.notification.create({
            data: {
              userId: inv.userId,
              title: "Investment Completed",
              message: `Your investment of $${inv.amount} in ${inv.plan.name} has matured. Final return: $${inv.expectedReturn}`,
              type: "SUCCESS",
            },
          })
        })
        results.completed++
        results.details.push(`Completed investment ${inv.id} for user ${inv.userId}`)
        continue
      }

      const dailyEarning = Number(inv.dailyEarning) || 0
      if (dailyEarning <= 0) continue

      const daysSinceStart = Math.floor((now.getTime() - new Date(inv.startDate).getTime()) / (1000 * 60 * 60 * 24))
      const maxCredits = Math.min(daysSinceStart, inv.plan.durationDays)
      const creditsGiven = inv.lastCreditedAt
        ? Math.floor((now.getTime() - new Date(inv.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0
      const creditsToProcess = Math.max(0, maxCredits - creditsGiven)

      if (creditsToProcess <= 0) continue

      const earningsToAdd = dailyEarning * creditsToProcess
      const newEarnings = Number(inv.earnings) + earningsToAdd
      const cappedEarnings = Math.min(newEarnings, Number(inv.expectedReturn) - Number(inv.amount))

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: inv.userId },
          data: {
            balance: { increment: earningsToAdd },
            totalEarned: { increment: earningsToAdd },
          },
        })
        await tx.transaction.create({
          data: {
            userId: inv.userId,
            type: "RETURN",
            amount: earningsToAdd,
            status: "APPROVED",
            note: `Daily return on ${inv.plan.name} (${creditsToProcess} day${creditsToProcess > 1 ? "s" : ""})`,
          },
        })
        await tx.investment.update({
          where: { id: inv.id },
          data: {
            earnings: { increment: earningsToAdd },
            lastCreditedAt: now,
          },
        })
      })

      results.processed++
      results.details.push(`Credited ${earningsToAdd} to investment ${inv.id} (${creditsToProcess} days)`)
    } catch (err) {
      results.errors++
      results.details.push(`Error processing investment ${inv.id}: ${err instanceof Error ? err.message : "Unknown"}`)
    }
  }

  return results
}
