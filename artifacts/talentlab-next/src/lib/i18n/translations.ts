/**
 * i18n translations for the Candidate Form
 * Supports: English (en), Hindi (hi), Gujarati (gu)
 * Switch language via React state — no page refresh needed.
 */

export type Locale = "en" | "hi" | "gu";

export interface CandidateFormTranslations {
  title: string;
  subtitle: string;
  langLabel: string;
  // Personal Info
  sectionPersonal: string;
  fullName: string;
  fullNamePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  location: string;
  locationPlaceholder: string;
  // Professional Info
  sectionProfessional: string;
  currentRole: string;
  currentRolePlaceholder: string;
  experienceYears: string;
  experienceYearsPlaceholder: string;
  currentCtc: string;
  currentCtcPlaceholder: string;
  expectedCtc: string;
  expectedCtcPlaceholder: string;
  noticePeriod: string;
  noticePeriodPlaceholder: string;
  // Skills
  sectionSkills: string;
  skills: string;
  skillsPlaceholder: string;
  skillsHelp: string;
  // Summary
  sectionSummary: string;
  summary: string;
  summaryPlaceholder: string;
  // Source
  source: string;
  sourceOptions: { value: string; label: string }[];
  // Actions
  btnSubmit: string;
  btnCancel: string;
  btnGenerateAI: string;
  // Validation
  required: string;
  invalidEmail: string;
  // Success/Error
  successMessage: string;
  errorMessage: string;
}

