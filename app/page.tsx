import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            למדו אוצר מילים באנגלית בצורה משחקית
          </h1>
          <p className="text-xl text-gray-700 mb-12">
            LexiPlay - פלטפורמה אינטראקטיבית ללימוד אוצר מילים באנגלית עם שלבים מובנים ומשחקי טריוויה
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-white border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              התחברות
            </Link>
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              הרשמה
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-primary mb-4">שלבים מובנים</h2>
              <p className="text-gray-600">
                10 שלבים עם מאות מילים בכל שלב. התקדמו בקצב שלכם ותראו את ההתקדמות שלכם.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-accent-teal mb-4">משחקי טריוויה</h2>
              <p className="text-gray-600">
                תרגלו את המילים שלכם במשחקי טריוויה מהירים ומהנים עם משוב מיידי.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-accent-orange mb-4">מעקב התקדמות</h2>
              <p className="text-gray-600">
                צפו בסטטיסטיקות מפורטות, רצפים יומיים והתקדמות בכל שלב.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
    </>
  )
}

