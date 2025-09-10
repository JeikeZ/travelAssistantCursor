import Link from 'next/link'

export default function SimplePage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#2563eb', fontSize: '36px', marginBottom: '20px' }}>
        🧳 Travel Assistant
      </h1>
      <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '30px' }}>
        Your deployment is working! The Travel Assistant is ready.
      </p>
      <Link 
        href="/" 
        style={{ 
          backgroundColor: '#2563eb', 
          color: 'white', 
          padding: '12px 24px', 
          textDecoration: 'none', 
          borderRadius: '8px',
          display: 'inline-block'
        }}
      >
        Go to Full App
      </Link>
    </div>
  )
}