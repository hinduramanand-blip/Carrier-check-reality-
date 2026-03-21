export const jobCategories = [
  {
    category: "Software & IT",
    jobs: [
      "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
      "Mobile App Developer", "iOS Developer", "Android Developer", "DevOps Engineer",
      "Cloud Architect", "Systems Administrator", "Database Administrator", "QA Engineer",
      "Test Automation Engineer", "Security Analyst", "Penetration Tester", "Machine Learning Engineer",
      "AI Researcher", "Data Scientist", "Data Analyst", "Data Engineer", "Blockchain Developer",
      "Web3 Developer", "Smart Contract Engineer", "Game Developer", "Unity Developer",
      "Unreal Engine Developer", "IT Support Specialist", "Network Engineer", "Scrum Master", "Product Manager"
    ]
  },
  {
    category: "Engineering (Core)",
    jobs: [
      "Mechanical Engineer", "Civil Engineer", "Electrical Engineer", "Aerospace Engineer",
      "Chemical Engineer", "Biomedical Engineer", "Environmental Engineer", "Industrial Engineer",
      "Structural Engineer", "Automotive Engineer", "Marine Engineer", "Petroleum Engineer",
      "Materials Engineer", "Robotics Engineer", "Mechatronics Engineer", "Manufacturing Engineer",
      "Quality Engineer", "Process Engineer", "Instrumentation Engineer", "HVAC Engineer",
      "Geotechnical Engineer", "Transportation Engineer", "Water Resources Engineer", "Acoustic Engineer",
      "Mining Engineer", "Nuclear Engineer", "Optical Engineer", "Reliability Engineer", "Safety Engineer", "Systems Engineer"
    ]
  },
  {
    category: "Content Creation & Media",
    jobs: [
      "YouTuber", "Vlogger", "Podcaster", "Streamer", "Twitch Streamer", "Video Editor",
      "Cinematographer", "Film Director", "Screenwriter", "Animator", "3D Artist",
      "Motion Graphics Designer", "Voice Actor", "Audio Engineer", "Sound Designer",
      "Photographer", "Photojournalist", "Copywriter", "Blogger", "Technical Writer",
      "Author", "Ghostwriter", "Journalist", "News Anchor", "Radio Host", "Producer",
      "Art Director", "Creative Director", "Illustrator", "Graphic Designer"
    ]
  },
  {
    category: "Social Media & Marketing",
    jobs: [
      "Social Media Manager", "Social Media Strategist", "Community Manager", "Influencer",
      "Brand Ambassador", "Digital Marketing Manager", "SEO Specialist", "SEM Specialist",
      "Content Marketing Manager", "Email Marketing Specialist", "Performance Marketer",
      "Growth Hacker", "Affiliate Marketing Manager", "Public Relations (PR) Manager",
      "Communications Director", "Media Buyer", "Event Planner", "Event Coordinator",
      "Market Research Analyst", "Brand Manager", "Product Marketing Manager", "Advertising Executive",
      "Campaign Manager", "Social Media Analyst", "E-commerce Manager", "Conversion Rate Optimizer",
      "Inbound Marketing Specialist", "Trade Show Coordinator", "Sponsorship Manager", "Marketing Automation Specialist"
    ]
  },
  {
    category: "Business & Finance",
    jobs: [
      "Chief Executive Officer (CEO)", "Chief Financial Officer (CFO)", "Chief Operating Officer (COO)",
      "Entrepreneur", "Founder", "Business Analyst", "Management Consultant", "Investment Banker",
      "Financial Analyst", "Accountant", "Auditor", "Tax Consultant", "Wealth Manager",
      "Portfolio Manager", "Risk Analyst", "Actuary", "Compliance Officer", "Human Resources (HR) Manager",
      "Talent Acquisition Specialist", "Technical Recruiter", "Sales Executive", "Account Executive",
      "Business Development Manager", "Customer Success Manager", "Real Estate Agent", "Property Manager",
      "Supply Chain Manager", "Logistics Coordinator", "Procurement Specialist", "Operations Manager"
    ]
  },
  {
    category: "Healthcare & Medical",
    jobs: [
      "General Practitioner (Doctor)", "Surgeon", "Registered Nurse", "Nurse Practitioner",
      "Pharmacist", "Dentist", "Orthodontist", "Physical Therapist", "Occupational Therapist",
      "Speech-Language Pathologist", "Psychologist", "Psychiatrist", "Medical Assistant",
      "Physician Assistant", "Radiologic Technologist", "Ultrasound Technician", "Paramedic",
      "EMT", "Veterinarian", "Veterinary Technician", "Optometrist", "Chiropractor",
      "Dietitian", "Nutritionist", "Public Health Administrator", "Epidemiologist",
      "Medical Laboratory Scientist", "Phlebotomist", "Dental Hygienist", "Anesthesiologist"
    ]
  },
  {
    category: "Education & Academia",
    jobs: [
      "Professor", "Assistant Professor", "High School Teacher", "Middle School Teacher",
      "Elementary School Teacher", "Kindergarten Teacher", "Special Education Teacher",
      "School Principal", "Vice Principal", "School Counselor", "Academic Advisor",
      "Instructional Designer", "Curriculum Developer", "Educational Technologist", "Tutor",
      "Test Prep Instructor", "ESL Teacher", "Corporate Trainer", "Learning and Development Manager",
      "Admissions Counselor", "Registrar", "Librarian", "Archivist", "Museum Curator",
      "Research Assistant", "Postdoctoral Researcher", "Dean of Students", "Athletic Director",
      "Coach", "Education Policy Analyst"
    ]
  },
  {
    category: "Arts, Design & Architecture",
    jobs: [
      "Architect", "Interior Designer", "Urban Planner", "Landscape Architect", "Fashion Designer",
      "Textile Designer", "Industrial Designer", "Product Designer", "UX Designer", "UI Designer",
      "Interaction Designer", "Game Designer", "Set Designer", "Costume Designer", "Makeup Artist",
      "Fine Artist", "Painter", "Sculptor", "Ceramist", "Jeweler", "Florist", "Art Conservator",
      "Gallery Director", "Art Appraiser", "Music Producer", "Composer", "Singer-Songwriter",
      "Musician", "DJ", "Choreographer"
    ]
  },
  {
    category: "Public Service & Defense",
    jobs: [
      "Police Officer", "Detective", "Firefighter", "Paramedic", "Emergency Management Director",
      "Military Officer", "Soldier", "Air Force Pilot", "Naval Officer", "Coast Guard",
      "Border Patrol Agent", "Customs Officer", "Intelligence Analyst", "CIA Agent", "FBI Agent",
      "Politician", "Mayor", "City Manager", "Diplomat", "Foreign Service Officer",
      "Judge", "Lawyer", "Attorney", "Paralegal", "Legal Assistant",
      "Court Reporter", "Social Worker", "Community Organizer", "Nonprofit Director", "Grant Writer"
    ]
  },
  {
    category: "Hospitality & Trades",
    jobs: [
      "Chef", "Sous Chef", "Pastry Chef", "Restaurant Manager", "Sommelier",
      "Bartender", "Barista", "Hotel Manager", "Concierge", "Travel Agent",
      "Tour Guide", "Flight Attendant", "Pilot", "Air Traffic Controller", "Ship Captain",
      "Electrician", "Plumber", "Carpenter", "Welder", "HVAC Technician",
      "Mechanic", "Auto Technician", "Heavy Equipment Operator", "Construction Manager", "General Contractor",
      "Landscaper", "Farmer", "Agricultural Manager", "Fisherman", "Forestry Technician"
    ]
  }
];

export const jobList = jobCategories.flatMap(c => c.jobs).sort();
