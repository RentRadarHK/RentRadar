export default function BuildingLoading() {
  return (
    <div className="min-h-screen" style={{ background: "#F5F0E8" }}>
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-28 pb-24">
        {/* Breadcrumb */}
        <div className="h-3 w-56 rounded-full bg-[#E2D9CE] animate-pulse mb-8" />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column */}
          <div className="w-full lg:w-[65%] flex flex-col gap-7">
            <div className="bg-white rounded-[16px] p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <div className="w-full h-44 rounded-xl bg-[#EDE8E3] animate-pulse mb-6" />
              <div className="h-9 w-2/3 rounded-lg bg-[#E2D9CE] animate-pulse mb-3" />
              <div className="h-3 w-full rounded-full bg-[#E2D9CE] animate-pulse mb-6" />
              <div className="h-14 w-48 rounded-xl bg-[#E2D9CE] animate-pulse mb-5" />
              <div className="flex gap-2">
                <div className="h-7 w-28 rounded-full bg-[#E2D9CE] animate-pulse" />
                <div className="h-7 w-20 rounded-full bg-[#E2D9CE] animate-pulse" />
              </div>
            </div>
            <div className="bg-white rounded-[16px] p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <div className="h-5 w-48 rounded-lg bg-[#E2D9CE] animate-pulse mb-6" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-[#EDE8E3] animate-pulse" />
                ))}
              </div>
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-[16px] p-6 h-32 animate-pulse" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }} />
            ))}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[35%] flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[16px] p-6 h-40 animate-pulse" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
