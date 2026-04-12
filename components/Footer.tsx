import { Radio } from "lucide-react";

const footerLinks = {
  Product: ["Search", "Write a Review", "For Agents"],
  Company: ["About"],
  Legal: ["Privacy Policy", "Terms of Service"],
  Support: ["Help Centre", "Contact Us", "FAQ", "Report an Issue"],
};

export default function Footer() {
  return (
    <footer className="bg-[#F5F0E8] border-t border-[#E2D9CE] pt-16 pb-10 px-5 sm:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row gap-12 mb-14">
          {/* Brand */}
          <div className="shrink-0 max-w-[220px]">
            <div className="flex items-center gap-2 mb-4">
              <Radio size={20} className="text-[#555555]" />
              <span className="text-[#555555] font-bold text-[17px] tracking-tight">
                Rent<span className="text-[#555555]">Radar</span>
              </span>
            </div>
            <p className="text-[#9CA3AF] text-sm leading-relaxed">
              The rental market&apos;s trust layer — Hong Kong.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([col, links]) => (
              <div key={col}>
                <p className="text-[#555555] font-semibold text-sm mb-4">{col}</p>
                <ul className="flex flex-col gap-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-[#9CA3AF] hover:text-[#555555] transition-colors duration-150"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-[#9CA3AF] mb-6 max-w-2xl leading-relaxed">
          RentRadar is an independent tenant review platform for the Hong Kong rental market. All reviews are submitted by verified tenants. Building data is sourced from the Buildings Department, HKSAR.
        </p>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[#E2D9CE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-[#9CA3AF]">
            © {new Date().getFullYear()} RentRadar. All rights reserved.
          </p>
          <p className="text-xs text-[#9CA3AF] font-medium">
            Built for a fairer rental market.
          </p>
        </div>
      </div>
    </footer>
  );
}
