import {
  FiMapPin,
  FiCompass,
  FiCalendar,
  FiInfo,
} from "react-icons/fi";
import { LuGraduationCap } from "react-icons/lu";

export type SLRTCEDepartmentCategory = "all" | "faculty" | "admissions" | "exams" | "facilities";

export interface SLRTCEDirectoryTopic {
  id: string;
  category: "faculty" | "admissions" | "exams" | "facilities";
  title: string;
  subtitle: string;
  deptBadge: string;
  roomBadge: string;
  floorBadge: string;
  prompt: string;
}

export interface WaypointLocation {
  block: string;
  floor: string;
  room: string;
  landmark: string;
  walkTime: string;
  waypointSteps: string[];
  qrUri: string;
  mapCoordinates?: {
    start: [number, number];
    elevator: [number, number];
    destination: [number, number];
  };
}

export interface SLRTCEKnowledgeRecord {
  queryMatch: RegExp;
  category: SLRTCEDepartmentCategory;
  title: string;
  replyEn: string;
  replyHi: string;
  replyMr: string;
  replyHinglish: string;
  locationDetails?: WaypointLocation;
  followUps?: string[];
  feeBreakdown?: {
    course: string;
    intake: number;
    tuitionFee: string;
    developmentFee: string;
    totalAnnual: string;
    eligibility: string;
    capCode: string;
  };
  timetableDetails?: {
    semester: string;
    examCell: string;
    scheduleHighlights: { date: string; time: string; subject: string; room: string }[];
  };
}

export const SLRTCE_CATEGORIES: { id: SLRTCEDepartmentCategory; labelEn: string; labelHi: string; labelMr: string; labelHinglish: string }[] = [
  { id: "all", labelEn: "All", labelHi: "सभी", labelMr: "सर्व", labelHinglish: "All" },
  { id: "faculty", labelEn: "Faculty", labelHi: "प्राध्यापक", labelMr: "प्राध्यापक", labelHinglish: "Faculty" },
  { id: "admissions", labelEn: "Admissions", labelHi: "प्रवेश", labelMr: "प्रवेश", labelHinglish: "Admissions" },
  { id: "exams", labelEn: "Exams", labelHi: "परीक्षा", labelMr: "परीक्षा", labelHinglish: "Exams" },
  { id: "facilities", labelEn: "Facilities", labelHi: "सुविधाएँ", labelMr: "सुविधा", labelHinglish: "Facilities" },
];

export const SLRTCE_DIRECTORY: SLRTCEDirectoryTopic[] = [
  {
    id: "fac-rajesh-sharma",
    category: "faculty",
    title: "Dr. Rajesh Sharma",
    subtitle: "HOD, Computer Engineering",
    deptBadge: "Computer Engg",
    roomBadge: "Cabin C-301",
    floorBadge: "3rd Floor",
    prompt: "Where is Dr. Rajesh Sharma's cabin in West Wing?",
  },
  {
    id: "fac-anand-deshmukh",
    category: "faculty",
    title: "Dr. Anand Deshmukh",
    subtitle: "Coordinator, AI & Data Science",
    deptBadge: "AI & DS Dept",
    roomBadge: "Cabin A-202",
    floorBadge: "2nd Floor",
    prompt: "Where is Dr. Anand Deshmukh's cabin?",
  },
  {
    id: "adm-btech-aids",
    category: "admissions",
    title: "B.Tech AI & Data Science Admissions",
    subtitle: "CAP Round, Fees & Intake (120 Seats)",
    deptBadge: "Admissions 2026",
    roomBadge: "Admin Desk #2",
    floorBadge: "Ground Floor",
    prompt: "What are the fees, intake and eligibility for B.Tech AI & Data Science?",
  },
  {
    id: "exm-cell-timetable",
    category: "exams",
    title: "Exam Cell & University Timetable",
    subtitle: "Room A-104, Ground Floor • Sem III/V",
    deptBadge: "Exam Cell",
    roomBadge: "Room A-104",
    floorBadge: "Ground Floor",
    prompt: "What is the examination timetable for semester 3 and where is the Exam Cell?",
  },
  {
    id: "facil-library",
    category: "facilities",
    title: "Central Library & Reading Hall",
    subtitle: "2nd Floor, Main Block • Open 8 AM – 9 PM",
    deptBadge: "Central Library",
    roomBadge: "Main Reading Hall",
    floorBadge: "2nd Floor",
    prompt: "When does the central library and reading hall open?",
  },
];

