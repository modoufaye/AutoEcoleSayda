import { Link } from 'react-router-dom'
import '../landing.css'

// ── Icônes SVG inline ──────────────────────────────────────────────────────
const CarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
  </svg>
)

const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
  </svg>
)

const AwardIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V17H7v2h10v-2h-4v-1.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm7 6c-1.65 0-3-1.35-3-3V5h6v6c0 1.65-1.35 3-3 3zm7-6c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.77-2.56 7.22-6 8.38C8.56 18.22 6 14.77 6 11V7.67L12 5zm-1 6H9v2h2v2h2v-2h2v-2h-2V9h-2v2z"/>
  </svg>
)

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </svg>
)

const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
)

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
)

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
  </svg>
)

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M8 5v14l11-7z" />
  </svg>
)

// ── Données ────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: <BookIcon />,
    title: 'Cours de Code',
    desc: "Formation théorique complète au Code de la Route avec supports pédagogiques, exercices pratiques et simulations d'examen.",
    color: 'from-blue-50 to-blue-100',
    iconBg: 'bg-[#1e3a5f]',
    badge: 'Théorie',
  },
  {
    icon: <CarIcon />,
    title: 'Cours de Conduite',
    desc: 'Apprentissage pratique avec des moniteurs certifiés sur des véhicules récents et bien entretenus dans les rues de Dakar.',
    color: 'from-amber-50 to-amber-100',
    iconBg: 'bg-[#d4a017]',
    badge: 'Pratique',
  },
  {
    icon: <AwardIcon />,
    title: 'Examens & Suivi',
    desc: "Accompagnement personnalisé jusqu'à l'obtention du permis, avec suivi de vos résultats et préparation aux épreuves officielles.",
    color: 'from-green-50 to-green-100',
    iconBg: 'bg-emerald-600',
    badge: 'Certification',
  },
]

const STATS = [
  { value: '1 200+', label: 'Élèves formés' },
  { value: '94 %', label: 'Taux de réussite' },
  { value: '15+', label: 'Moniteurs certifiés' },
  { value: '12 ans', label: "D'expérience" },
]

const AVANTAGES = [
  "Moniteurs diplômés d'État",
  'Véhicules récents & assurés',
  'Planning flexible & personnalisé',
  'Espace élève en ligne',
  'Suivi pédagogique en temps réel',
  'Tarifs transparents',
]

const NAV_LINKS = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Services', href: '#services' },
  { label: 'Pourquoi nous', href: '#avantages' },
  { label: 'Contact', href: '#contact' },
]

