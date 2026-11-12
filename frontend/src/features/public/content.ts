import { formatRelativeDay, formatTime } from "@/lib/dates";

export const SYMPTOM_WORDS: Record<string, string[]> = {
  "General Physician": [
    "fever",
    "cold",
    "cough",
    "headache",
    "bp",
    "sugar",
    "diabetes",
    "body pain",
    "weakness",
    "general",
  ],
  Paediatrics: ["child", "baby", "kid", "infant", "vaccination", "children"],
  Dermatology: ["skin", "rash", "acne", "pimple", "hair", "itch", "allergy"],
  Gynaecology: ["period", "pregnancy", "pcos", "women", "pregnant"],
  ENT: ["ear", "nose", "throat", "sinus", "tonsil"],
  Psychiatry: ["anxiety", "stress", "sleep", "depression", "mood"],
};

export const STEPS = [
  {
    title: "Tell us what's wrong",
    body: "Type a symptom like fever or skin rash. We show the doctors who treat it, with their fees and next free times.",
  },
  {
    title: "Pick a slot that fits",
    body: "Each doctor sets their own slot lengths, from 5 to 30 minutes. Longer slots look longer, so you see what you're booking.",
  },
  {
    title: "Consult on video",
    body: "Join from your web browser on any computer, nothing to install. Share reports in the call and get your prescription in your vault.",
  },
];

export const FACTS = [
  {
    value: 100,
    suffix: "%",
    label: "of doctors licence-checked with their medical council before they can take bookings",
  },
  {
    value: 30,
    suffix: " min",
    label: "longest slot a doctor can offer; the shortest is 5 minutes",
  },
  {
    value: 24,
    suffix: "/7",
    label: "help from the AI assistant with booking, reports and payments",
  },
  {
    value: 5,
    suffix: " min",
    label: "lifetime of each secure link to your reports, so files never sit open",
  },
];

export const FAQS = [
  {
    question: "Are the doctors real and qualified?",
    answer:
      "Yes. Before a doctor can take bookings, our team checks their registration number on the state medical council register and reviews their degree and identity documents. Every check is logged.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. Consultations run in your web browser on any laptop or computer. You only need a camera, a microphone and a steady connection.",
  },
  {
    question: "Who can see my reports and scans?",
    answer:
      "Only you, and the doctors you choose to share them with. Files are stored privately and each view uses a link that expires after 5 minutes.",
  },
  {
    question: "Is the AI assistant a doctor?",
    answer:
      "No. The assistant answers questions about using AarogyaHub and gives general health information reviewed by doctors. It never diagnoses or suggests doses.",
  },
];

export function doctorFilters(query: string, speciality: string) {
  if (speciality) return { specialization: speciality };
  const words = query.trim().toLowerCase();
  if (!words) return {};
  const match = Object.entries(SYMPTOM_WORDS).find(([, keywords]) =>
    keywords.some((keyword) => keyword.includes(words) || words.includes(keyword)),
  );
  return match ? { specialization: match[0] } : { q: words };
}

export function bookPath(doctorId?: string) {
  return doctorId ? `/patient/doctors?doctor=${doctorId}` : "/patient/doctors";
}

export function nextSlotText(nextSlot: string | null) {
  return nextSlot
    ? `${formatRelativeDay(nextSlot)}, ${formatTime(nextSlot)}`
    : "No free slots this week";
}