const translations: Record<Locale, CandidateFormTranslations> = {
  en: {
    title: "Add New Candidate",
    subtitle: "Fill in the candidate's details below",
    langLabel: "Language",
    sectionPersonal: "Personal Information",
    fullName: "Full Name",
    fullNamePlaceholder: "e.g. Rahul Sharma",
    email: "Email Address",
    emailPlaceholder: "rahul@example.com",
    phone: "Phone Number",
    phonePlaceholder: "+91 98765 43210",
    location: "Current Location",
    locationPlaceholder: "e.g. Mumbai, Maharashtra",
    sectionProfessional: "Professional Details",
    currentRole: "Current Role / Designation",
    currentRolePlaceholder: "e.g. Senior Software Engineer",
    experienceYears: "Years of Experience",
    experienceYearsPlaceholder: "e.g. 5",
    currentCtc: "Current CTC (₹ LPA)",
    currentCtcPlaceholder: "e.g. 12",
    expectedCtc: "Expected CTC (₹ LPA)",
    expectedCtcPlaceholder: "e.g. 18",
    noticePeriod: "Notice Period (Days)",
    noticePeriodPlaceholder: "e.g. 30",
    sectionSkills: "Skills",
    skills: "Technical Skills",
    skillsPlaceholder: "React, Node.js, PostgreSQL...",
    skillsHelp: "Separate skills with commas",
    sectionSummary: "Professional Summary",
    summary: "Summary",
    summaryPlaceholder: "Brief overview of candidate's background and strengths...",
    source: "Source",
    sourceOptions: [
      { value: "PORTAL", label: "Job Portal" },
      { value: "REFERRAL", label: "Referral" },
      { value: "SOCIAL", label: "Social Media" },
      { value: "INTERNAL", label: "Internal" },
      { value: "DIRECT", label: "Direct Application" },
    ],
    btnSubmit: "Add Candidate",
    btnCancel: "Cancel",
    btnGenerateAI: "✨ Generate AI Summary",
    required: "This field is required",
    invalidEmail: "Please enter a valid email address",
    successMessage: "Candidate added successfully!",
    errorMessage: "Failed to add candidate. Please try again.",
  },

  hi: {
    title: "नया उम्मीदवार जोड़ें",
    subtitle: "नीचे उम्मीदवार का विवरण भरें",
    langLabel: "भाषा",
    sectionPersonal: "व्यक्तिगत जानकारी",
    fullName: "पूरा नाम",
    fullNamePlaceholder: "जैसे: राहुल शर्मा",
    email: "ईमेल पता",
    emailPlaceholder: "rahul@example.com",
    phone: "फ़ोन नंबर",
    phonePlaceholder: "+91 98765 43210",
    location: "वर्तमान स्थान",
    locationPlaceholder: "जैसे: मुंबई, महाराष्ट्र",
    sectionProfessional: "पेशेवर विवरण",
    currentRole: "वर्तमान पद / पदनाम",
    currentRolePlaceholder: "जैसे: वरिष्ठ सॉफ़्टवेयर इंजीनियर",
    experienceYears: "अनुभव (वर्षों में)",
    experienceYearsPlaceholder: "जैसे: 5",
    currentCtc: "वर्तमान CTC (₹ LPA)",
    currentCtcPlaceholder: "जैसे: 12",
    expectedCtc: "अपेक्षित CTC (₹ LPA)",
    expectedCtcPlaceholder: "जैसे: 18",
    noticePeriod: "नोटिस अवधि (दिन)",
    noticePeriodPlaceholder: "जैसे: 30",
    sectionSkills: "कौशल",
    skills: "तकनीकी कौशल",
    skillsPlaceholder: "React, Node.js, PostgreSQL...",
    skillsHelp: "कौशल को अल्पविराम से अलग करें",
    sectionSummary: "पेशेवर सारांश",
    summary: "सारांश",
    summaryPlaceholder: "उम्मीदवार की पृष्ठभूमि और ताकत का संक्षिप्त विवरण...",
    source: "स्रोत",
    sourceOptions: [
      { value: "PORTAL", label: "जॉब पोर्टल" },
      { value: "REFERRAL", label: "रेफरल" },
      { value: "SOCIAL", label: "सोशल मीडिया" },
      { value: "INTERNAL", label: "आंतरिक" },
      { value: "DIRECT", label: "सीधा आवेदन" },
    ],
    btnSubmit: "उम्मीदवार जोड़ें",
    btnCancel: "रद्द करें",
    btnGenerateAI: "✨ AI सारांश बनाएं",
    required: "यह फ़ील्ड आवश्यक है",
    invalidEmail: "कृपया एक वैध ईमेल पता दर्ज करें",
    successMessage: "उम्मीदवार सफलतापूर्वक जोड़ा गया!",
    errorMessage: "उम्मीदवार जोड़ने में विफल। कृपया पुनः प्रयास करें।",
  },

  gu: {
    title: "નવો ઉમેદવાર ઉમેરો",
    subtitle: "નીચે ઉમેદવારની વિગત ભરો",
    langLabel: "ભાષા",
    sectionPersonal: "વ્યક્તિગત માહિતી",
    fullName: "પૂરું નામ",
    fullNamePlaceholder: "ઉદા: રાહુલ શર્મા",
    email: "ઈ-મેઈલ સરનામું",
    emailPlaceholder: "rahul@example.com",
    phone: "ફોન નંબર",
    phonePlaceholder: "+91 98765 43210",
    location: "વર્તમાન સ્થળ",
    locationPlaceholder: "ઉદા: અમદાવાદ, ગુજરાત",
    sectionProfessional: "વ્યવસાયિક વિગત",
    currentRole: "વર્તમાન હોદ્દો / પદ",
    currentRolePlaceholder: "ઉદા: સિનિયર સૉફ્ટવેર એન્જિનિયર",
    experienceYears: "અનુભવ (વર્ષોમાં)",
    experienceYearsPlaceholder: "ઉદા: 5",
    currentCtc: "વર્તમાન CTC (₹ LPA)",
    currentCtcPlaceholder: "ઉદા: 12",
    expectedCtc: "અપેક્ષિત CTC (₹ LPA)",
    expectedCtcPlaceholder: "ઉદા: 18",
    noticePeriod: "નોટિસ અવધિ (દિવસ)",
    noticePeriodPlaceholder: "ઉદા: 30",
    sectionSkills: "કૌશલ",
    skills: "ટેકનિકલ કૌશલ",
    skillsPlaceholder: "React, Node.js, PostgreSQL...",
    skillsHelp: "કૌશલ અલ્પ-વિરામ (,) થી અલગ કરો",
    sectionSummary: "વ્યવસાયિક સારાંશ",
    summary: "સારાંશ",
    summaryPlaceholder: "ઉમેદવારની પૃષ્ઠભૂમિ અને શક્તિઓ નો સંક્ષિપ્ત વિવરણ...",
    source: "સ્ત્રોત",
    sourceOptions: [
      { value: "PORTAL", label: "જોબ પોર્ટલ" },
      { value: "REFERRAL", label: "રેફરલ" },
      { value: "SOCIAL", label: "સોશ્યલ મીડિયા" },
      { value: "INTERNAL", label: "આંતરિક" },
      { value: "DIRECT", label: "સીધી અરજી" },
    ],
    btnSubmit: "ઉમેદવાર ઉમેરો",
    btnCancel: "રદ કરો",
    btnGenerateAI: "✨ AI સારાંશ બનાવો",
    required: "આ ફીલ્ડ ભરવી જરૂરી છે",
    invalidEmail: "કૃપા કરી માન્ય ઈ-મેઈલ સરનામું દાખલ કરો",
    successMessage: "ઉમેદવાર સફળતાપૂર્વક ઉમેરાયો!",
    errorMessage: "ઉમેદવાર ઉમેરવામાં નિષ્ફળ. ફરી પ્રયાસ કરો.",
  },
};

export function useTranslations(locale: Locale): CandidateFormTranslations {
  return translations[locale] ?? translations.en;
}

export default translations;
