// All the words and sample data on the home page, in one place so they're easy to change.
// The doctors are examples for the page design; the real list will come from the backend's doctor search.

export const SPECIALITIES = ["General Physician", "Paediatrics", "Dermatology", "Gynaecology", "ENT", "Psychiatry"];

/** Words a patient might type, and the speciality each one points to. */
export const SYMPTOM_WORDS: Record<string, string[]> = {
  "General Physician": ["fever", "cold", "cough", "headache", "bp", "sugar", "diabetes", "body pain", "weakness", "general"],
  Paediatrics: ["child", "baby", "kid", "infant", "vaccination", "children"],
  Dermatology: ["skin", "rash", "acne", "pimple", "hair", "itch", "allergy"],
  Gynaecology: ["period", "pregnancy", "pcos", "women", "pregnant"],
  ENT: ["ear", "nose", "throat", "sinus", "tonsil"],
  Psychiatry: ["anxiety", "stress", "sleep", "depression", "mood"],
};

export interface SampleDoctor {
  name: string;
  speciality: string;
  council: string;
  experience: number;
  fee: number;
  nextSlot: string;
  slotMinutes: number;
  liveNow?: boolean;
}

export const DOCTORS: SampleDoctor[] = [
  {
    name: "Dr. Simran Kaur",
    speciality: "General Physician",
    council: "PMC",
    experience: 11,
    fee: 400,
    nextSlot: "10:30",
    slotMinutes: 15,
    liveNow: true,
  },
  {
    name: "Dr. Arjun Mehta",
    speciality: "Paediatrics",
    council: "DMC",
    experience: 8,
    fee: 500,
    nextSlot: "10:45",
    slotMinutes: 20,
  },
  {
    name: "Dr. Farah Khan",
    speciality: "Dermatology",
    council: "MMC",
    experience: 14,
    fee: 600,
    nextSlot: "11:00",
    slotMinutes: 10,
    liveNow: true,
  },
  {
    name: "Dr. Kavya Iyer",
    speciality: "Gynaecology",
    council: "KMC",
    experience: 12,
    fee: 700,
    nextSlot: "11:15",
    slotMinutes: 20,
  },
  {
    name: "Dr. Rohan Das",
    speciality: "ENT",
    council: "WBMC",
    experience: 9,
    fee: 450,
    nextSlot: "11:30",
    slotMinutes: 15,
  },
  {
    name: "Dr. Meera Nair",
    speciality: "Psychiatry",
    council: "TCMC",
    experience: 16,
    fee: 800,
    nextSlot: "12:00",
    slotMinutes: 30,
  },
];

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

/** Real product facts (from the architecture document), shown as big numbers. */
export const FACTS = [
  { value: 100, suffix: "%", label: "of doctors licence-checked with their medical council before they can take bookings" },
  { value: 30, suffix: " min", label: "longest slot a doctor can offer; the shortest is 5 minutes" },
  { value: 24, suffix: "/7", label: "help from the AI assistant with booking, reports and payments" },
  { value: 5, suffix: " min", label: "lifetime of each secure link to your reports, so files never sit open" },
];

export const FAQS = [
  {
    question: "Are the doctors real and qualified?",
    answer:
      "Yes. Before a doctor can take bookings, our team checks their registration number on the state medical council register and reviews their degree and identity documents. Every check is logged.",
  },
  {
    question: "Do I need to install anything?",
    answer: "No. Consultations run in your web browser on any laptop or computer. You only need a camera, a microphone and a steady connection.",
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
