"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const BuildingMapInner = dynamic(() => import("./BuildingMapInner"), {
  ssr: false,
  loading: () => null,
});

export default function BuildingMap({
  latitude,
  longitude,
  name,
}: {
  latitude?: number | null;
  longitude?: number | null;
  name: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [latitude, longitude]);

  if (latitude == null || longitude == null) return null;

  return (
    <div ref={ref} className="w-full">
      {visible ? (
        <BuildingMapInner latitude={latitude} longitude={longitude} name={name} />
      ) : (
        <div className="h-[220px] md:h-[280px]" />
      )}
    </div>
  );
}