export const SLRTCE_QUICK_PROMPTS = [
  {
    eyebrow: "WAYFINDING",
    label: "Locate a Faculty Cabin",
    prompt: "Where is Dr. Rajesh Sharma's cabin in West Wing?",
    icon: FiMapPin,
    subtitle: "HOD cabins & staff rooms across Block A & C",
  },
  {
    eyebrow: "ADMISSIONS 2026",
    label: "2026 Admission Checklist",
    prompt: "What documents are needed for First Year Engineering admission?",
    icon: LuGraduationCap,
    subtitle: "CAP round eligibility, fees & required certificates",
  },
  {
    eyebrow: "CAMPUS HOURS",
    label: "Today's Campus Hours",
    prompt: "When does the central library and reading hall open?",
    icon: FiInfo,
    subtitle: "Reading hall, administrative desks & exam cell timings",
  },
];

export const SLRTCE_LOCALIZATION = {
  en: {
    stationTitle: "SLRTCE",
    stationSubtitle: "CampusAI Reception Desk",
    institutionFullName: "Shree L. R. Tiwari College of Engineering",
    campusLocation: "Mira Road (E), Mumbai MMR",
    directoryHeading: "Campus Directory",
    directorySubtitle: "Select a department or speak into the microphone.",
    liveAssistant: "Live Assistant",
    resetSession: "Reset Session",
    welcomeGreeting: "Namaste! Welcome to Shree L. R. Tiwari College of Engineering. Tap a topic on the left or ask me anything.",
    suggestedHeading: "Suggested Inquiries",
    tapToSpeak: "Tap to Speak",
    listening: "Listening…",
    processing: "Processing…",
    speaking: "Speaking…",
    inputPlaceholder: "Or type your question…",
    languageLabel: "Language",
    voiceOutputOn: "Voice Output: On",
    voiceOutputMuted: "Voice Output: Muted",
    statusReady: "Ready",
    statusLocalActive: "Local Active",
    statusMicBlocked: "Microphone Blocked",
    humanDeskCTA: "Contact Staff Desk",
    humanDeskSent: "Staff desk at Counter 1 has been paged.",
    footerLeft: "SLRTCE Main Lobby Kiosk • Mira Road (E)",
    footerRight: "Privacy: Mic active only during speech",
    afterHoursBadge: "After Hours • Central Library Open till 9:00 PM",
    openHoursBadge: "Campus Open • Offices 9:00 AM – 5:00 PM",
  },
  hi: {
    stationTitle: "SLRTCE",
    stationSubtitle: "CampusAI स्वागत कक्ष",
    institutionFullName: "श्री एल. आर. तिवारी कॉलेज ऑफ इंजीनियरिंग",
    campusLocation: "मीरा रोड (पूर्व), मुंबई",
    directoryHeading: "परिसर डायरेक्टरी",
    directorySubtitle: "विभाग चुनें या सीधे माइक्रोफ़ोन में बोलें।",
    liveAssistant: "लाइव सहायक",
    resetSession: "सत्र रीसेट करें",
    welcomeGreeting: "नमस्ते! श्री एल. आर. तिवारी कॉलेज ऑफ इंजीनियरिंग में आपका स्वागत है। बाईं ओर से विषय चुनें या कुछ भी पूछें।",
    suggestedHeading: "सुझाए गए प्रश्न",
    tapToSpeak: "बोलने के लिए टैप करें",
    listening: "सुन रहा हूँ…",
    processing: "प्रोसेस हो रहा है…",
    speaking: "बोल रहा हूँ…",
    inputPlaceholder: "या प्रश्न टाइप करें…",
    languageLabel: "भाषा",
    voiceOutputOn: "आवाज़: चालू",
    voiceOutputMuted: "आवाज़: बंद",
    statusReady: "तैयार",
    statusLocalActive: "लोकल एक्टिव",
    statusMicBlocked: "माइक ब्लॉक है",
    humanDeskCTA: "स्टाफ डेस्क से संपर्क करें",
    humanDeskSent: "काउंटर 1 पर स्टाफ को सूचना भेज दी गई है।",
    footerLeft: "SLRTCE मुख्य लॉबी कियोस्क • मीरा रोड (पूर्व)",
    footerRight: "गोपनीयता: माइक केवल संवाद के समय सक्रिय",
    afterHoursBadge: "कार्यालय समय समाप्त • केंद्रीय पुस्तकालय रात 9:00 बजे तक खुला है",
    openHoursBadge: "परिसर खुला है • कार्यालय 9:00 AM – 5:00 PM",
  },
  mr: {
    stationTitle: "SLRTCE",
    stationSubtitle: "CampusAI स्वागत कक्ष",
    institutionFullName: "श्री एल. आर. तिवारी कॉलेज ऑफ इंजिनिअरिंग",
    campusLocation: "मीरा रोड (पूर्व), मुंबई",
    directoryHeading: "परिसर निर्देशिका",
    directorySubtitle: "विभाग निवडा किंवा थेट संभाषणासाठी बोला.",
    liveAssistant: "थेट सहाय्यक",
    resetSession: "सत्र रीसेट करा",
    welcomeGreeting: "नमस्कार! श्री एल. आर. तिवारी कॉलेज ऑफ इंजिनिअरिंगमध्ये आपले स्वागत आहे. डाव्या बाजूने विषय निवडा किंवा काहीही विचारा.",
    suggestedHeading: "सुचवलेले प्रश्न",
    tapToSpeak: "बोलण्यासाठी टॅप करा",
    listening: "ऐकत आहे…",
    processing: "प्रक्रिया सुरू आहे…",
    speaking: "बोलत आहे…",
    inputPlaceholder: "किंवा प्रश्न टाइप करा…",
    languageLabel: "भाषा",
    voiceOutputOn: "आवाज: चालू",
    voiceOutputMuted: "आवाज: बंद",
    statusReady: "सज्ज",
    statusLocalActive: "स्थानिक सक्रिय",
    statusMicBlocked: "माइक अवरोधित",
    humanDeskCTA: "कर्मचाऱ्यांशी संपर्क साधा",
    humanDeskSent: "काउंटर 1 वरील कर्मचाऱ्यांना माहिती पाठवण्यात आली आहे.",
    footerLeft: "SLRTCE मुख्य लॉबी किऑस्क • मीरा रोड (पूर्व)",
    footerRight: "गोपनीयता: संवाद सुरू असतानाच माइक सक्रिय",
    afterHoursBadge: "ऑफिस बंद • मध्यवर्ती ग्रंथालय रात्री 9:00 पर्यंत सुरू",
    openHoursBadge: "परिसर खुला आहे • कार्यालये 9:00 AM – 5:00 PM",
  },
  hinglish: {
    stationTitle: "SLRTCE",
    stationSubtitle: "CampusAI Reception Desk",
    institutionFullName: "Shree L. R. Tiwari College of Engineering",
    campusLocation: "Mira Road (E), Mumbai",
    directoryHeading: "Campus Directory",
    directorySubtitle: "Department select karein ya microphone me bolein.",
    liveAssistant: "Live Assistant",
    resetSession: "Reset Session",
    welcomeGreeting: "Namaste! Shree L. R. Tiwari College of Engineering me aapka swagat hai. Left se topic tap karein ya inquiry puchein.",
    suggestedHeading: "Suggested Inquiries",
    tapToSpeak: "Tap to Speak",
    listening: "Listening…",
    processing: "Processing…",
    speaking: "Speaking…",
    inputPlaceholder: "Or type your question…",
    languageLabel: "Language",
    voiceOutputOn: "Voice Output: On",
    voiceOutputMuted: "Voice Output: Muted",
    statusReady: "Ready",
    statusLocalActive: "Local Active",
    statusMicBlocked: "Mic Blocked",
    humanDeskCTA: "Contact Staff Desk",
    humanDeskSent: "Counter 1 staff ko inform kar diya gaya hai.",
    footerLeft: "SLRTCE Main Lobby Kiosk • Mira Road (E)",
    footerRight: "Privacy: Mic active only during speech",
    afterHoursBadge: "After Hours • Central Library Open till 9:00 PM",
    openHoursBadge: "Campus Open • Offices 9:00 AM – 5:00 PM",
  },
};

