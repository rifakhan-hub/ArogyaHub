import { useState } from "react";
import { ChatWidget } from "@/features/chatbot/ChatWidget";
import { DoctorCards } from "./DoctorCards";
import { Faq } from "./Faq";
import { Features } from "./Features";
import { ForDoctors } from "./ForDoctors";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";
import { Stats } from "./Stats";

/** The public home page at "/" (design doc 8.2). */
export default function HomePage() {
  // the hero search filters the doctor cards further down
  const [query, setQuery] = useState("");
  const [speciality, setSpeciality] = useState("");

  function showDoctors() {
    document.getElementById("doctors")?.scrollIntoView();
  }

  return (
    <div id="top" className="min-h-dvh bg-bg text-text">
      <title>AarogyaHub · See a verified doctor online</title>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
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
        />
        <DoctorCards
          query={query}
          speciality={speciality}
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
