import Link from 'next/link'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">✅ Success!</h1>
        <p className="text-lg text-slate-700 mb-4">
          Your Travel Assistant is working correctly on Vercel!
        </p>
        <Link 
          href="/" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Travel Assistant
        </Link>
      </div>
    </div>
  )
}