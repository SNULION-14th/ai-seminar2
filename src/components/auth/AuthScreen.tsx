import { useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { AuthRecord, House, UserProfile } from '../../types/models'

type AuthView = 'login' | 'signup' | 'forgot'

interface AuthScreenProps {
  auth: AuthRecord | null
  onLogin: (email: string, password: string, remembered: boolean) => string | null
  onSignUp: (profile: UserProfile, password: string) => void
  onBack: () => void
}

const houses: { id: House; label: string }[] = [
  { id: 'gryffindor', label: 'Gryffindor' },
  { id: 'slytherin', label: 'Slytherin' },
  { id: 'ravenclaw', label: 'Ravenclaw' },
  { id: 'hufflepuff', label: 'Hufflepuff' },
]

const yearLabels = [
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
  'Fifth Year',
  'Sixth Year',
  'Seventh Year',
]

export function AuthScreen({ auth, onLogin, onSignUp, onBack }: AuthScreenProps) {
  const [view, setView] = useState<AuthView>(auth ? 'login' : 'signup')
  const [error, setError] = useState('')

  return (
    <main className="auth-screen">
      <section className="auth-environment" aria-label="StudyinHogwart academic hall">
        <div className="auth-brand">
          <span>EST. ACADEMIC YEAR 2026</span>
          <h1>StudyinHogwart</h1>
          <p>A quieter way to organise your term.</p>
        </div>
        <div className="stars" aria-hidden="true" />
        <div className="arches" aria-hidden="true" />
        <div className="candles" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
        </div>
      </section>

      <section className="auth-panel-wrap">
        <div className="parchment auth-card">
          <header className="auth-card-brand">
            <strong>StudyinHogwart</strong>
            <span>ACADEMIC PLANNER</span>
          </header>
          {view === 'login' && (
            <LoginForm
              defaultEmail={auth?.remembered ? auth.email : ''}
              error={error}
              onForgot={() => { setError(''); setView('forgot') }}
              onSubmit={(email, password, remembered) => {
                const message = onLogin(email, password, remembered)
                setError(message ?? '')
                if (!message) onBack()
              }}
              onSignUp={() => { setError(''); setView('signup') }}
            />
          )}
          {view === 'signup' && (
            <SignUpForm
              onLogin={() => setView('login')}
              onSubmit={(profile, password) => {
                onSignUp(profile, password)
                onBack()
              }}
            />
          )}
          {view === 'forgot' && <ForgotPassword onBack={() => setView('login')} />}
          <footer>Hogwarts Library · Student Records · Academic Year 2026–27</footer>
        </div>
      </section>
    </main>
  )
}

function PasswordField({ value, onChange, id, label = 'Password', placeholder = '••••••••' }: {
  value: string
  onChange: (value: string) => void
  id: string
  label?: string
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="field-label" htmlFor={id}>
      <span>{label}</span>
      <span className="password-field">
        <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required />
        <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((current) => !current)}>
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </span>
    </label>
  )
}

function LoginForm({ defaultEmail, error, onSubmit, onForgot, onSignUp }: {
  defaultEmail: string
  error: string
  onSubmit: (email: string, password: string, remembered: boolean) => void
  onForgot: () => void
  onSignUp: () => void
}) {
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState('')
  const [remembered, setRemembered] = useState(Boolean(defaultEmail))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(email.trim(), password, remembered)
  }
  return (
    <form onSubmit={submit} className="auth-form">
      <div className="form-heading"><h2>Welcome back</h2><p>Return to your timetable, assignments, and study sessions.</p></div>
      <label className="field-label" htmlFor="login-email"><span>Email</span><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <PasswordField id="login-password" value={password} onChange={setPassword} />
      <div className="auth-options">
        <label><input type="checkbox" checked={remembered} onChange={(event) => setRemembered(event.target.checked)} /> Remember me</label>
        <button type="button" className="text-button" onClick={onForgot}>Forgot password?</button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-action" type="submit">Log in</button>
      <p className="auth-switch">New to StudyinHogwart? <button type="button" className="text-button" onClick={onSignUp}>Create an account</button></p>
    </form>
  )
}

function SignUpForm({ onSubmit, onLogin }: { onSubmit: (profile: UserProfile, password: string) => void; onLogin: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [house, setHouse] = useState<House>('ravenclaw')
  const [year, setYear] = useState(1)
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 8) return setError('Password must contain at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    onSubmit({ name: name.trim(), email: email.trim(), house, year }, password)
  }
  return (
    <form onSubmit={submit} className="auth-form signup-form">
      <div className="form-heading"><h2>Begin your term</h2><p>Create your StudyinHogwart student record.</p></div>
      <label className="field-label" htmlFor="signup-name"><span>Name</span><input id="signup-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required /></label>
      <label className="field-label" htmlFor="signup-email"><span>Email</span><input id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" required /></label>
      <PasswordField id="signup-password" value={password} onChange={setPassword} placeholder="Min. 8 characters" />
      <PasswordField id="signup-confirm" label="Confirm password" value={confirm} onChange={setConfirm} placeholder="Repeat password" />
      <fieldset className="choice-field"><legend>House</legend><div className="house-choices">{houses.map((item) => <label key={item.id} className={`house-choice ${item.id} ${house === item.id ? 'selected' : ''}`}><input type="radio" name="house" value={item.id} checked={house === item.id} onChange={() => setHouse(item.id)} /><span>{item.label}</span></label>)}</div></fieldset>
      <label className="field-label" htmlFor="signup-year"><span>Year</span><select id="signup-year" value={year} onChange={(event) => setYear(Number(event.target.value))}>{yearLabels.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-action" type="submit">Create Student Record</button>
      <p className="auth-switch">Already have an account? <button type="button" className="text-button" onClick={onLogin}>Log in</button></p>
    </form>
  )
}

function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  if (sent) return (
    <div className="auth-form recovery-success">
      <div className="form-heading"><h2>Check your owl post.</h2><p>A password recovery link has been sent to your email.</p></div>
      <button className="secondary-action" type="button" onClick={onBack}>Back to login</button>
    </div>
  )
  return (
    <form className="auth-form" onSubmit={(event) => { event.preventDefault(); setSent(true) }}>
      <div className="form-heading"><h2>Recover your account</h2><p>Enter the email associated with your StudyinHogwart account.</p></div>
      <label className="field-label" htmlFor="recovery-email"><span>Email</span><input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <button className="primary-action" type="submit">Send recovery link</button>
      <button className="secondary-action" type="button" onClick={onBack}>Back to login</button>
    </form>
  )
}