// ── Composant principal ────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-white font-[Inter,system-ui,sans-serif] text-slate-800">
      <Navbar />
      <Hero />
      <Services />
      <StatsSection />
      <Avantages />
      <CtaBanner />
      <Footer />
    </div>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#accueil" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <div className="leading-tight">
              <div className="font-bold text-[#1e3a5f] text-sm sm:text-base">Auto-École Sayda</div>
            </div>
          </a>

          {/* Menu desktop */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-slate-600 hover:text-[#1e3a5f] font-medium transition-colors no-underline"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <Link
            to="/login"
            className="hidden md:inline-flex items-center gap-2 bg-[#1e3a5f] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#142a47] transition-all duration-200 no-underline shadow-sm"
          >
            <span>Espace Élève</span>
            <PlayIcon />
          </Link>

          {/* Mobile menu btn */}
          <Link to="/login" className="md:hidden bg-[#1e3a5f] text-white text-xs font-semibold px-4 py-2 rounded-full no-underline">
            Connexion
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      id="accueil"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #142a47 0%, #1e3a5f 45%, #2a4f7c 100%)' }}
    >
      {/* Cercles décoratifs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, #d4a017 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
        />
      </div>

      {/* Grille décorative */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Texte gauche */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
              <span className="w-2 h-2 bg-[#d4a017] rounded-full" style={{ animation: 'pulse 2s infinite' }} />
              Auto-École agréée — Dakar
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              LA CONFIANCE AU VOLANT,<br />
              <span className="text-[#d4a017]">LA RÉUSSITE AU RENDEZ-VOUS</span>
            </h1>

            <p className="text-lg text-blue-100 leading-relaxed mb-8 max-w-xl">
              Formation de qualité au code de la route et à la conduite avec des moniteurs certifiés.
              Rejoignez plus de 1 200 élèves formés avec succès depuis 2012.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-[#d4a017] hover:bg-[#f0bb2a] text-white font-bold px-8 py-4 rounded-full transition-all duration-200 no-underline text-base shadow-lg"
              >
                Commencer ma formation
                <ArrowIcon />
              </Link>
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 no-underline text-base"
              >
                Découvrir nos services
              </a>
            </div>

            {/* Badges de confiance */}
            <div className="flex flex-wrap gap-4 mt-10">
              {["Agréé par l'État", 'Paiement en tranches', 'Suivi en ligne'].map(b => (
                <div key={b} className="flex items-center gap-2 text-blue-100 text-sm">
                  <CheckIcon />
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Carte illustrée droite */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 w-80">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-[#d4a017] rounded-xl flex items-center justify-center text-white">
                    <AwardIcon />
                  </div>
                  <div>
                    <div className="text-white font-bold">Permis B</div>
                    <div className="text-blue-200 text-sm">Catégorie standard</div>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    { label: 'Code de la Route', val: '40h', color: 'bg-[#d4a017]' },
                    { label: 'Conduite Pratique', val: '20h', color: 'bg-emerald-400' },
                    { label: 'Examen Blanc', val: '3 sessions', color: 'bg-blue-400' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                      <span className="text-blue-100 text-sm">{item.label}</span>
                      <span className={`${item.color} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>{item.val}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-[#d4a017] rounded-xl p-3 text-center">
                  <span className="text-white font-bold text-sm">Formation complète incluse</span>
                </div>
              </div>

              {/* Badge flottant réussite */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckIcon />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">94% de réussite</div>
                  <div className="text-slate-500 text-xs">Taux moyen 2025</div>
                </div>
              </div>

              {/* Badge flottant session */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-4 py-3">
                <div className="text-slate-500 text-xs mb-1">Prochaine session</div>
                <div className="font-bold text-[#1e3a5f] text-sm">Lundi 16 Juin 2026</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vague de transition */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
          <path d="M0 80 L0 40 Q360 0 720 40 Q1080 80 1440 40 L1440 80 Z" fill="white" />
        </svg>
      </div>
    </section>
  )
}

// ── Services ───────────────────────────────────────────────────────────────
function Services() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Nos Formations"
          title="Des formations adaptées à vos besoins"
          subtitle="De la théorie à la pratique, nous vous accompagnons à chaque étape de votre formation jusqu'à l'obtention de votre permis."
        />

        <div className="grid md:grid-cols-3 gap-8 mt-14">
          {SERVICES.map((s, i) => (
            <div
              key={i}
              className={`group relative bg-gradient-to-br ${s.color} rounded-2xl p-8 border border-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="absolute top-6 right-6">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-white/70 px-3 py-1 rounded-full">
                  {s.badge}
                </span>
              </div>

              <div className={`${s.iconBg} text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {s.icon}
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-3">{s.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>

              <div className="mt-6 pt-6 border-t border-white/60">
                <Link to="/login" className="text-[#1e3a5f] font-semibold text-sm flex items-center gap-1 no-underline hover:gap-2 transition-all">
                  En savoir plus
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Stats ──────────────────────────────────────────────────────────────────
function StatsSection() {
  return (
    <section className="py-20" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white">
            La confiance de nos élèves, en chiffres
          </h2>
          <p className="text-blue-200 mt-3">Des résultats qui parlent depuis plus d'une décennie</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-all duration-200"
            >
              <div className="text-4xl font-extrabold text-[#d4a017] mb-2">{s.value}</div>
              <div className="text-blue-100 text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Avantages ──────────────────────────────────────────────────────────────
function Avantages() {
  return (
    <section id="avantages" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionHeader
              eyebrow="Pourquoi nous choisir"
              title="Une auto-école de référence à Dakar"
              subtitle="Depuis 2012, nous formons les conducteurs sénégalais avec les plus hauts standards de qualité pédagogique."
              align="left"
            />

            <div className="grid sm:grid-cols-2 gap-3 mt-8">
              {AVANTAGES.map((a, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <CheckIcon />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{a}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 flex items-center gap-5">
              <div className="w-14 h-14 bg-[#1e3a5f] rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                <ShieldIcon />
              </div>
              <div>
                <div className="font-bold text-slate-800">Moniteurs agréés</div>
                <div className="text-slate-500 text-sm mt-1">
                  Tous nos moniteurs sont diplômés d'État et justifient d'une expérience de plus de 5 ans.
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 flex items-center gap-5">
              <div className="w-14 h-14 bg-[#d4a017] rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                <BookIcon />
              </div>
              <div>
                <div className="font-bold text-slate-800">Espace élève numérique</div>
                <div className="text-slate-500 text-sm mt-1">
                  Suivez vos leçons, vos résultats d'examen et vos paiements depuis votre espace personnel en ligne.
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 flex items-center gap-5">
              <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                <CarIcon />
              </div>
              <div>
                <div className="font-bold text-slate-800">Flotte de véhicules récente</div>
                <div className="text-slate-500 text-sm mt-1">
                  Apprenez sur des véhicules récents, bien entretenus et assurés tous risques pour votre sécurité.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── CTA Banner ─────────────────────────────────────────────────────────────
function CtaBanner() {
  return (
    <section className="py-20 bg-[#d4a017]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Prêt à obtenir votre permis ?
        </h2>
        <p className="text-amber-100 text-lg mb-8">
          Rejoignez l'Auto-École Sayda et bénéficiez d'un suivi personnalisé jusqu'à l'obtention de votre permis.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#142a47] text-white font-bold px-8 py-4 rounded-full transition-all duration-200 no-underline text-base shadow-lg"
          >
            Accéder à mon espace
            <ArrowIcon />
          </Link>
          <a
            href="#contact"
            className="inline-flex items-center justify-center gap-2 bg-white/20 border border-white/40 hover:bg-white/30 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 no-underline text-base"
          >
            Nous contacter
          </a>
        </div>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer id="contact" className="bg-[#142a47] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Marque */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#d4a017] rounded-lg flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
              <span className="font-bold text-lg">Auto-École Sayda</span>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed max-w-xs mb-6">
              Votre partenaire de confiance pour l'obtention du permis de conduire à Dakar depuis 2012.
              Formation de qualité, moniteurs certifiés, suivi personnalisé.
            </p>
            <div className="flex gap-3">
              {['F', 'T', 'I', 'W'].map((r, i) => (
                <button
                  key={i}
                  className="w-9 h-9 bg-white/10 hover:bg-[#d4a017] rounded-full flex items-center justify-center transition-colors duration-200 text-xs font-bold"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-blue-300 mb-4">Navigation</h4>
            <ul className="space-y-3">
              {[
                { label: 'Accueil', href: '#accueil' },
                { label: 'Nos Services', href: '#services' },
                { label: 'Pourquoi nous', href: '#avantages' },
                { label: 'Espace Élève', href: '/login' },
              ].map(l => (
                <li key={l.label}>
                  <a href={l.href} className="text-blue-200 hover:text-[#d4a017] text-sm transition-colors no-underline">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-blue-300 mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-blue-200 text-sm">
                <MapIcon />
                <span>Rue 10 x Avenue Cheikh Anta Diop, Dakar</span>
              </li>
              <li className="flex items-center gap-3 text-blue-200 text-sm">
                <PhoneIcon />
                <span>+221 77 329 35 57</span>
              </li>
              <li className="flex items-center gap-3 text-blue-200 text-sm">
                <MailIcon />
                <span>contact@autoecole-khadija.sn</span>
              </li>
            </ul>
            <div className="mt-4 bg-white/10 rounded-xl p-3">
              <div className="text-xs text-blue-300 font-medium mb-1">Horaires d'ouverture</div>
              <div className="text-sm text-white">Lun – Sam : 8h00 – 18h00</div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-blue-300">
          <span>© 2026 Auto-École Sayda. Tous droits réservés.</span>
          <span>Agréé par le Ministère des Transports du Sénégal</span>
        </div>
      </div>
    </footer>
  )
}

// ── SectionHeader helper ───────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, subtitle, align = 'center' }) {
  const isCenter = align === 'center'
  return (
    <div className={isCenter ? 'text-center max-w-2xl mx-auto' : 'max-w-xl'}>
      <span className="text-xs font-bold uppercase tracking-widest text-[#d4a017] bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
        {eyebrow}
      </span>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mt-4 mb-4 leading-tight">{title}</h2>
      {subtitle && <p className="text-slate-500 text-base leading-relaxed">{subtitle}</p>}
    </div>
  )
}
