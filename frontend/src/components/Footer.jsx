import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-blue-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-center sm:justify-between">
        <Logo light />
        <div className="text-sm">
          <p className="mb-1 font-display font-semibold text-white">Réalisé par</p>
          <p>Aya Abdallah &amp; Ameni Azouz</p>
        </div>
      </div>
    </footer>
  )
}
