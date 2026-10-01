import { randomInt } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { decodeEventLog, erc20Abi, isHash, type Hash } from 'viem'
import { db } from '@/lib/db'
import { digs, players } from '@/lib/db/schema'
import { publicClient } from '@/lib/zesto/chain'
import {
  CHARACTER_BY_ID,
  DIG_COST_WEI,
  RARITIES,
  RARITY_BY_ID,
  TREASURY_ADDRESS,
  ZESTO_ADDRESS,
  calculatePoints,
  getLevel,
  isCharacterId,
  type RarityId,
} from '@/lib/zesto/config'

const RARITY_ORDER: RarityId[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

function rollRarity() {
  const total = RARITIES.reduce((sum, r) => sum + r.weight, 0)
  let roll = randomInt(0, total * 100) / 100
  for (const rarity of RARITIES) {
    if (roll < rarity.weight) return rarity
    roll -= rarity.weight
  }
  return RARITIES[0]
}

async function findPayment(txHash: Hash) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 45_000 })
  if (receipt.status !== 'success') return null

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== ZESTO_ADDRESS.toLowerCase()) continue
    try {
      const event = decodeEventLog({ abi: erc20Abi, data: log.data, topics: log.topics })
      if (event.eventName !== 'Transfer') continue
      const { from, to, value } = event.args
      if (
        from.toLowerCase() === receipt.from.toLowerCase() &&
        to.toLowerCase() === TREASURY_ADDRESS.toLowerCase() &&
        value >= DIG_COST_WEI
      ) {
        return from.toLowerCase()
      }
    } catch {
      continue
    }
  }
  return null
}

export async function POST(request: Request) {
  let body: { txHash?: unknown; character?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { txHash, character } = body
  if (typeof txHash !== 'string' || !isHash(txHash)) {
    return Response.json({ error: 'Invalid transaction hash' }, { status: 400 })
  }
  if (!isCharacterId(character)) {
    return Response.json({ error: 'Unknown character' }, { status: 400 })
  }

  const normalizedHash = txHash.toLowerCase()
  const existing = await db.select({ id: digs.id }).from(digs).where(eq(digs.txHash, normalizedHash)).limit(1)
  if (existing.length > 0) {
    return Response.json({ error: 'This dig has already been claimed' }, { status: 409 })
  }

  let wallet: string | null
  try {
    wallet = await findPayment(normalizedHash as Hash)
  } catch {
    return Response.json({ error: 'Could not confirm the transaction yet. Please try again shortly.' }, { status: 502 })
  }
  if (!wallet) {
    return Response.json({ error: 'No valid 100 $ZESTO dig payment found in this transaction' }, { status: 400 })
  }

  const [player] = await db.select().from(players).where(eq(players.wallet, wallet)).limit(1)
  const levelBefore = getLevel(player?.totalPoints ?? 0).level
  const rarity = rollRarity()
  const hero = CHARACTER_BY_ID[character]
  const reward = calculatePoints(rarity, hero, levelBefore)

  const currentBest = player?.bestRarity as RarityId | null | undefined
  const bestRarity =
    currentBest && RARITY_ORDER.indexOf(currentBest) >= RARITY_ORDER.indexOf(rarity.id) ? currentBest : rarity.id

  try {
    const result = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(digs)
        .values({
          wallet,
          txHash: normalizedHash,
          character,
          rarity: rarity.id,
          item: rarity.item,
          points: reward.points,
        })
        .onConflictDoNothing({ target: digs.txHash })
        .returning({ id: digs.id })

      if (inserted.length === 0) return null

      const [updated] = await tx
        .insert(players)
        .values({ wallet, character, totalPoints: reward.points, totalDigs: 1, bestRarity })
        .onConflictDoUpdate({
          target: players.wallet,
          set: {
            character,
            totalPoints: sql`${players.totalPoints} + ${reward.points}`,
            totalDigs: sql`${players.totalDigs} + 1`,
            bestRarity,
            updatedAt: new Date(),
          },
        })
        .returning()
      return updated
    })

    if (!result) {
      return Response.json({ error: 'This dig has already been claimed' }, { status: 409 })
    }

    const levelAfter = getLevel(result.totalPoints)
    return Response.json({
      rarity: RARITY_BY_ID[rarity.id],
      points: reward.points,
      basePoints: rarity.points,
      perkPercent: reward.perkPercent,
      levelPercent: reward.levelPercent,
      totalPoints: result.totalPoints,
      totalDigs: result.totalDigs,
      level: levelAfter.level,
      leveledUp: levelAfter.level > levelBefore,
    })
  } catch {
    return Response.json({ error: 'Failed to record your dig. Please contact support with your tx hash.' }, { status: 500 })
  }
}
