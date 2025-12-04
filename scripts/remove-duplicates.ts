import * as fs from 'fs'
import * as path from 'path'

interface Word {
  enWord: string
  heTranslation: string
  exampleSentence: string | null
}

// Load all stage files
function loadStage(stageNum: number): Word[] {
  const filePath = path.join(__dirname, '../prisma/words', `stage${stageNum}.json`)
  if (!fs.existsSync(filePath)) {
    return []
  }
  const content = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(content) as Word[]
}

// Remove duplicates within a stage (keep first occurrence)
function removeDuplicatesWithinStage(words: Word[]): Word[] {
  const seen = new Set<string>()
  const result: Word[] = []
  
  for (const word of words) {
    const key = word.enWord.toLowerCase().trim()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(word)
    }
  }
  
  return result
}

// Remove words that appear in lower-numbered stages
function removeCrossStageDuplicates(allStages: Word[][]): Word[][] {
  const cleanedStages: Word[][] = []
  const seenAcrossStages = new Set<string>()
  
  for (let i = 0; i < allStages.length; i++) {
    const stage = allStages[i]
    const cleaned: Word[] = []
    
    for (const word of stage) {
      const key = word.enWord.toLowerCase().trim()
      
      // If we've seen this word in a lower stage, skip it
      if (seenAcrossStages.has(key)) {
        continue
      }
      
      // Add to cleaned stage and mark as seen
      cleaned.push(word)
      seenAcrossStages.add(key)
    }
    
    cleanedStages.push(cleaned)
  }
  
  return cleanedStages
}

async function main() {
  console.log('Loading all stage files...')
  
  // Load all stages
  const allStages: Word[][] = []
  for (let i = 1; i <= 10; i++) {
    const words = loadStage(i)
    allStages.push(words)
    console.log(`Stage ${i}: ${words.length} words`)
  }
  
  console.log('\nRemoving duplicates within each stage...')
  
  // First, remove duplicates within each stage
  const deduplicatedStages: Word[][] = []
  for (let i = 0; i < allStages.length; i++) {
    const cleaned = removeDuplicatesWithinStage(allStages[i])
    const removed = allStages[i].length - cleaned.length
    if (removed > 0) {
      console.log(`Stage ${i + 1}: Removed ${removed} duplicate(s) within stage`)
    }
    deduplicatedStages.push(cleaned)
  }
  
  console.log('\nRemoving duplicates across stages (keeping in lower stages)...')
  
  // Then, remove cross-stage duplicates (keep in lower stages)
  const finalStages = removeCrossStageDuplicates(deduplicatedStages)
  
  // Report changes
  let totalRemoved = 0
  for (let i = 0; i < finalStages.length; i++) {
    const original = deduplicatedStages[i].length
    const cleaned = finalStages[i].length
    const removed = original - cleaned
    if (removed > 0) {
      console.log(`Stage ${i + 1}: Removed ${removed} word(s) that appear in lower stages`)
      totalRemoved += removed
    }
  }
  
  console.log(`\nTotal words removed across stages: ${totalRemoved}`)
  
  // Save cleaned files
  console.log('\nSaving cleaned files...')
  const wordsDir = path.join(__dirname, '../prisma/words')
  
  for (let i = 0; i < finalStages.length; i++) {
    const filePath = path.join(wordsDir, `stage${i + 1}.json`)
    fs.writeFileSync(filePath, JSON.stringify(finalStages[i], null, 2), 'utf8')
    console.log(`Stage ${i + 1}: ${finalStages[i].length} words (saved)`)
  }
  
  console.log('\nDone!')
}

main().catch(console.error)

