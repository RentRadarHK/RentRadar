"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { BookOpen, Star, CreditCard, LogOut } from "lucide-react";

interface Props {
  user: User;
}

export default function AccountClient({ user }: Props) {
  const { signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const memberSince = new Date(user.created_at).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const initials = (user.user_metadata?.first_name as string | undefined)
    ? (user.user_metadata.first_name as string).slice(0, 1).toUpperCase()
    : user.email?.slice(0, 1).toUpperCase() ?? "?";

  return (
    <div className="pt-28 pb-20 px-5 min-h-screen" style={{ background: "#F5F0E8" }}>
      <div className="max-w-[640px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white flex-shrink-0"
            style={{ background: "#4D8B6F" }}
          >
            {initials}
          </div>
          <div>
            <h1 className="font-bold text-2xl" style={{ color: "#555555" }}>
              {(user.user_metadata?.first_name as string | undefined) ?? "Your account"}
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>{user.email}</p>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Member since {memberSince}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-4">
          <Section icon={<Star size={18} style={{ color: "#4D8B6F" }} />} title="My Reviews">
            <p className="text-sm" style={{ color: "#6B7280" }}>
              You haven&apos;t written any reviews yet.{" "}
              <a href="/review" className="font-semibold" style={{ color: "#4D8B6F" }}>
                Write your first review →
              </a>
            </p>
          </Section>

          <Section icon={<CreditCard size={18} style={{ color: "#4D8B6F" }} />} title="Subscription">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "#E4F0EB", color: "#4D8B6F" }}
              >
                Free plan
              </span>
              <span className="text-sm" style={{ color: "#6B7280" }}>
                Paid plans coming soon.
              </span>
            </div>
          </Section>

          <Section icon={<BookOpen size={18} style={{ color: "#4D8B6F" }} />} title="Saved Properties">
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Saved properties coming soon.
            </p>
          </Section>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="mt-8 flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full transition-all"
          style={{ border: "1.5px solid #E2D9CE", color: "#6B7280", background: "white" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#E8573A";
            e.currentTarget.style.color = "#E8573A";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#E2D9CE";
            e.currentTarget.style.color = "#6B7280";
          }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white px-6 py-5"
      style={{ borderRadius: 16, border: "1px solid #E2D9CE" }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="font-semibold text-sm" style={{ color: "#555555" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}
