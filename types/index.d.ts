interface Job {
  title: string;
  description: string;
  location: string;
  requiredSkills: string[];
}

interface Resume {
  id: string;
  companyName?: string;
  jobTitle?: string;
  imagePath: string;
  resumePath: string;
  feedback: Feedback;
}

interface FeedbackCategory {
  score: number;  // 0-100, always clamped before display
  tips: {
    type: "good" | "improve";
    tip: string;
    explanation?: string; // ATS tips don't have explanation
  }[];
}

interface Feedback {
  overallScore?: number;  // Optional — we compute this client-side from sub-scores
  ATS?: FeedbackCategory;
  toneAndStyle?: FeedbackCategory;
  content?: FeedbackCategory;
  structure?: FeedbackCategory;
  skills?: FeedbackCategory;
  error?: string; // Set when AI analysis fails entirely
}