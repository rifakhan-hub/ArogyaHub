import type { KbArticle } from "@/api/types";

type SeedArticle = Pick<KbArticle, "title" | "slug" | "category" | "status" | "audience" | "body_md" | "reviewer">;

export const kbSeed: SeedArticle[] = [
  {
    title: "Joining a video consultation",
    slug: "join-video-call",
    category: "howto",
    status: "published",
    audience: ["patient", "doctor"],
    reviewer: null,
    body_md: `## Before the call

- Use Chrome on Android or any up-to-date desktop browser.
- Sit somewhere quiet with good light on your face.
- Keep your reports ready. You can share them with the doctor from **Reports**.

## Joining

1. Open **Appointments** and find your consultation.
2. The **Join call** button turns on **10 minutes before** your start time.
3. Allow camera and microphone when the browser asks.
4. You will wait in the waiting room until the doctor admits you.

## If the call drops

Tap **Join call** again. You can rejoin until 15 minutes after your slot ends.`,
  },
  {
    title: "Booking a consultation",
    slug: "book-consultation",
    category: "howto",
    status: "published",
    audience: ["visitor", "patient"],
    reviewer: null,
    body_md: `## Find a doctor

Search by symptom or speciality, then filter by language, fee and next available time. Only doctors whose licence we have checked are listed.

## Pick a time

Each doctor sets their own slot length, from 5 to 30 minutes. Longer slots suit new problems; shorter slots suit follow-ups.

## Confirm

Add a short reason for your visit and choose which reports to share. You will get an email and SMS confirmation.`,
  },
  {
    title: "Rescheduling or cancelling",
    slug: "reschedule-cancel",
    category: "faq",
    status: "published",
    audience: ["patient"],
    reviewer: null,
    body_md: `**Can I move my appointment?**
Yes. Open the appointment and choose **Reschedule** to pick another free time with the same doctor.

**Can I cancel?**
Yes, from the same screen. Cancel at least 2 hours before the start time so the doctor can offer the time to someone else.`,
  },
  {
    title: "Uploading reports and scans",
    slug: "upload-reports",
    category: "howto",
    status: "published",
    audience: ["patient"],
    reviewer: null,
    body_md: `You can upload PDFs, photos (JPG, PNG) and DICOM scans (.dcm or a .zip of a study) to **Reports**.

- Maximum size is 200 MB per scan study.
- Reports stay private. A doctor sees a report only when you share it with their appointment.
- Every time a doctor opens a report, it is recorded.`,
  },
  {
    title: "What is a DICOM file?",
    slug: "what-is-dicom",
    category: "faq",
    status: "published",
    audience: ["visitor", "patient", "doctor"],
    reviewer: null,
    body_md: `DICOM is the standard format for X-ray, CT and MRI images. Hospitals and scan centres often give it to you on a CD or as a download link.

Upload the DICOM files to **Reports** and your doctor can view them in the built-in viewer with zoom and contrast controls.`,
  },
  {
    title: "Fever in adults: when to see a doctor",
    slug: "fever-adults",
    category: "health",
    status: "published",
    audience: ["visitor", "patient"],
    reviewer: "Dr. Simran Kaur, MD (Medicine)",
    body_md: `Most fevers settle within 2-3 days with rest and fluids.

## Book a consultation if

- the fever lasts more than 3 days
- you have a rash, severe headache or stiff neck
- you are pregnant, over 65, or have diabetes, heart or kidney disease

## Call 112 now if

- there is confusion, difficulty breathing or chest pain
- the person is hard to wake up

*This is general information, not a diagnosis. Please consult a doctor for advice about your health.*`,
  },
  {
    title: "Dengue warning signs",
    slug: "dengue-warning-signs",
    category: "health",
    status: "published",
    audience: ["visitor", "patient"],
    reviewer: "Dr. Arjun Mehta, MD (Paediatrics)",
    body_md: `Dengue is common after the monsoon. Warning signs usually appear as the fever goes down, around day 3 to 7.

- Severe stomach pain or repeated vomiting
- Bleeding from gums or nose, or blood in vomit or stool
- Feeling very tired, restless or irritable

If you notice any of these, go to a hospital straight away.

*This is general information, not a diagnosis.*`,
  },
  {
    title: "Keeping your health data private",
    slug: "data-privacy",
    category: "faq",
    status: "published",
    audience: ["visitor", "patient", "doctor"],
    reviewer: null,
    body_md: `We store reports in private, encrypted storage and follow India's Digital Personal Data Protection Act, 2023.

- Only you, and doctors you share with, can open your reports.
- Admins can see that a report exists but every access is logged.
- You can ask us to delete your account and data from **Profile**.`,
  },
  {
    title: "For doctors: setting your availability",
    slug: "doctor-availability",
    category: "howto",
    status: "published",
    audience: ["doctor"],
    reviewer: null,
    body_md: `Open **Availability** and add a block for each day you consult. For each block choose a slot length: 5, 10, 15, 20 or 30 minutes.

For example, mornings can be 10-minute follow-ups and evenings 15-minute new consultations. Blocks on the same day cannot overlap.`,
  },
  {
    title: "For doctors: how verification works",
    slug: "doctor-verification",
    category: "faq",
    status: "published",
    audience: ["doctor"],
    reviewer: null,
    body_md: `After you register, upload your registration certificate and degree. Our team checks your number on the medical council register.

This usually takes 1-2 working days. If we can't verify a document, we tell you why and you can upload a clearer copy.`,
  },
  {
    title: "Preparing for your first video consultation",
    slug: "first-consultation",
    category: "howto",
    status: "draft",
    audience: ["patient"],
    reviewer: null,
    body_md: `## A day before

- Test your camera and microphone from **Profile > Device check**.
- Upload any recent reports.

## On the day

Write down your symptoms, when they started and any medicines you take.`,
  },
  {
    title: "Managing high blood pressure at home",
    slug: "blood-pressure-home",
    category: "health",
    status: "draft",
    audience: ["patient"],
    reviewer: null,
    body_md: `Regular home readings help your doctor adjust treatment.

- Measure at the same time each day, seated, after 5 minutes of rest.
- Keep a log and share it before your consultation.

*Draft: waiting for medical review.*`,
  },
];
