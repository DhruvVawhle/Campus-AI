export interface GroundedCampusRecord {
  queryMatch: RegExp;
  category: "faculty" | "admissions" | "facilities" | "exams" | "general";
  title: string;
  replyEn: string;
  replyHi: string;
  replyMr: string;
  locationDetails?: {
    room: string;
    floor: string;
    wing: string;
    walkTime: string;
  };
  courseDetails?: {
    code: string;
    fee: string;
    seats: number;
    eligibility: string;
  };
}

export const CAMPUS_RECORDS: GroundedCampusRecord[] = [
  {
    queryMatch: /rajesh\s*sharma|c-?301|hod\s*cs|computer\s*science\s*hod/i,
    category: "faculty",
    title: "Dr. Rajesh Sharma (HOD Computer Science)",
    replyEn: "Dr. Rajesh Sharma is the Head of Computer Science. His cabin is C-301 on the 3rd Floor of the West Wing.",
    replyHi: "डॉ. राजेश शर्मा कंप्यूटर साइंस के विभागाध्यक्ष हैं। उनका केबिन वेस्ट विंग की तीसरी मंजिल पर C-301 है।",
    replyMr: "डॉ. राजेश शर्मा हे संगणकशास्त्र विभागप्रमुख आहेत. त्यांचे केबिन पश्चिम विंगच्या तिसऱ्या मजल्यावर C-301 येथे आहे.",
    locationDetails: {
      room: "Cabin C-301",
      floor: "3rd Floor",
      wing: "West Wing",
      walkTime: "2 min walk (Take Elevator 2)",
    },
  },
  {
    queryMatch: /anand\s*deshmukh|a-?202|hod\s*ai|ai\s*ds\s*hod/i,
    category: "faculty",
    title: "Dr. Anand Deshmukh (HOD AI & DS)",
    replyEn: "Dr. Anand Deshmukh is Head of Artificial Intelligence & Data Science. His cabin is A-202 on the 2nd Floor, next to the GPU Machine Learning Lab.",
    replyHi: "डॉ. आनंद देशमुख एआई और डेटा साइंस के प्रमुख हैं। उनका केबिन दूसरी मंजिल पर A-202 में GPU लैब के पास है।",
    replyMr: "डॉ. आनंद देशमुख हे एआय आणि डेटा सायन्सचे प्रमुख आहेत. त्यांचे केबिन दुसऱ्या मजल्यावर A-202 येथे जीपीयूं लॅबजवळ आहे.",
    locationDetails: {
      room: "Cabin A-202",
      floor: "2nd Floor",
      wing: "East Wing",
      walkTime: "2 min walk (Take Staircase B)",
    },
  },
  {
    queryMatch: /fee|fees|eligibility|admissions?|apply|ai\s*-?\s*ds|b\.?tech/i,
    category: "admissions",
    title: "B.Tech Admissions & Fee Structure",
    replyEn: "B.Tech AI & Data Science annual tuition is ₹1,50,000 for 120 approved seats. Eligibility is 10+2 with Physics and Mathematics with at least 45% aggregate.",
    replyHi: "बी.टेक एआई और डेटा साइंस की वार्षिक फीस ₹1,50,000 है (120 सीटें)। पात्रता भौतिकी और गणित के साथ 10+2 में कम से कम 45% अंक है।",
    replyMr: "बी.टेक एआय आणि डेटा सायन्सची वार्षिक फी ₹1,50,000 आहे (120 जागा). पात्रता 10+2 मध्ये भौतिकशास्त्र आणि गणितासह किमान 45% गुण आहे.",
    courseDetails: {
      code: "AI-DS",
      fee: "₹1,50,000 / year",
      seats: 120,
      eligibility: "10+2 with Physics & Math, min 45% (40% for reserved category)",
    },
  },
  {
    queryMatch: /library|reading\s*hall|books|timings?/i,
    category: "facilities",
    title: "Central Library & Digital Reading Hall",
    replyEn: "The Central Library is open from 8:00 AM to 8:00 PM on weekdays. The 2nd Floor Reading Hall remains open until 10:00 PM during examination weeks.",
    replyHi: "सेंट्रल लाइब्रेरी कार्यदिवसों में सुबह 8:00 बजे से रात 8:00 बजे तक खुली रहती है। परीक्षा के दिनों में रीडिंग हॉल रात 10:00 बजे तक खुला रहता है।",
    replyMr: "मध्यवर्ती ग्रंथालय कामकाजाच्या दिवशी सकाळी 8:00 ते रात्री 8:00 पर्यंत खुले असते. परीक्षेच्या काळात वाचन कक्ष रात्री 10:00 वाजेपर्यंत सुरू असतो.",
    locationDetails: {
      room: "Central Library",
      floor: "Ground Floor & Mezzanine",
      wing: "Courtyard Block",
      walkTime: "1 min walk (Right corridor)",
    },
  },
  {
    queryMatch: /exam|schedule|timetable|semester|evaluation/i,
    category: "exams",
    title: "Semester Examinations & Timetable",
    replyEn: "Semester 3 university practicals commence from November 18. The Exam Cell is located in Room A-104 on the Ground Floor.",
    replyHi: "सेमेस्टर 3 के प्रैक्टिकल 18 नवंबर से शुरू हो रहे हैं। एग्जाम सेल ग्राउंड फ्लोर पर रूम A-104 में स्थित है।",
    replyMr: "सत्र 3 च्या प्रात्यक्षिक परीक्षा 18 नोव्हेंबरपासून सुरू होतील. परीक्षा कक्ष तळमजल्यावर रूम A-104 मध्ये आहे.",
    locationDetails: {
      room: "Room A-104 (Exam Cell)",
      floor: "Ground Floor",
      wing: "Admin Block",
      walkTime: "30 sec walk",
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

