export interface Student {
  id: string;
  name: string;
  completed: string[];
  planning: string[];
  lastMeetingNotes: string;
  discussionPoints: string;
  hasUpdates: boolean;
  isReal?: boolean;
}

export const mockStudents: Student[] = [
  {
    id: "tom_wang",
    name: "Tom Wang",
    completed: [], // Will be populated from API
    planning: [], // Will be populated from API
    lastMeetingNotes: "", // Will be populated from API
    discussionPoints: "", // Will be populated from API
    hasUpdates: true,
    isReal: true,
  },
  {
    id: "1",
    name: "John Smith",
    completed: [
      "Completed literature review on ML algorithms",
      "Submitted conference paper draft",
    ],
    planning: [
      "Start data collection phase",
      "Begin implementation of proposed method",
    ],
    lastMeetingNotes:
      "Discussed potential collaboration with Prof. Johnson's lab. John showed good progress on the literature review. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    discussionPoints:
      "1. Need feedback on conference paper draft\n2. Questions about data collection methodology\n3. Potential collaboration opportunities\n4. Timeline for next milestone",
    hasUpdates: true,
  },
  {
    id: "2",
    name: "Emily Chen",
    completed: ["Finished experimental setup", "Collected preliminary results"],
    planning: [
      "Analysis of experimental data",
      "Begin writing methodology section",
    ],
    lastMeetingNotes:
      "Emily's experimental setup looks promising. Suggested some improvements for data collection. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    discussionPoints:
      "1. Preliminary results analysis\n2. Next phase of experiments\n3. Equipment requirements\n4. Conference submission deadline",
    hasUpdates: true,
  },
  {
    id: "3",
    name: "Michael Johnson",
    completed: [
      "Implemented baseline models",
      "Created visualization dashboard",
    ],
    planning: [
      "Optimize model performance",
      "Prepare for midterm presentation",
    ],
    lastMeetingNotes:
      "Michael needs to focus more on comparing his results with existing methods. Good progress on implementation.",
    discussionPoints:
      "1. Model optimization strategies\n2. Midterm presentation outline\n3. Performance metrics discussion",
    hasUpdates: false,
  },
  {
    id: "4",
    name: "Sarah Williams",
    completed: [
      "Completed system architecture design",
      "Initial testing phase completed",
    ],
    planning: ["Begin integration testing", "Documentation updates"],
    lastMeetingNotes:
      "Sarah's design approach is solid. Discussed potential scalability issues.",
    discussionPoints:
      "1. Integration testing strategy\n2. Documentation structure\n3. System scalability concerns",
    hasUpdates: true,
  },
];
