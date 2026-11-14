export interface TimetableRow {
  date: string;
  time: string;
  code: string;
  subject: string;
  venue: string;
}

export interface FeeRow {
  head: string;
  amount: string;
  frequency: string;
}

export interface GroundedCampusRecord {
  queryMatch: RegExp;
  category: "faculty" | "admissions" | "facilities" | "exams" | "general";
  title: string;
  replyEn: string;
  replyHi: string;
  replyMr: string;
  followUps?: string[];
  qrUri?: string;
  locationDetails?: {
    room: string;
    floor: string;
    wing: string;
    walkTime: string;
    waypointSteps?: string[];
    mapCoordinates?: {
      start: [number, number];
      elevator: [number, number];
      destination: [number, number];
    };
  };
  courseDetails?: {
    code: string;
    fee: string;
    seats: number;
    eligibility: string;
    feeBreakdown?: FeeRow[];
  };
  timetableDetails?: {
    semester: string;
    examType: string;
    rows: TimetableRow[];
    highlight: string;
  };
}

export const CAMPUS_RECORDS: GroundedCampusRecord[] = [
  {
    queryMatch: /rajesh\s*sharma|c-?301|hod\s*cs|computer\s*science\s*hod/i,
    category: "faculty",
    title: "Dr. Rajesh Sharma (HOD Computer Science)",
    replyEn: "Dr. Rajesh Sharma is Head of Computer Science. Cabin C-301 is located on the 3rd Floor of the West Wing.",
    replyHi: "डॉ. राजेश शर्मा कंप्यूटर साइंस के विभागाध्यक्ष हैं। उनका केबिन वेस्ट विंग की तीसरी मंजिल पर C-301 है।",
    replyMr: "डॉ. राजेश शर्मा हे संगणकशास्त्र विभागप्रमुख आहेत. त्यांचे केबिन पश्चिम विंगच्या तिसऱ्या मजल्यावर C-301 येथे आहे.",
    followUps: [
      "Check Dr. Sharma's office hours",
      "Show floor map to C-301",
      "Send directions to my phone",
    ],
    qrUri: "https://campus.edu/nav?loc=C-301&floor=3",
    locationDetails: {
      room: "Cabin C-301",
      floor: "3rd Floor",
      wing: "West Wing",
      walkTime: "2 min walk (Elevator 2)",
      waypointSteps: [
        "Walk straight 15 meters toward West Wing corridor.",
        "Take Elevator 2 to 3rd Floor.",
        "Turn left out of elevator; Cabin C-301 is the second door on your right.",
      ],
      mapCoordinates: {
        start: [30, 160],
        elevator: [130, 90],
        destination: [250, 45],
      },
    },
  },
  {
    queryMatch: /anand\s*deshmukh|a-?202|hod\s*ai|ai\s*ds\s*hod/i,
    category: "faculty",
    title: "Dr. Anand Deshmukh (HOD AI & DS)",
    replyEn: "Dr. Anand Deshmukh is Head of Artificial Intelligence & Data Science. His cabin is A-202 on the 2nd Floor, next to the GPU Machine Learning Lab.",
    replyHi: "डॉ. आनंद देशमुख एआई और डेटा साइंस के प्रमुख हैं। उनका केबिन दूसरी मंजिल पर A-202 में GPU लैब के पास है।",
    replyMr: "डॉ. आनंद देशमुख हे एआय आणि डेटा सायन्सचे प्रमुख आहेत. त्यांचे केबिन दुसऱ्या मजल्यावर A-202 येथे जीपीयूं लॅबजवळ आहे.",
    followUps: [
      "Show floor map to A-202",
      "Check AI-DS department faculty",
      "Send directions to phone",
    ],
    qrUri: "https://campus.edu/nav?loc=A-202&floor=2",
    locationDetails: {
      room: "Cabin A-202",
      floor: "2nd Floor",
      wing: "East Wing",
      walkTime: "2 min walk (Staircase B)",
      waypointSteps: [
        "Head through the central glass corridor toward East Wing.",
        "Take Staircase B to 2nd Floor.",
        "Cabin A-202 is adjacent to the GPU Machine Learning Lab.",
      ],
      mapCoordinates: {
        start: [30, 160],
        elevator: [110, 120],
        destination: [230, 80],
      },
    },
  },
  {
    queryMatch: /fee|fees|eligibility|admissions?|apply|ai\s*-?\s*ds|b\.?tech/i,
    category: "admissions",
    title: "B.Tech AI & Data Science — Admissions & Fees",
    replyEn: "B.Tech AI & Data Science annual tuition is ₹1,45,000 with ₹25,000 lab & development fee (Total: ₹1,70,000/yr) for 120 approved seats. Eligibility requires 10+2 with PCM at 45% minimum.",
    replyHi: "बी.टेक एआई और डेटा साइंस की वार्षिक फीस ₹1,45,000 तथा ₹25,000 लैब शुल्क है (कुल: ₹1,70,000/वर्ष, 120 सीटें)। पात्रता 10+2 में PCM के साथ न्यूनतम 45% है।",
    replyMr: "बी.टेक एआय आणि डेटा सायन्सची वार्षिक फी ₹1,45,000 आणि ₹25,000 लॅब शुल्क आहे (एकूण: ₹1,70,000/वर्ष, 120 जागा). पात्रता 10+2 PCM मध्ये किमान 45% आहे.",
    followUps: [
      "View detailed fee breakdown",
      "Eligibility & reservation criteria",
      "Compare with Computer Engineering",
    ],
    qrUri: "https://campus.edu/admissions/ai-ds-brochure.pdf",
    courseDetails: {
      code: "AI-DS",
      fee: "₹1,70,000 / year",
      seats: 120,
      eligibility: "10+2 PCM min 45% (40% for reserved category) + MHT-CET / JEE Main score",
      feeBreakdown: [
        { head: "Tuition Fee", amount: "₹1,45,000", frequency: "Per Annum" },
        { head: "Lab & Development Fee", amount: "₹25,000", frequency: "Per Annum" },
        { head: "Refundable Security Deposit", amount: "₹5,000", frequency: "One-Time" },
        { head: "Total 1st Year Fee", amount: "₹1,75,000", frequency: "1st Year Total" },
      ],
    },
  },
  {
    queryMatch: /library|reading\s*hall|books|timings?/i,
    category: "facilities",
    title: "Central Library & Digital Reading Hall",
    replyEn: "The Central Library operates from 8:00 AM to 8:00 PM on weekdays. The 2nd Floor Reading Hall stays open until 10:00 PM during examination weeks with full Wi-Fi and power hubs.",
    replyHi: "सेंट्रल लाइब्रेरी कार्यदिवसों में सुबह 8:00 बजे से रात 8:00 बजे तक खुली रहती है। परीक्षा के दिनों में रीडिंग हॉल रात 10:00 बजे तक खुला रहता है।",
    replyMr: "मध्यवर्ती ग्रंथालय कामकाजाच्या दिवशी सकाळी 8:00 ते रात्री 8:00 पर्यंत खुले असते. परीक्षेच्या काळात वाचन कक्ष रात्री 10:00 वाजेपर्यंत सुरू असतो.",
    followUps: [
      "Reading hall rules & timings",
      "Digital library & book search",
      "Show directions to Central Library",
    ],
    qrUri: "https://campus.edu/library/catalog",
    locationDetails: {
      room: "Central Library & Digital Hub",
      floor: "Ground Floor & Mezzanine",
      wing: "Courtyard Block",
      walkTime: "1 min walk (Right corridor)",
      waypointSteps: [
        "Exit reception lobby and turn right into Courtyard corridor.",
        "Walk 35 meters past the student lounge.",
        "Enter through the double teak wood glass doors.",
      ],
      mapCoordinates: {
        start: [30, 160],
        elevator: [90, 150],
        destination: [180, 140],
      },
    },
  },
  {
    queryMatch: /exam|schedule|timetable|semester|evaluation/i,
    category: "exams",
    title: "Semester 3 Examination Timetable",
    replyEn: "Semester 3 university practicals commence from November 18, and theory examinations begin on December 2. Hall tickets can be collected from Exam Cell Room A-104.",
    replyHi: "सेमेस्टर 3 के प्रैक्टिकल 18 नवंबर से और थ्योरी परीक्षाएं 2 दिसंबर से शुरू हो रही हैं। हॉल टिकट एग्जाम सेल रूम A-104 से प्राप्त करें।",
    replyMr: "सत्र 3 च्या प्रात्यक्षिक परीक्षा 18 नोव्हेंबरपासून आणि लेखी परीक्षा 2 डिसेंबरपासून सुरू होतील. हॉल तिकीट परीक्षा कक्ष रूम A-104 मधून मिळवा.",
    followUps: [
      "Download Timetable PDF",
      "Where is Exam Cell Room A-104?",
      "Hall ticket collection rules",
    ],
    qrUri: "https://campus.edu/exams/sem3-timetable.pdf",
    locationDetails: {
      room: "Exam Cell (Room A-104)",
      floor: "Ground Floor",
      wing: "Admin Block",
      walkTime: "30 sec walk",
      waypointSteps: [
        "Walk past the turnstile behind this kiosk.",
        "Turn right into Corridor A.",
        "Room A-104 is the third door on your left.",
      ],
      mapCoordinates: {
        start: [30, 160],
        elevator: [60, 150],
        destination: [100, 130],
      },
    },
    timetableDetails: {
      semester: "Semester 3 (Winter 2026)",
      examType: "End-Semester University Examination",
      highlight: "First theory paper commences Dec 2 at 10:30 AM in Hall A-104",
      rows: [
        { date: "Nov 18, 2026", time: "10:00 AM", code: "AI-301", subject: "Data Structures Practical", venue: "Lab 3" },
        { date: "Nov 21, 2026", time: "10:00 AM", code: "DS-302", subject: "Applied Statistics Lab", venue: "GPU Lab" },
        { date: "Dec 02, 2026", time: "10:30 AM", code: "AI-303", subject: "Discrete Mathematics (Theory)", venue: "Room A-104" },
        { date: "Dec 05, 2026", time: "10:30 AM", code: "CS-304", subject: "Operating Systems (Theory)", venue: "Room B-201" },
      ],
    },
  },
];

export function findGroundedRecord(query: string): GroundedCampusRecord | null {
  for (const record of CAMPUS_RECORDS) {
    if (record.queryMatch.test(query)) {
      return record;
    }
  }
  return null;
}