export const SLRTCE_KNOWLEDGE_BASE: SLRTCEKnowledgeRecord[] = [
  {
    queryMatch: /rajesh\s*sharma|c-?301|hod\s*cs|computer\s*eng/i,
    category: "faculty",
    title: "Dr. Rajesh Sharma (HOD, Computer Engineering)",
    replyEn: "Dr. Rajesh Sharma is Head of Computer Engineering. His office is Cabin C-301 on the 3rd Floor of West Wing. Take the West Wing elevator near the Main Foyer.",
    replyHi: "डॉ. राजेश शर्मा कंप्यूटर इंजीनियरिंग के विभागाध्यक्ष हैं। उनका कार्यालय वेस्ट विंग की तीसरी मंजिल पर केबिन C-301 में है। मेन फ़ोयर के पास वेस्ट विंग लिफ्ट लें।",
    replyMr: "डॉ. राजेश शर्मा हे संगणक अभियांत्रिकी विभागप्रमुख आहेत. त्यांचे कार्यालय पश्चिम विंगच्या तिसऱ्या मजल्यावर केबिन C-301 येथे आहे. मुख्य लॉबीजवळील लिफ्ट वापरा.",
    replyHinglish: "Dr. Rajesh Sharma Computer Engineering ke HOD hain. Unka office West Wing 3rd floor par Cabin C-301 me hai. Main Foyer ke pass wali West elevator use karein.",
    locationDetails: {
      block: "West Wing Block C",
      floor: "3rd Floor",
      room: "Cabin C-301",
      landmark: "Take the West Wing elevator near the Main Foyer, turn left on 3rd floor.",
      walkTime: "2 min walk (Elevator 2)",
      waypointSteps: [
        "Head straight 15 meters toward West Wing corridor.",
        "Take Elevator 2 to 3rd Floor.",
        "Turn left out of elevator; Cabin C-301 is the second door on your right.",
      ],
      qrUri: "https://slrtce.in/campus-nav?loc=C-301&floor=3",
      mapCoordinates: {
        start: [30, 160],
        elevator: [130, 90],
        destination: [250, 45],
      },
    },
    followUps: [
      "Check Dr. Sharma's consulting hours",
      "Computer Engineering Faculty List",
      "Contact Department Secretary",
    ],
  },
  {
    queryMatch: /anand\s*deshmukh|a-?202|coordinator|ai\s*&?\s*ds/i,
    category: "faculty",
    title: "Dr. Anand Deshmukh (Coordinator, AI & Data Science)",
    replyEn: "Dr. Anand Deshmukh is Program Coordinator for Artificial Intelligence & Data Science. His office is Cabin A-202 on the 2nd Floor, next to the GPU Machine Learning Lab.",
    replyHi: "डॉ. आनंद देशमुख एआई और डेटा साइंस के प्रोग्राम कोऑर्डिनेटर हैं। उनका केबिन दूसरी मंजिल पर A-202 में GPU लैब के पास है।",
    replyMr: "डॉ. आनंद देशमुख हे एआय आणि डेटा सायन्सचे समन्वयक आहेत. त्यांचे केबिन दुसऱ्या मजल्यावर A-202 येथे जीपीयूं लॅबजवळ आहे.",
    replyHinglish: "Dr. Anand Deshmukh AI & Data Science ke Coordinator hain. Unka cabin 2nd Floor par A-202 me GPU Lab ke theek bagal me hai.",
    locationDetails: {
      block: "East Wing Block A",
      floor: "2nd Floor",
      room: "Cabin A-202",
      landmark: "Take Staircase B to 2nd Floor; cabin is adjacent to the GPU ML Lab.",
      walkTime: "2 min walk (Staircase B)",
      waypointSteps: [
        "Walk through central atrium toward East Wing Block A.",
        "Take Staircase B up to the 2nd Floor.",
        "Cabin A-202 is on your left directly adjacent to the GPU Lab.",
      ],
      qrUri: "https://slrtce.in/campus-nav?loc=A-202&floor=2",
      mapCoordinates: {
        start: [30, 160],
        elevator: [110, 120],
        destination: [230, 80],
      },
    },
    followUps: [
      "AI & DS Department Faculty",
      "GPU Machine Learning Lab Specs",
      "Contact Department Coordinator",
    ],
  },
  {
    queryMatch: /admissions?|fees?|eligibility|cap|intake|b\.?tech/i,
    category: "admissions",
    title: "B.Tech AI & Data Science Admissions (120 Seats)",
    replyEn: "B.Tech AI & Data Science at SLRTCE has an approved intake of 120 seats via MHT-CET/JEE CAP rounds. Annual tuition fee is ₹1,45,000 with ₹25,000 development fee (Total: ₹1,70,000/yr). Eligibility is 10+2 with PCM at 45% minimum.",
    replyHi: "SLRTCE में बी.टेक एआई और डेटा साइंस की 120 स्वीकृत सीटें हैं। वार्षिक ट्यूशन फीस ₹1,45,000 और ₹25,000 डेवलपमेंट शुल्क है (कुल ₹1,70,000/वर्ष)। पात्रता 10+2 PCM में न्यूनतम 45% है।",
    replyMr: "SLRTCE मध्ये बी.टेक एआय आणि डेटा सायन्सच्या 120 जागा आहेत. वार्षिक शिक्षण शुल्क ₹1,45,000 व विकास शुल्क ₹25,000 आहे (एकूण ₹1,70,000/वर्ष). पात्रता 10+2 PCM मध्ये किमान 45% आहे.",
    replyHinglish: "SLRTCE me B.Tech AI & Data Science ki 120 seats hain MHT-CET/JEE CAP rounds se. Annual tuition fee ₹1,45,000 + ₹25,000 development fee (Total ₹1,70,000/yr). Eligibility 10+2 PCM me 45% hai.",
    feeBreakdown: {
      course: "B.Tech in Artificial Intelligence & Data Science (AI & DS)",
      intake: 120,
      tuitionFee: "₹1,45,000",
      developmentFee: "₹25,000",
      totalAnnual: "₹1,70,000",
      eligibility: "10+2 (HSC) with Physics, Math and Chem/CS (Min 45% Open / 40% Reserved) + MHT-CET / JEE Main Score",
      capCode: "DTE Choice Code: 321899510",
    },
    locationDetails: {
      block: "Administrative Block",
      floor: "Ground Floor",
      room: "Admissions Desk Counter 2",
      landmark: "Main Lobby, right side of Reception entrance",
      walkTime: "Immediate (30 meters)",
      waypointSteps: [
        "From the kiosk, face the central staircase.",
        "Turn 45 degrees right toward Administrative Office.",
        "Counter 2 handles Engineering Admissions & Document Verification.",
      ],
      qrUri: "https://slrtce.in/admissions/fe-guidelines",
    },
    followUps: [
      "View document checklist for CAP Round",
      "Show fee breakdown structure",
      "Directions to Admissions Desk Counter 2",
    ],
  },
  {
    queryMatch: /exam|timetable|cell|a-?104|results?|hall\s*ticket/i,
    category: "exams",
    title: "Exam Cell & University Timetable (Room A-104)",
    replyEn: "The Examination Cell is located in Room A-104 on the Ground Floor of Block A. Mumbai University Sem III regular theory examinations commence Nov 28, 2026. Hall tickets are distributed from Counter 1.",
    replyHi: "परीक्षा कक्ष ब्लॉक A के भूतल पर कमरा A-104 में स्थित है। मुंबई विश्वविद्यालय सेमेस्टर 3 की परीक्षाएं 28 नवंबर से शुरू हो रही हैं। हॉल टिकट काउंटर 1 से प्राप्त करें।",
    replyMr: "परीक्षा कक्ष ब्लॉक A च्या तळमजल्यावर रूम A-104 मध्ये आहे. मुंबई विद्यापीठ सत्र 3 च्या परीक्षा 28 नोव्हेंबरपासून सुरू होत आहेत. हॉल तिकीट काउंटर 1 वरून मिळवा.",
    replyHinglish: "Exam Cell Block A ground floor par Room A-104 me hai. Mumbai University Sem 3 exams Nov 28 se shuru ho rahe hain. Hall tickets Counter 1 par mil rahe hain.",
    timetableDetails: {
      semester: "University of Mumbai — B.Tech Semester III Regular / KT (Winter 2026)",
      examCell: "Room A-104, Ground Floor, Block A",
      scheduleHighlights: [
        { date: "Nov 28, 2026", time: "10:30 AM - 01:30 PM", subject: "Applied Mathematics III", room: "Hall A-101 to A-104" },
        { date: "Dec 02, 2026", time: "10:30 AM - 01:30 PM", subject: "Data Structures & Analysis", room: "Hall A-101 to A-104" },
        { date: "Dec 05, 2026", time: "10:30 AM - 01:30 PM", subject: "Database Management Systems", room: "Hall A-101 to A-104" },
      ],
    },
    locationDetails: {
      block: "Block A",
      floor: "Ground Floor",
      room: "Room A-104 (Exam Cell)",
      landmark: "East Corridor Ground Floor, past the Faculty Lounge",
      walkTime: "1 min walk (45 meters)",
      waypointSteps: [
        "Walk into the East corridor on the Ground Floor.",
        "Pass the Faculty Lounge on your left.",
        "Room A-104 (Examination Section) is on your left with student inquiry windows.",
      ],
      qrUri: "https://slrtce.in/exams/timetable-winter-2026",
    },
    followUps: [
      "Show timetable dates and subjects",
      "Walking route to Room A-104",
      "Hall ticket verification procedure",
    ],
  },
  {
    queryMatch: /library|reading\s*hall|books?|open|hours?|catalog/i,
    category: "facilities",
    title: "Central Library & Digital Reading Hall (Main Block, 2nd Floor)",
    replyEn: "The SLRTCE Central Library and Air-Conditioned Reading Hall is on the 2nd Floor of Main Block. The Reading Hall is open from 8:00 AM to 9:00 PM on all instructional days. High-speed Wi-Fi and IEEE digital repositories are accessible to registered students.",
    replyHi: "SLRTCE केंद्रीय पुस्तकालय और वातानुकूलित रीडिंग हॉल मुख्य ब्लॉक की दूसरी मंजिल पर है। यह सुबह 8:00 से रात 9:00 बजे तक खुला रहता है। छात्रों के लिए IEEE ई-रिसोर्स उपलब्ध हैं।",
    replyMr: "SLRTCE चे मध्यवर्ती ग्रंथालय आणि वातानुकूलित वाचन कक्ष मुख्य ब्लॉकच्या दुसऱ्या मजल्यावर आहे. हे सकाळी 8:00 ते रात्री 9:00 पर्यंत खुले असते. विद्यार्थ्यांना वाय-फाय व IEEE डिजिटल लायब्ररी उपलब्ध आहे.",
    replyHinglish: "SLRTCE Central Library & AC Reading Hall Main Block 2nd floor par hai. Daily timings 8:00 AM se 9:00 PM tak hain. IEEE papers and high-speed Wi-Fi available hain.",
    locationDetails: {
      block: "Main Block",
      floor: "2nd Floor",
      room: "Central Library Suite",
      landmark: "Directly above the Main Entrance Foyer, access via Central Staircase",
      walkTime: "1.5 min walk (Central Staircase)",
      waypointSteps: [
        "Take the central double staircase up to 2nd Floor.",
        "The double glass doors in front of you lead directly into the Central Library.",
      ],
      qrUri: "https://slrtce.in/facilities/central-library",
    },
    followUps: [
      "Are visitors allowed in the reading hall?",
      "How to access IEEE Digital Library?",
      "Directions to Central Library 2nd Floor",
    ],
  },
  {
    queryMatch: /document|documents|checklist|first\s*year/i,
    category: "admissions",
    title: "First Year Engineering (FE) Mandatory Documents",
    replyEn: "For First Year Engineering admission under CAP: 1) MHT-CET / JEE Score Card, 2) HSC (12th) Marksheet, 3) SSC (10th) Marksheet, 4) College Leaving / Transfer Certificate, 5) Domicile & Nationality Certificate, 6) Caste/EWS Certificate (if applicable), and 7) CAP Allotment Letter. Bring original plus 3 self-attested sets.",
    replyHi: "प्रथम वर्ष इंजीनियरिंग प्रवेश के लिए आवश्यक दस्तावेज़: 1) MHT-CET/JEE स्कोर कार्ड, 2) 12वीं मार्कशीट, 3) 10वीं मार्कशीट, 4) लीविंग सर्टिफिकेट, 5) डोमिसाइल/राष्ट्रीयता प्रमाण पत्र, 6) जाति/EWS प्रमाण पत्र (यदि लागू हो), 7) CAP सीट अलॉटमेंट लेटर। मूल प्रति के साथ 3 फोटोकॉपी लाएं।",
    replyMr: "प्रथम वर्ष अभियांत्रिकी प्रवेशासाठी आवश्यक कागदपत्रे: 1) MHT-CET/JEE स्कोअर कार्ड, 2) 12 वी गुणपत्रिका, 3) 10 वी गुणपत्रिका, 4) शाळा सोडल्याचा दाखला (LC), 5) अधिवास व राष्ट्रीयत्व प्रमाणपत्र, 6) जात/EWS प्रमाणपत्र (लागू असल्यास), 7) CAP वाटप पत्र. मूळ प्रतीसह 3 झेरॉक्स संच आणा.",
    replyHinglish: "First Year Engineering admission ke mandatory documents: MHT-CET/JEE Score Card, 12th & 10th Marksheets, Leaving Certificate (LC), Domicile/Nationality Certificate, Caste/EWS certificate (if applicable), and CAP Allotment letter. Original ke sath 3 xerox sets required hain.",
    locationDetails: {
      block: "Administrative Block",
      floor: "Ground Floor",
      room: "Counter 2 (Document Verification)",
      landmark: "Admissions Center",
      walkTime: "30 meters from Entrance",
      waypointSteps: [
        "Walk into the Administrative Office on the Ground Floor.",
        "Report to Document Scrutiny Counter 2.",
      ],
      qrUri: "https://slrtce.in/admissions/document-checklist",
    },
    followUps: [
      "Check B.Tech fee structure",
      "Where is Counter 2 located?",
      "Contact Admissions Desk",
    ],
  },
];

export function findSLRTCERecord(query: string): SLRTCEKnowledgeRecord | null {
  const q = query.trim().toLowerCase();
  for (const record of SLRTCE_KNOWLEDGE_BASE) {
    if (record.queryMatch.test(q)) {
      return record;
    }
  }
  return null;
}
