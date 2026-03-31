export const resumes: Resume[] = [
    {
        id: "1",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: {
            overallScore: 85,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "2",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: {
            overallScore: 55,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "3",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: {
            overallScore: 75,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "4",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: {
            overallScore: 85,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "5",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: {
            overallScore: 55,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "6",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: {
            overallScore: 75,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
];

export const AIResponseFormat = `
      interface Feedback {
      overallScore: number; // Weighted average — compute as: ATS*0.35 + content*0.25 + skills*0.20 + structure*0.12 + toneAndStyle*0.08. Round to nearest integer.
      ATS: {
        score: number; // 0-100. Rate purely on ATS keyword matching, formatting compatibility, and parsability.
        tips: {
          type: "good" | "improve";
          tip: string; // give 3-4 tips
        }[];
      };
      toneAndStyle: {
        score: number; // 0-100
        tips: {
          type: "good" | "improve";
          tip: string; // short title
          explanation: string; // detailed explanation
        }[]; // give 3-4 tips
      };
      content: {
        score: number; // 0-100
        tips: {
          type: "good" | "improve";
          tip: string;
          explanation: string;
        }[]; // give 3-4 tips
      };
      structure: {
        score: number; // 0-100
        tips: {
          type: "good" | "improve";
          tip: string;
          explanation: string;
        }[]; // give 3-4 tips
      };
      skills: {
        score: number; // 0-100
        tips: {
          type: "good" | "improve";
          tip: string;
          explanation: string;
        }[]; // give 3-4 tips
      };
    }

    SCORING CALIBRATION — follow these anchors strictly, do NOT inflate scores:
    - 90-100: Exceptional. Near-perfect. Almost no room for improvement.
    - 70-89:  Good. Solid resume with only minor issues.
    - 50-69:  Average. Noticeable gaps or weaknesses. Needs improvement.
    - 30-49:  Poor. Multiple significant issues. Will likely be rejected by ATS.
    - 0-29:   Very poor. Major structural or content issues.
    A typical resume scores between 45-75. Only truly outstanding resumes score above 85.
    Do NOT give high scores just to be encouraging — low scores help users improve.
    All scores MUST be integers between 0 and 100 (inclusive).`;

export const prepareInstructions = ({jobTitle, jobDescription}: { jobTitle: string; jobDescription: string; }) =>
    `You are an expert in ATS (Applicant Tracking System) and resume analysis.
      Please analyze the ATTACHED RESUME FILE (image or PDF) and rate it against the job details provided below.
      IMPORTANT: If you cannot see the file, please state specifically what you are missing.
      Please rate and suggest how to improve the resume.
      The rating can be low if the resume is bad.
      Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
      If there is a lot to improve, don't hesitate to give low scores. This is to help the user to improve their resume.
      If available, use the job description for the job user is applying to to give more detailed feedback.
      If provided, take the job description into consideration.
      The job title is: ${jobTitle}
      The job description is: ${jobDescription}
      Provide the feedback using the following format:
      ${AIResponseFormat}
      Return the analysis as an JSON object, without any other text and without the backticks.
      Do not include any other text or comments.`;