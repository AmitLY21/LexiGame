import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

type WordTuple = [string, string, string?]

// Load words from JSON files
function loadWordsFromFile(stageNum: number): WordTuple[] {
  const filePath = path.join(__dirname, 'words', `stage${stageNum}.json`)
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: stage${stageNum}.json not found`)
    return []
  }
  
  const content = fs.readFileSync(filePath, 'utf8')
  const words = JSON.parse(content) as Array<{
    enWord: string
    heTranslation: string
    exampleSentence: string | null
  }>
  
  return words.map(w => [w.enWord, w.heTranslation, w.exampleSentence || undefined])
}

function uniqueByEnWord(words: WordTuple[]): WordTuple[] {
  const seen = new Set<string>()
  const result: WordTuple[] = []

  for (const w of words) {
    const [en] = w
    if (!seen.has(en)) {
      seen.add(en)
      result.push(w)
    }
  }

  return result
}

function generateWordsForStage(stage: number): WordTuple[] {
  // Load words from JSON file
  const words = loadWordsFromFile(stage)
  
  if (words.length === 0) {
    console.warn(`No words found for stage ${stage}`)
    return []
  }
  
  // Remove duplicates and return
  return uniqueByEnWord(words)
}

async function main() {
  console.log('Starting seed...')

  // Create stages
  const stages = []
  for (let i = 1; i <= 10; i++) {
    const stage = await prisma.stage.upsert({
      where: { id: i },
      update: {},
      create: {
        id: i,
        nameHe: `שלב ${i}${i === 1 ? ' – מתחילים' : i <= 3 ? ' – בינוני' : i <= 6 ? ' – מתקדם' : ' – מומחה'}`,
        descriptionHe: `שלב ${i} בלימוד אוצר המילים`,
        orderIndex: i,
        difficultyRange: i <= 3 ? '1-2' : i <= 6 ? '2-3' : '3',
      },
    })
    stages.push(stage)
    console.log(`Created stage ${i}`)
  }

  // Create words for each stage
  for (const stage of stages) {
    // Delete related records first (due to foreign key constraints)
    const existingWords = await prisma.word.findMany({
      where: { stageId: stage.id },
      select: { id: true },
    })

    if (existingWords.length > 0) {
      const wordIds = existingWords.map(w => w.id)
      
      // Delete user progress for these words
      await prisma.userWordProgress.deleteMany({
        where: { wordId: { in: wordIds } },
      })

      // Delete trivia rounds for these words
      await prisma.triviaRound.deleteMany({
        where: { wordId: { in: wordIds } },
      })

      // Now delete the words
      await prisma.word.deleteMany({
        where: { stageId: stage.id },
      })
    }

    const words = generateWordsForStage(stage.id)

    // Only use actual words, no duplication
    for (let i = 0; i < words.length; i++) {
      const [enWord, heTranslation, example] = words[i]
      const difficulty = stage.id <= 3 ? 1 : stage.id <= 6 ? 2 : 3

      await prisma.word.create({
        data: {
          stageId: stage.id,
          enWord,
          heTranslationDefault: heTranslation,
          exampleSentenceEn: example || null,
          difficultyLevel: difficulty,
        },
      })
    }
    console.log(`Created ${words.length} words for stage ${stage.id}`)
  }

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })