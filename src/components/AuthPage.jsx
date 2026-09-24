import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  CloudLightning,
  Eye,
  EyeClosed,
  KeyRound,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react'

import { API_BASE_URL, getApiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ClayButton } from './ui/ClayButton'
import { ClayIconBadge } from './ui/ClayIconBadge'
import { ClayInput } from './ui/ClayField'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6

const HIGHLIGHTS = [
  { icon: Sparkles, text: 'Clay-soft UI with buttery 3D depth' },
  { icon: ShieldCheck, text: 'JWT secured through OAuth2 bearer tokens' },
  { icon: CloudLightning, text: 'Snippets and files reachable from any device' },
]

/**
 * Claymorphic floating auth card. Login and Register share this component so the
 * switch between the two states is a single smooth, animated transition.
 */
export function AuthPage({ mode = 'login' }) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, status } = useAuth()

  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const redirectTo = location.state?.from || '/dashboard'

  /* Wipe the form whenever the user flips between login and register */
  useEffect(() => {
    setForm({ email: '', password: '', confirmPassword: '' })
    setErrors({})
    setShowPassword(false)
  }, [mode])

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />
  }

  const updateField = (field) => (event) => {
    const { value } = event.target
    setForm((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous))
  }

  const validate = () => {
    const next = {}
    const email = form.email.trim()

    if (!email) next.email = 'Enter your email address.'
    else if (!EMAIL_PATTERN.test(email)) next.email = 'That email address looks incomplete.'

    if (!form.password) next.password = 'Enter your password.'
    else if (form.password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    }

    if (!isLogin) {
      if (!form.confirmPassword) next.confirmPassword = 'Repeat your password.'
      else if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    if (!validate()) {
      toast.error('Please fix the highlighted fields.')
      return
    }

    setSubmitting(true)
    const credentials = { email: form.email.trim(), password: form.password }

    try {
      if (isLogin) {
        await signIn(credentials)
        toast.success('Welcome back!')
      } else {
        await signUp(credentials)
        toast.success('Account created — your bridge is live!')
      }
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const message = error?.response
        ? await getApiErrorMessage(
            error,
            isLogin ? 'Could not sign you in.' : 'Could not create your account.',
          )
        : error.message

      toast.error(message)
      setErrors((previous) => ({ ...previous, form: message }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Ambient clay blobs */}
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-float pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl"
      />

      <div className="relative grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        {/* Brand / hero panel */}
        <section className="animate-pop order-2 space-y-8 lg:order-1">
          <div className="flex items-center gap-4">
            <ClayIconBadge icon={CloudLightning} gradient="indigo" size="lg" className="animate-float" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-300">
                Personal Digital Bridge
              </p>
              <h1 className="clay-text-gradient text-3xl font-extrabold sm:text-4xl">
                Cloud ClipBoard
              </h1>
            </div>
          </div>

          <p className="max-w-md text-sm leading-relaxed text-clay-300 sm:text-base">
            Park a snippet on your laptop, grab it on your phone. One clay-soft workspace for text
            and files, powered by your FastAPI backend.
          </p>

          <ul className="space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-clay-200">
                <ClayIconBadge icon={Icon} gradient="slate" size="sm" className="shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Auth card */}
        <section
          key={mode}
          className="clay-panel rounded-clay-lg animate-pop order-1 p-6 sm:p-8 lg:order-2"
        >
          <div className="clay-tab-track flex rounded-full p-1.5">
            {[
              { key: 'login', label: 'Sign in', icon: LogIn, to: '/login' },
              { key: 'register', label: 'Create account', icon: UserPlus, to: '/register' },
            ].map(({ key, label, icon: Icon, to }) => (
              <button
                key={key}
                type="button"
                onClick={() => navigate(to)}
                aria-current={mode === key ? 'page' : undefined}
                className={`clay-tab flex-1 px-4 py-2.5 text-xs sm:text-sm ${
                  mode === key ? 'clay-tab-active' : ''
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-7">
            <h2 className="text-xl font-extrabold text-clay-50">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1 text-xs text-clay-400">
              {isLogin
                ? 'Sign in to unlock your clipboards.'
                : 'Takes a few seconds — then your bridge is ready.'}
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            {errors.form ? (
              <p
                role="alert"
                className="clay-inset-sm rounded-2xl px-4 py-3 text-xs font-semibold text-rose-200"
              >
                {errors.form}
              </p>
            ) : null}

            <ClayInput
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              icon={Mail}
              value={form.email}
              onChange={updateField('email')}
              error={errors.email}
              required
            />

            <div className="relative">
              <ClayInput
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? 'Your password' : `At least ${MIN_PASSWORD_LENGTH} characters`}
                icon={KeyRound}
                value={form.password}
                onChange={updateField('password')}
                error={errors.password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-4 top-[2.4rem] text-clay-400 transition hover:text-clay-100"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {!isLogin ? (
              <ClayInput
                id="confirmPassword"
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                icon={ShieldCheck}
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                error={errors.confirmPassword}
                required
              />
            ) : null}

            <ClayButton
              type="submit"
              variant={isLogin ? 'indigo' : 'mint'}
              size="lg"
              loading={submitting}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full"
            >
              {isLogin ? 'Sign in to dashboard' : 'Create account'}
            </ClayButton>
          </form>

          <p className="mt-6 text-center text-xs text-clay-400">
            {isLogin ? 'New to the bridge? ' : 'Already have an account? '}
            <button
              type="button"
              className="clay-link"
              onClick={() => navigate(isLogin ? '/register' : '/login')}
            >
              {isLogin ? 'Create an account' : 'Sign in instead'}
            </button>
          </p>

          <p
            className="mt-4 truncate text-center font-mono text-[0.68rem] text-clay-500"
            title={API_BASE_URL}
          >
            {API_BASE_URL}
          </p>
        </section>
      </div>
    </main>
  )
}

export default AuthPage
