import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../landing.css'
import affichePerfAuto from '../assets/perf-boite-automatique.jpeg'
import affichePerfManuelle from '../assets/perf-boite-manuelle.jpeg'
import afficheCoursCode from '../assets/cours-code-horaires.jpeg'
import { useEcole } from '../ecole'
import { useBureaux } from '../bureaux'

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

const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.23 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/>
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
    desc: 'Apprentissage pratique avec des moniteurs certifiés sur des véhicules récents et bien entretenus, en conditions réelles de circulation.',
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

/* Chiffres clés et ancienneté : Paramètres → Page d'accueil ; un chiffre vide n'est pas affiché. */
const statsDe = e => [
  { value: e.elevesFormes, label: 'Élèves formés' },
  { value: e.tauxReussite, label: 'Taux de réussite' },
  { value: e.nombreMoniteurs, label: 'Moniteurs certifiés' },
  { value: e.anneeCreation && new Date().getFullYear() - e.anneeCreation > 0 ? `${new Date().getFullYear() - e.anneeCreation} ans` : null, label: "D'expérience" },
].filter(x => x.value)
// « depuis 2016 », « à Dakar » : rien si le réglage est vide
const depuis = e => (e.anneeCreation ? ` depuis ${e.anneeCreation}` : '')
const a = e => (e.ville ? ` à ${e.ville}` : '')

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
  // Lien direct vers une section (ex. /#galerie) : la page étant rendue par React après
  // le chargement, le navigateur n'a pas pu défiler jusqu'à l'ancre tout seul.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [])

  return (
    <div className="min-h-screen w-full bg-white font-[Inter,system-ui,sans-serif] text-slate-800">
      <Navbar />
      <Hero />
      <Services />
      <StatsSection />
      <Avantages />
      <Galerie />
      <CtaBanner />
      <Footer />
    </div>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  const ecole = useEcole()
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
              <div className="font-bold text-[#1e3a5f] text-sm sm:text-base">{ecole.nom}</div>
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
  const ecole = useEcole()
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
              Auto-École agréée{ecole.ville && ` — ${ecole.ville}`}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              LA CONFIANCE AU VOLANT,<br />
              <span className="text-[#d4a017]">LA RÉUSSITE AU RENDEZ-VOUS</span>
            </h1>

            <p className="text-lg text-blue-100 leading-relaxed mb-8 max-w-xl">
              Formation de qualité au code de la route et à la conduite avec des moniteurs certifiés.
              {ecole.elevesFormes
                ? ` Rejoignez plus de ${ecole.elevesFormes.replace(/\s*\+$/, '')} élèves formés avec succès${depuis(ecole)}.`
                : ` Rejoignez nos élèves${depuis(ecole) ? ` formés avec succès${depuis(ecole)}` : ''}.`}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/inscription"
                className="inline-flex items-center justify-center gap-2 bg-[#d4a017] hover:bg-[#f0bb2a] text-white font-bold px-8 py-4 rounded-full transition-all duration-200 no-underline text-base shadow-lg"
              >
                S'inscrire en ligne
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
  const ecole = useEcole()
  const stats = statsDe(ecole)
  if (!stats.length) return null   // aucun chiffre saisi dans Paramètres
  return (
    <section className="py-20" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white">
            La confiance de nos élèves, en chiffres
          </h2>
          <p className="text-blue-200 mt-3">Des résultats qui parlent d'eux-mêmes{depuis(ecole)}</p>
        </div>

        <div className={`grid grid-cols-2 ${stats.length >= 4 ? 'lg:grid-cols-4' : stats.length === 3 ? 'lg:grid-cols-3' : ''} gap-6`}>
          {stats.map((s, i) => (
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
  const ecole = useEcole()
  return (
    <section id="avantages" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionHeader
              eyebrow="Pourquoi nous choisir"
              title={`Une auto-école de référence${a(ecole)}`}
              subtitle={`${ecole.anneeCreation ? `Depuis ${ecole.anneeCreation}, nous formons` : 'Nous formons'} les conducteurs sénégalais avec les plus hauts standards de qualité pédagogique.`}
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

// ── Galerie (affiches en diaporama horizontal) ───────────────────────────────
const AFFICHES = [
  { src: afficheCoursCode,    titre: 'Cours de code sur WhatsApp — emploi du temps' },
  { src: affichePerfAuto,     titre: 'Cours de perfectionnement — boîte automatique' },
  { src: affichePerfManuelle, titre: 'Cours de perfectionnement — boîte manuelle' },
]

function Galerie() {
  const piste = useRef(null)
  const [actif, setActif] = useState(0)
  const [pause, setPause] = useState(false)

  const allerA = i => {
    const el = piste.current
    if (!el) return
    const n = (i + AFFICHES.length) % AFFICHES.length
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' })
  }

  // L'indice suit le défilement (flèches, points, mais aussi glissement au doigt)
  const auDefilement = () => {
    const el = piste.current
    if (el) setActif(Math.round(el.scrollLeft / el.clientWidth))
  }

  useEffect(() => {
    if (pause) return
    const t = setInterval(() => allerA(actif + 1), 6000)
    return () => clearInterval(t)
  }, [actif, pause])

  return (
    <section id="galerie" className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Nos offres"
          title="Nos formations"
          subtitle="Cours de code sur WhatsApp et cours de perfectionnement en boîte automatique ou manuelle."
        />

        <div
          className="relative mt-8"
          onMouseEnter={() => setPause(true)}
          onMouseLeave={() => setPause(false)}
          onTouchStart={() => setPause(true)}
        >
          <div
            ref={piste}
            onScroll={auDefilement}
            className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl bg-slate-900 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {AFFICHES.map((a, i) => (
              <div key={i} className="w-full flex-shrink-0 snap-center flex justify-center p-3 sm:p-5">
                <img
                  src={a.src}
                  alt={a.titre}
                  loading="lazy"
                  draggable="false"
                  className="max-h-[55vh] w-auto max-w-full rounded-xl shadow-2xl object-contain"
                />
              </div>
            ))}
          </div>

          {[{ dir: -1, cote: 'left-2 sm:-left-5', label: 'Affiche précédente', d: 'M15 18l-6-6 6-6' },
            { dir: 1,  cote: 'right-2 sm:-right-5', label: 'Affiche suivante', d: 'M9 18l6-6-6-6' }].map(b => (
            <button
              key={b.dir}
              type="button"
              aria-label={b.label}
              onClick={() => allerA(actif + b.dir)}
              style={{ borderRadius: '9999px' }}   // le reboot Bootstrap remet border-radius à 0 sur <button>
              className={`absolute top-1/2 -translate-y-1/2 ${b.cote} w-11 h-11 rounded-full bg-[#d4a017] hover:bg-[#f0bb2a] text-white shadow-lg flex items-center justify-center transition-colors`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d={b.d} />
              </svg>
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {AFFICHES.map((a, i) => (
            <button
              key={i}
              type="button"
              aria-label={a.titre}
              aria-current={i === actif}
              onClick={() => allerA(i)}
              style={{ borderRadius: '9999px' }}
              className={`h-2.5 rounded-full transition-all duration-300 ${i === actif ? 'w-8 bg-[#d4a017]' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA Banner ─────────────────────────────────────────────────────────────
function CtaBanner() {
  const ecole = useEcole()
  return (
    <section className="py-20 bg-[#d4a017]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Prêt à obtenir votre permis ?
        </h2>
        <p className="text-amber-100 text-lg mb-8">
          Rejoignez {ecole.nom} et bénéficiez d'un suivi personnalisé jusqu'à l'obtention de votre permis.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/inscription"
            className="inline-flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#142a47] text-white font-bold px-8 py-4 rounded-full transition-all duration-200 no-underline text-base shadow-lg"
          >
            S'inscrire en ligne
            <ArrowIcon />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 bg-white/80 hover:bg-white text-[#1e3a5f] font-bold px-8 py-4 rounded-full transition-all duration-200 no-underline text-base shadow-lg"
          >
            Accéder à mon espace
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
/* Sites de l'auto-école (Paramètres → Bureaux, ouverts) : adresse, numéro (lien d'appel) et
   itinéraire. localisation : position exacte (latitude, longitude) ; sans elle, on cherche l'adresse. */
const itineraire = (s, ville) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.localisation || [s.adresse, s.nom, ville, 'Sénégal'].filter(Boolean).join(', '))}`
const whatsapp = (s, nom) => `https://wa.me/221${s.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${nom} (site de ${s.nom}), je souhaite des informations sur l'inscription au permis.`)}`

function Footer() {
  const ecole = useEcole()
  // Bureaux ouverts avec au moins une adresse ou un numéro
  const sites = useBureaux().actifs.filter(b => b.adresse || b.telephone)
  return (
    <footer id="contact" className="bg-[#142a47] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Marque */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#d4a017] rounded-lg flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
              <span className="font-bold text-lg">{ecole.nom}</span>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed max-w-xs mb-6">
              Votre partenaire de confiance pour l'obtention du permis de conduire{a(ecole)}{depuis(ecole)}.
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
            <h4 className="font-bold uppercase tracking-widest mb-4" style={{ fontSize: '.75rem', color: '#93c5fd' }}>Navigation</h4>
            <ul className="space-y-3 list-none p-0 m-0">
              {[
                { label: 'Accueil', href: '#accueil' },
                { label: 'Nos Services', href: '#services' },
                { label: 'Pourquoi nous', href: '#avantages' },
                { label: 'Espace Élève', href: '/login' },
              ].map(l => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm transition-colors" style={{ color: '#bfdbfe', textDecoration: 'none' }}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact : les sites de l'auto-école */}
          <div className="md:col-span-2">
            <h4 className="font-bold uppercase tracking-widest mb-4" style={{ fontSize: '.75rem', color: '#93c5fd' }}>
              Contact{sites.length > 1 ? ` · nos ${sites.length} sites` : ''}
            </h4>
            <ul className={`grid gap-3 list-none p-0 m-0 ${sites.length >= 3 ? 'sm:grid-cols-3' : sites.length === 2 ? 'sm:grid-cols-2' : ''}`}>
              {sites.map(s => (
                <li key={s.code} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                  <div className="font-bold text-white text-sm">{s.nom}</div>
                  <div className="flex items-start gap-2 text-blue-200 text-xs leading-relaxed flex-1">
                    {s.adresse && <><span className="flex-shrink-0"><MapIcon /></span><span>{s.adresse}</span></>}
                  </div>
                  {s.telephone && (
                  <a href={`tel:+221${s.telephone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap" style={{ color: '#fff', textDecoration: 'none' }}>
                    <PhoneIcon />
                    {s.telephone}
                  </a>
                  )}
                  {s.telephone && <a href={whatsapp(s, ecole.nom)} target="_blank" rel="noopener noreferrer" aria-label={`Écrire sur WhatsApp au site de ${s.nom}`}
                    className="flex items-center justify-center gap-2 rounded-full py-2 text-sm font-bold"
                    style={{ background: '#25d366', color: '#fff', textDecoration: 'none' }}>
                    <WhatsappIcon />WhatsApp
                  </a>}
                  <a href={itineraire(s, ecole.ville)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: '#f0bb2a', textDecoration: 'none' }}>
                    Itinéraire →
                  </a>
                </li>
              ))}
            </ul>
            {/* E-mail de Paramètres ; aucun tant qu'il n'est pas saisi */}
            {ecole.email && (
              <div className="mt-3 flex items-center gap-3 text-blue-200 text-sm">
                <MailIcon />
                <a href={`mailto:${ecole.email}`} style={{ color: '#bfdbfe', textDecoration: 'none' }}>{ecole.email}</a>
              </div>
            )}
            {ecole.horaires && (
              <div className="mt-4 bg-white/10 rounded-xl p-3">
                <div className="text-xs text-blue-300 font-medium mb-1">Horaires d'ouverture</div>
                <div className="text-sm text-white">{ecole.horaires}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-blue-300">
          <span>© {new Date().getFullYear()} {ecole.nom}. Tous droits réservés.</span>
          <span>Agréé par le Ministère des Transports terrestres et aériens</span>
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
