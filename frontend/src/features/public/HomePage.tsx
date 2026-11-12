import { useState } from "react";
import type { DoctorCard, Paginated } from "@/api/types";
import { ChatWidget } from "@/features/chatbot/ChatWidget";
import { useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { doctorFilters } from "./content";
import { DoctorCards } from "./DoctorCards";
import { Faq } from "./Faq";
import { Features } from "./Features";
import { ForDoctors } from "./ForDoctors";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";
import { Stats } from "./Stats";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [speciality, setSpeciality] = useState("");
  const search = useDebounced(query, 300);
  const doctors = useApi<Paginated<DoctorCard>>("/doctors", {
    ...doctorFilters(search, speciality),
    page_size: 12,
  });
  const everyone = useApi<Paginated<DoctorCard>>("/doctors", { page_size: 50 });

  function showDoctors() {
    document.getElementById("doctors")?.scrollIntoView();
  }

  return (
    <div id="top" className="bg-bg text-text min-h-dvh">
      <title>AarogyaHub · See a verified doctor online</title>
      <a
        href="#main"
        className="focus:bg-surface sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-md focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>
      <PublicHeader />
      <main id="main">
        <Hero
          query={query}
          onQueryChange={setQuery}
          speciality={speciality}
          onSpecialityChange={setSpeciality}
          onSearch={showDoctors}
          doctors={everyone.data?.items}
        />
        <DoctorCards
          result={doctors.data}
          error={doctors.error}
          onRetry={doctors.reload}
          filter={speciality || search.trim()}
          onClear={() => {
            setQuery("");
            setSpeciality("");
          }}
        />
        <HowItWorks />
        <Stats />
        <Features />
        <ForDoctors />
        <Faq />
      </main>
      <PublicFooter />
      <ChatWidget />
    </div>
  );
}
