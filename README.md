# LexiPlay - English Vocabulary Learning Platform

LexiPlay is a Hebrew-first English vocabulary learning platform designed for native Hebrew speakers. It features structured vocabulary progression, interactive trivia games, and comprehensive progress tracking.

## Features

- **10 Vocabulary Stages**: ~300 words per stage, progressing from beginner to advanced
- **Interactive Trivia Games**: 15-question rounds with customizable difficulty and settings
- **Global Word Library**: Search and filter words across all stages
- **Progress Tracking**: Detailed statistics, streaks, and performance analytics
- **RTL Hebrew UI**: Fully right-to-left interface optimized for Hebrew speakers
- **Star Rating System**: Track your knowledge level for each word (1-5 stars)
- **Personal Notes**: Add custom notes to words for better memorization

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Authentication**: Cookie-based sessions

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Git

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Create database and run migrations
npm run db:push

# Seed the database with stages and words
npm run db:seed
```

3. Create a `.env.local` file (optional, defaults are fine for development):
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── stages/            # Vocabulary stages
│   ├── library/           # Global word library
│   ├── trivia/             # Trivia game
│   ├── stats/             # Statistics page
│   └── account/           # Account settings
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/                # Database schema and seed
└── public/                # Static assets
```

## Database Schema

- **User**: User accounts and authentication
- **Stage**: Vocabulary stages (1-10)
- **Word**: English words with Hebrew translations
- **UserWordProgress**: Per-user word progress (stars, notes, stats)
- **TriviaGameSession**: Trivia game sessions
- **TriviaRound**: Individual trivia rounds
- **UserDailyActivity**: Daily activity tracking for streaks

## Key Features Implementation

### Vocabulary Stages
- 10 stages with ~300 words each
- Stage unlocking based on progress (60% completion)
- RTL table view with inline editing
- Star rating (1-5) and personal notes

### Trivia Game
- Pre-game settings (stages, difficulty, star filters, lives)
- 15-round gameplay with 15-second timer
- Scoring system with streak bonuses
- Automatic star rating updates based on performance
- End-of-game summary with incorrect/improved words

### Statistics
- Overall progress metrics
- Stage completion charts
- Trivia performance over time
- Daily streak tracking

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with initial data
- `npm run admin:reset-password` - Reset a user's password (admin tool)

### Adding New Words

To add more words to the database, edit `prisma/seed.ts` and run:
```bash
npm run db:seed
```

### Admin Tools

#### Password Reset

If a user forgets their password, you can reset it using the admin tool:

```bash
npm run admin:reset-password
```

The script will:
1. Prompt for the user's email address
2. Check if the user exists in the database
3. Prompt for a new password (min 6 characters)
4. Ask for confirmation
5. Update the password in the database

**Example:**
```bash
$ npm run admin:reset-password

=================================
    Password Reset Admin Tool    
=================================

Enter user email: user@example.com
✅ User found: user@example.com
   Display Name: John Doe
   Created: 12/4/2024

Enter new password (min 6 characters): newPassword123

⚠️  Are you sure you want to reset the password for "user@example.com"? (yes/no): yes

🔒 Hashing password...
💾 Updating database...

✅ Password reset successful!
   User: user@example.com
   New Password: newPassword123

⚠️  Make sure to share the new password securely with the user.
   Recommend they change it after logging in.
```

**Note:** Passwords are stored as hashed values using bcrypt, so you cannot retrieve the original password. This tool is the only way to reset a user's password.

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set up environment variables in your hosting platform

3. For production, consider:
   - Using PostgreSQL instead of SQLite
   - Setting up proper session management
   - Adding rate limiting
   - Enabling HTTPS
   - Setting up proper error tracking

## License

This project is built as an MVP for educational purposes.

## Support

For issues or questions, please check the codebase or create an issue in the repository.

