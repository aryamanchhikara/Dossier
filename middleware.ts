import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/profile/:path*',
    '/api/taste/:path*',
    '/api/currently/:path*',
    '/api/widgets/:path*',
    '/api/github/authorize',
    '/api/github/repos',
  ],
}
