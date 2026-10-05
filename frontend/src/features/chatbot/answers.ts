import { SYMPTOM_WORDS } from "@/features/public/content";

const TOPICS: { words: string[]; reply: string }[] = [
  {
    words: ["chest pain", "can't breathe", "cannot breathe", "unconscious", "fainted", "heavy bleeding", "heart attack", "stroke", "suicide"],
    reply: "This sounds urgent. Please call 112 or go to the nearest hospital now. An online consultation isn't the right place for this.",
  },
  {
    words: ["hello", "hi", "hey", "namaste", "good morning", "good evening"],
    reply: "Hello! I can help you book a doctor, understand fees, share reports or get ready for a video consultation. What would you like to know?",
  },
  {
    words: ["book", "appointment", "slot", "schedule", "available"],
    reply:
      "Type a symptom or speciality in the search at the top of this page, pick a doctor, then choose a free slot. A Join button appears on your appointment 10 minutes before the call.",
  },
  {
    words: ["cost", "fee", "fees", "price", "pay", "payment", "charge", "₹"],
    reply: "Each doctor sets their own fee, shown on their card before you book. Most consultations cost ₹400 to ₹800, paid online when you book.",
  },
  {
    words: ["cancel", "reschedule", "refund", "change my"],
    reply: "You can cancel or move a booking from your appointments page. If a consultation is cancelled, the fee is refunded to you.",
  },
  {
    words: ["report", "x-ray", "xray", "scan", "upload", "share", "vault", "dicom", "pdf", "mri"],
    reply:
      "Upload reports and scans (PDF, photos or DICOM) to your MedVault. During a booking or a call, choose Share reports so your doctor can see them. You can stop sharing any time.",
  },
  {
    words: ["prescription", "medicine", "medicines", "tablet", "pharmacy"],
    reply: "When the call ends, your doctor's notes and prescription are saved to your vault. You can download them or show them at any pharmacy.",
  },
  {
    words: ["verify", "verified", "licence", "license", "real", "genuine", "qualified", "fake"],
    reply:
      "Every doctor's registration number is checked on their state medical council register, along with their degree and ID, before they can take a single booking.",
  },
  {
    words: ["private", "privacy", "safe", "secure", "data", "who can see"],
    reply: "Only you and the doctors you choose can see your records. Each time a file is opened, it uses a secure link that expires after 5 minutes.",
  },
  {
    words: ["video", "call", "join", "camera", "microphone", "install", "app", "browser", "laptop"],
    reply: "Consultations run in your web browser, so there's nothing to install. Use a laptop or computer with a camera and microphone, and join from your appointment page.",
  },
  {
    words: ["doctor for", "join as", "i am a doctor", "register as"],
    reply: "Doctors can join by writing to doctors@aarogyahub.in. Once your registration is verified, you choose your hours and slot lengths.",
  },
];

const FALLBACK =
  "I'm not sure about that yet. I can help with booking, fees, reports, prescriptions and video consultations. For anything else, write to help@aarogyahub.in.";

function mentions(text: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}`).test(text);
}

export function answer(question: string) {
  const text = question.toLowerCase();
  const topic = TOPICS.find((t) => t.words.some((word) => mentions(text, word)));
  if (topic) return topic.reply;

  const matching = Object.entries(SYMPTOM_WORDS)
    .filter(([, words]) => words.some((word) => mentions(text, word)))
    .map(([speciality]) => speciality);
  const speciality = matching.find((s) => s !== "General Physician") ?? matching[0];
  if (speciality) {
    return `I can't diagnose, but a ${speciality} doctor can help with that. Search "${speciality}" at the top of the page to see who is free in the next hour.`;
  }
  return FALLBACK;
}

export const SUGGESTIONS = ["How do I book?", "What does it cost?", "How do I share my reports?", "Are the doctors verified?"];
