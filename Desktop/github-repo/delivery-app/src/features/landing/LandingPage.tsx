import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'

const PACKAGE_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra_large', label: 'Extra Large' },
]

const PACKAGE_WEIGHTS = [
  { value: 'very_light', label: 'Very Light' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
]

const VEHICLE_TYPES = [
  { value: 'small_car', label: 'Small Car', icon: '🚗' },
  { value: 'big_bus', label: 'Big Bus', icon: '🚌' },
]

interface Route {
  id: string
  origin: string
  destination: string
  distance_km: number
  estimated_duration_mins: number
  risk_level: number
}

interface QuoteResult {
  estimated_price: number
  distance_km: number
  estimated_duration_mins: number
  origin_park: string
  destination: string
  vehicle_type: string
  package_size: string
  package_weight: string
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [showQuote, setShowQuote] = useState(false)
  const [origins, setOrigins] = useState<string[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [form, setForm] = useState({
    originPark: '',
    destination: '',
    packageSize: 'medium',
    packageWeight: 'light',
    vehicleType: 'small_car',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuoteResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const { data } = await api.get('/routes/origins')
        setOrigins(Array.isArray(data) ? data : data?.origins ?? [])
      } catch {}
    }
    fetch_()
  }, [])

  useEffect(() => {
    if (!form.originPark) { setRoutes([]); return }
    const fetch_ = async () => {
      try {
        const { data } = await api.get('/routes/destinations', {
          params: { origin: form.originPark }
        })
        setRoutes(Array.isArray(data) ? data : [])
      } catch {}
    }
    fetch_()
  }, [form.originPark])

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      setResult(null)
      setError('')
    }

  const handleQuote = async () => {
    if (!form.originPark || !form.destination) {
      setError('Please select origin and destination.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { data } = await api.post('/pricing/quick-quote', {
        origin_park: form.originPark,
        destination: form.destination,
        package_size: form.packageSize,
        package_weight: form.packageWeight,
        vehicle_type: form.vehicleType,
      })
      setResult(data)
    } catch (err: any) {
      setError('Could not get a quote right now. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const STATS = [
    { value: '500+', label: 'Deliveries made' },
    { value: '37', label: 'States covered' },
    { value: '98%', label: 'On-time rate' },
    { value: '4.9★', label: 'Average rating' },
  ]

  const HOW = [
    { step: '01', icon: '📦', title: 'Book a delivery', desc: 'Choose your route, package type, and vehicle. Get an instant ML-powered price.' },
    { step: '02', icon: '🚗', title: 'Driver picks up at park', desc: 'A verified driver accepts your order and picks up your package at the motor park.' },
    { step: '03', icon: '📍', title: 'Track in real time', desc: 'Watch your driver move on the map all the way to the destination.' },
    { step: '04', icon: '🎉', title: 'Package delivered', desc: 'Recipient gets the package. You get notified instantly.' },
  ]

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-lg">📦</div>
          <span className="text-light text-xl font-semibold tracking-tight">SendRun</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQuote(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-accent/30
              text-accent text-sm font-medium hover:bg-accent/10 transition-colors cursor-pointer"
          >
            🧮 Get a quote
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl border border-white/10 text-light text-sm
              font-medium hover:bg-white/5 transition-colors cursor-pointer"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 rounded-xl bg-accent text-surface text-sm
              font-semibold hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute w-125 h-125 rounded-full border-80 border-accent/5 -top-40 -right-40 pointer-events-none" />
        <div className="absolute w-75 h-75 rounded-full border-60 border-primary/40 -bottom-20 -left-20 pointer-events-none" />

        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20
          rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-accent text-xs font-semibold">Now live in Ondo State</span>
        </div>

        <h1 className="text-light text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 max-w-3xl">
          Send packages across<br />
          <span className="text-accent">Nigeria</span>, stress-free.
        </h1>

        <p className="text-muted text-lg max-w-xl leading-relaxed mb-10">
          Book a verified driver from any motor park in Ondo State to Lagos, Abuja, Port Harcourt and more.
          Real-time tracking. ML-powered pricing. No stress.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-accent text-surface font-bold rounded-2xl text-base
              hover:bg-amber-400 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            🚀 Start sending packages
          </button>
          <button
            onClick={() => setShowQuote(true)}
            className="px-8 py-4 bg-primary/40 border border-white/10 text-light font-semibold
              rounded-2xl text-base hover:bg-primary/60 transition-colors cursor-pointer
              flex items-center justify-center gap-2"
          >
            🧮 Check delivery price
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl">
          {STATS.map(s => (
            <div key={s.label} className="bg-primary/30 border border-white/5 rounded-2xl px-4 py-4">
              <p className="text-accent text-2xl font-bold">{s.value}</p>
              <p className="text-muted text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">
            How it works
          </p>
          <h2 className="text-light text-3xl font-bold">Four simple steps</h2>
          <p className="text-muted text-sm mt-3">
            From booking to delivery — fast, tracked, reliable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HOW.map((h, i) => (
            <div key={h.step} className="relative bg-primary/20 border border-white/5 rounded-2xl p-5">
              <div className="absolute top-4 right-4 text-white/5 text-5xl font-black">{h.step}</div>
              <div className="text-3xl mb-3">{h.icon}</div>
              <h3 className="text-light text-sm font-semibold mb-2">{h.title}</h3>
              <p className="text-muted text-xs leading-relaxed">{h.desc}</p>
              {i < HOW.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 text-accent text-lg z-10">→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Why SendRun */}
      <section className="px-6 py-16 bg-primary/20 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">Why SendRun</p>
            <h2 className="text-light text-3xl font-bold">Built for Nigerian roads</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: '🤖', title: 'ML-powered pricing', desc: 'Our model factors route risk, fuel price, distance, and demand to give you the fairest price — no surprises.' },
              { icon: '📍', title: 'Live GPS tracking', desc: 'Watch your driver move in real time on the map. Know exactly where your package is at every moment.' },
              { icon: '✅', title: 'Verified drivers only', desc: 'Every driver on SendRun is vetted with NIN and license checks before they carry a single package.' },
            ].map(f => (
              <div key={f.title} className="bg-surface border border-white/5 rounded-2xl p-5">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-light text-sm font-semibold mb-2">{f.title}</h3>
                <p className="text-muted text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-light text-3xl font-bold mb-4">
            Ready to send your first package?
          </h2>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            Join hundreds of Nigerians already using SendRun to move packages across states safely and affordably.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-accent text-surface font-bold rounded-2xl
                hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Create a free account
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 border border-white/10 text-light font-semibold
                rounded-2xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              Sign in to existing account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-sm">📦</div>
          <span className="text-light text-sm font-semibold">SendRun</span>
        </div>
        <p className="text-muted text-xs">© 2025 SendRun. Intercity logistics for Ondo State.</p>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowQuote(true)} className="text-muted text-xs hover:text-accent transition-colors cursor-pointer">
            Get a quote
          </button>
          <button onClick={() => navigate('/register')} className="text-muted text-xs hover:text-accent transition-colors cursor-pointer">
            Sign up
          </button>
          <button onClick={() => navigate('/login')} className="text-muted text-xs hover:text-accent transition-colors cursor-pointer">
            Sign in
          </button>
        </div>
      </footer>

      {/* Quick Quote Modal */}
      {showQuote && (
        <QuoteModal
          origins={origins}
          routes={routes}
          form={form}
          result={result}
          loading={loading}
          error={error}
          onSet={set}
          onOriginChange={(val) => {
            setForm(prev => ({ ...prev, originPark: val, destination: '' }))
            setResult(null)
          }}
          onSelectSize={(val) => setForm(prev => ({ ...prev, packageSize: val }))}
          onSelectWeight={(val) => setForm(prev => ({ ...prev, packageWeight: val }))}
          onSelectVehicle={(val) => setForm(prev => ({ ...prev, vehicleType: val }))}
          onQuote={handleQuote}
          onClose={() => { setShowQuote(false); setResult(null); setError('') }}
          onSignUp={() => navigate('/register')}
        />
      )}
    </div>
  )
}

function QuoteModal({
  origins, routes, form, result, loading, error,
  onSet, onOriginChange, onSelectSize, onSelectWeight,
  onSelectVehicle, onQuote, onClose, onSignUp,
}: any) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="bg-surface border border-white/10 rounded-3xl w-full max-w-md
          max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-light font-bold text-lg">
                Quick price check
              </h3>
              <p className="text-muted text-xs mt-0.5">
                No signup needed — just check the price
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center
                text-muted hover:text-light transition-colors cursor-pointer text-lg"
            >
              ×
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Result */}
            {result && (
              <div className="bg-primary/40 border border-accent/30 rounded-2xl p-5 text-center">
                <p className="text-muted text-xs uppercase tracking-wide font-semibold mb-1">
                  Estimated price
                </p>
                <p className="text-accent text-4xl font-black">
                  ₦
                  {result.price?.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    { label: "Distance", value: `${result.distance_km} km` },
                    {
                      label: "Est. time",
                      value: `${result.estimated_duration_mins} mins`,
                    },
                    {
                      label: "Route",
                      value: `${result.origin} → ${result.destination}`,
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-primary/40 rounded-xl px-2 py-2.5 text-center"
                    >
                      <p className="text-light text-xs font-semibold capitalize">
                        {s.value}
                      </p>
                      <p className="text-muted text-[10px]">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* <div className="mt-4 bg-accent/10 border border-accent/20 rounded-xl px-3 py-2">
                  <p className="text-accent text-xs">
                    🤖 Price calculated by our ML model. Sign up to book this
                    delivery.
                  </p>
                </div> */}
                <button
                  onClick={onSignUp}
                  className="mt-4 w-full h-11 bg-accent text-surface font-bold rounded-xl
                    text-sm hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  🚀 Sign up & book this delivery
                </button>
              </div>
            )}

            {/* Route */}
            <div className="bg-primary/30 rounded-2xl p-4 space-y-3">
              <p className="text-muted text-[10px] font-semibold uppercase tracking-wide">
                Route
              </p>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  <div className="w-px h-6 bg-muted/30" />
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-light" />
                </div>
                <div className="flex-1 space-y-2">
                  <select
                    value={form.originPark}
                    onChange={(e) => onOriginChange(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 h-10
                      text-sm text-light outline-none focus:border-accent transition-colors"
                  >
                    <option value="">Select pickup park</option>
                    {origins.map((o: string) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.destination}
                    onChange={onSet("destination")}
                    disabled={!form.originPark || routes.length === 0}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 h-10
                      text-sm text-light outline-none focus:border-accent transition-colors
                      disabled:opacity-40"
                  >
                    <option value="">
                      {!form.originPark
                        ? "Select origin first"
                        : "Select destination"}
                    </option>
                    {routes.map((r: Route) => (
                      <option key={r.id} value={r.destination}>
                        {r.destination}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Package size */}
            <div>
              <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-2">
                Package size
              </p>
              <div className="grid grid-cols-4 gap-2">
                {PACKAGE_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => onSelectSize(s.value)}
                    className={`py-2 rounded-xl border text-center transition-all cursor-pointer
                      ${
                        form.packageSize === s.value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-white/10 bg-primary/20 text-light hover:border-white/20"
                      }`}
                  >
                    <p className="text-xs font-medium">{s.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Package weight */}
            <div>
              <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-2">
                Package weight
              </p>
              <div className="grid grid-cols-4 gap-2">
                {PACKAGE_WEIGHTS.map((w) => (
                  <button
                    key={w.value}
                    onClick={() => onSelectWeight(w.value)}
                    className={`py-2 rounded-xl border text-center transition-all cursor-pointer
                      ${
                        form.packageWeight === w.value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-white/10 bg-primary/20 text-light hover:border-white/20"
                      }`}
                  >
                    <p className="text-xs font-medium">{w.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle type */}
            <div>
              <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-2">
                Vehicle type
              </p>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => onSelectVehicle(v.value)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border transition-all cursor-pointer
                      ${
                        form.vehicleType === v.value
                          ? "border-accent bg-accent/10"
                          : "border-white/10 bg-primary/20 hover:border-white/20"
                      }`}
                  >
                    <span className="text-lg">{v.icon}</span>
                    <p
                      className={`text-sm font-medium ${form.vehicleType === v.value ? "text-accent" : "text-light"}`}
                    >
                      {v.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button
              onClick={onQuote}
              disabled={loading || !form.originPark || !form.destination}
              className="w-full h-12 bg-accent text-surface font-bold rounded-xl text-sm
                hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-40
                disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-surface border-t-transparent rounded-full animate-spin" />
                  Calculating...
                </>
              ) : (
                <>🧮 Get price estimate</>
              )}
            </button>

            <p className="text-center text-muted text-xs">
              Want to book?{" "}
              <button
                onClick={onSignUp}
                className="text-accent font-semibold hover:underline cursor-pointer"
              >
                Create a free account
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}