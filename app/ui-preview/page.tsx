import Link from "next/link";

function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#D9D2C2] bg-[#F5F0E8]/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <div className="text-[20px] font-bold tracking-tight text-[#555555]">
          Rent<span className="text-[#4D8B6F]">Radar</span>
        </div>
        <nav className="hidden items-center gap-7 md:flex">
          <a href="#concept-1" className="text-sm font-medium text-[#555555] hover:text-[#4D8B6F]">Concept 1</a>
          <a href="#concept-2" className="text-sm font-medium text-[#555555] hover:text-[#4D8B6F]">Concept 2</a>
          <a href="#concept-3" className="text-sm font-medium text-[#555555] hover:text-[#4D8B6F]">Concept 3</a>
          <Link
            href="/"
            className="rounded-full bg-[#4D8B6F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3D6F58]"
          >
            Back to Home
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SearchBox() {
  return (
    <div className="mt-8 max-w-[620px] rounded-[24px] border border-[#D9D2C2] bg-white p-2 shadow-[0_10px_30px_rgba(46,46,46,0.08)]">
      <div className="flex items-center gap-3">
        <input
          placeholder="Search landlord, building, or address in Hong Kong..."
          className="h-11 flex-1 rounded-[16px] px-4 text-sm text-[#555555] outline-none placeholder:text-[#8A8170]"
        />
        <button className="rounded-[16px] bg-[#4D8B6F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3D6F58]">
          Search
        </button>
      </div>
    </div>
  );
}

function ConceptOne() {
  return (
    <section id="concept-1" className="rounded-[28px] border border-[#E8E2D4] bg-[#FBF8F2] p-8 sm:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4D8B6F]">Concept 1 · Minimal Cream</p>
      <h2 className="mt-3 text-4xl font-extrabold leading-tight text-[#555555] sm:text-5xl">
        Know your rental.
        <br />
        <span className="text-[#4D8B6F]">Before you sign.</span>
      </h2>
      <p className="mt-5 max-w-[680px] text-base leading-relaxed text-[#8A8170]">
        Cleaner hero with no dark banner, softer contrast, and a single high-confidence search action.
      </p>
      <SearchBox />
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {["Search", "Read", "Know"].map((item, i) => (
          <div key={item} className="rounded-[16px] border border-[#E8E2D4] bg-white p-5">
            <p className="text-xs font-bold text-[#8A8170]">0{i + 1}</p>
            <p className="mt-2 text-lg font-semibold text-[#555555]">{item}</p>
            <p className="mt-1 text-sm text-[#8A8170]">Streamlined card style with consistent spacing rhythm.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConceptTwo() {
  return (
    <section
      id="concept-2"
      className="rounded-[28px] border border-[#D9D2C2] p-8 sm:p-12"
      style={{ background: "linear-gradient(145deg, #F5F0E8 0%, #EFE9DD 100%)" }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[#E4F0EB] px-3 py-1 text-xs font-semibold text-[#3D6F58]">Verified data</span>
        <span className="rounded-full bg-[#FDE8E3] px-3 py-1 text-xs font-semibold text-[#A53E2A]">Anonymous reviews</span>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#4D8B6F]">Concept 2 · Editorial Brand</p>
      <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-4xl font-extrabold leading-tight text-[#555555] sm:text-5xl">
            Rental research,
            <br />
            designed like a trusted report.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[#8A8170]">
            More premium typography and visual hierarchy; replaces high-contrast blocks with soft brand tints.
          </p>
          <SearchBox />
        </div>
        <div className="rounded-[20px] border border-[#D9D2C2] bg-white/80 p-6">
          <p className="text-sm font-semibold text-[#555555]">Visual direction highlights</p>
          <ul className="mt-3 space-y-2 text-sm text-[#8A8170]">
            <li>Outfit-heavy editorial scale for hero and section headers</li>
            <li>Sage-tint trust band replacing charcoal stat strip</li>
            <li>Coral only used as accent signal, never dominant</li>
            <li>Sharper CTA hierarchy: one primary action per block</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function ConceptThree() {
  return (
    <section id="concept-3" className="rounded-[28px] border border-[#D9D2C2] bg-[#F5F0E8] p-8 sm:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4D8B6F]">Concept 3 · Premium Map-led</p>
      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="text-4xl font-extrabold leading-tight text-[#555555] sm:text-5xl">
            See building truth
            <br />
            before viewing day.
          </h2>
          <p className="mt-5 max-w-[640px] text-base leading-relaxed text-[#8A8170]">
            Product-led hero with stronger search module and map/pin motif for a modern proptech feel.
          </p>
          <SearchBox />
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#555555]">6,611+ HK Island Buildings</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#555555]">Verified Govt Data</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#555555]">Tenant-first Reviews</span>
          </div>
        </div>
        <div className="rounded-[20px] border border-[#E8E2D4] bg-white p-6 shadow-[0_10px_30px_rgba(46,46,46,0.08)]">
          <p className="text-sm font-semibold text-[#555555]">Map-led panel mock</p>
          <div className="mt-4 h-[220px] rounded-[16px] bg-[radial-gradient(circle_at_20%_20%,#E4F0EB_0%,#E4F0EB_20%,#F5F0E8_60%)]" />
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-[#FBF8F2] p-3 text-[#555555]">Avg Rent Range</div>
            <div className="rounded-xl bg-[#FBF8F2] p-3 text-[#555555]">Statutory Orders</div>
            <div className="rounded-xl bg-[#FBF8F2] p-3 text-[#555555]">Tenant Sentiment</div>
            <div className="rounded-xl bg-[#FBF8F2] p-3 text-[#555555]">Landlord History</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function UiPreviewPage() {
  return (
    <main className="min-h-screen bg-[#F5F0E8] text-[#555555]">
      <TopNav />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-5 py-10 sm:px-8">
        <div className="rounded-[20px] border border-[#D9D2C2] bg-white p-5 text-sm text-[#555555] sm:p-6">
          Homepage previews with the gray header removed. These are exploration mocks to compare look/feel and branding direction before implementation.
        </div>
        <ConceptOne />
        <ConceptTwo />
        <ConceptThree />
      </div>
    </main>
  );
}
