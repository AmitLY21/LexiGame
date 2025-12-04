import { hashPassword } from '../lib/auth'
import { prisma } from '../lib/prisma'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer)
    })
  })
}

async function resetPassword() {
  console.log('=================================')
  console.log('    Password Reset Admin Tool    ')
  console.log('=================================\n')

  try {
    // Get user email
    const email = await question('Enter user email: ')
    
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address')
      rl.close()
      process.exit(1)
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!user) {
      console.error(`❌ User with email "${email}" does not exist in the database`)
      rl.close()
      process.exit(1)
    }

    console.log(`✅ User found: ${user.email}`)
    console.log(`   Display Name: ${user.displayName || 'N/A'}`)
    console.log(`   Created: ${user.createdAt.toLocaleDateString()}\n`)

    // Get new password
    const newPassword = await question('Enter new password (min 6 characters): ')

    if (!newPassword || newPassword.length < 6) {
      console.error('❌ Password must be at least 6 characters long')
      rl.close()
      process.exit(1)
    }

    // Confirm action
    const confirm = await question(`\n⚠️  Are you sure you want to reset the password for "${email}"? (yes/no): `)

    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Password reset cancelled')
      rl.close()
      process.exit(0)
    }

    // Hash the new password
    console.log('\n🔒 Hashing password...')
    const passwordHash = await hashPassword(newPassword)

    // Update the user's password
    console.log('💾 Updating database...')
    await prisma.user.update({
      where: { email: user.email },
      data: { 
        passwordHash
      }
    })

    console.log('\n✅ Password reset successful!')
    console.log(`   User: ${email}`)
    console.log(`   New Password: ${newPassword}`)
    console.log('\n⚠️  Make sure to share the new password securely with the user.')
    console.log('   Recommend they change it after logging in.\n')

  } catch (error) {
    console.error('\n❌ Error resetting password:', error)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

// Run the script
resetPassword()

