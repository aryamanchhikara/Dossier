import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="label">404</p>
        <h1 className="font-serif text-4xl text-primary">Profile not found</h1>
        <p className="text-sm text-muted">This dossier doesn't exist — yet.</p>
        <Link href="/" className="btn inline-block mt-4 px-6 py-2">← Home</Link>
      </div>
    </main>
  )
}
