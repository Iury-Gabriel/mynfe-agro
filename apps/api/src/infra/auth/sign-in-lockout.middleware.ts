import type { SignInLockoutService } from './sign-in-lockout.service'
import type { RequestHandler } from 'express'

interface SignInBody {
  email?: string
}

function parseBody(raw: unknown): SignInBody {
  if (typeof raw === 'string') return JSON.parse(raw) as SignInBody
  if (Buffer.isBuffer(raw)) return JSON.parse(raw.toString()) as SignInBody
  return (raw as SignInBody | null | undefined) ?? {}
}

export function createSignInLockoutMiddleware(lockout: SignInLockoutService): RequestHandler {
  return async (req, res, next) => {
    let email: string | undefined
    try {
      email = parseBody(req.body).email?.toLowerCase().trim()
    } catch (err) {
      console.error('[SignInLockoutMiddleware] error parsing request body:', err)
      res.status(400).json({ error: 'invalid_request_body' })
      return
    }

    if (!email) {
      next()
      return
    }

    if (await lockout.isBlocked(email)) {
      res.status(429).json({ error: 'too_many_attempts' })
      return
    }

    const settle = (): void => {
      void (res.statusCode >= 200 && res.statusCode < 300
        ? lockout.clear(email)
        : lockout.registerFailure(email))
    }
    res.once('finish', settle)

    next()
  }
}
