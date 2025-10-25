import { ExtractedDataCard } from "../ExtractedDataCard";

export default function ExtractedDataCardExample() {
  const mockData = {
    caseNumber: "CV-2024-001234",
    parties: [
      "Plaintiff: Maria Johnson",
      "Defendant: MegaCorp Industries LLC",
      "Defense Counsel: Smith & Associates"
    ],
    deadlines: [
      {
        date: "November 15, 2024",
        description: "Motion to Compel Discovery Responses",
        priority: "high" as const,
      },
      {
        date: "December 1, 2024",
        description: "Expert Witness Designation Deadline",
        priority: "medium" as const,
      },
      {
        date: "January 10, 2025",
        description: "Pre-Trial Conference",
        priority: "medium" as const,
      },
    ],
    keyFacts: [
      "Plaintiff alleges wrongful termination after reporting safety violations",
      "Email evidence shows 3 prior complaints filed with HR department",
      "Witness testimony available from 4 co-workers who observed incidents",
      "Company policy manual contradicts stated termination reasons"
    ],
    confidence: 0.94,
  };

  return (
    <div className="p-6 max-w-3xl">
      <ExtractedDataCard data={mockData} />
    </div>
  );
}
