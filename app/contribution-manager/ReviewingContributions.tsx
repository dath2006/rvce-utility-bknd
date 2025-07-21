import { ContributionCard } from "@/components/ContributionCard";

export default function ReviewingContributions({
  contributions,
  onStatusUpdate,
  isRequestContribution = false,
}: {
  contributions: any[];
  onStatusUpdate: any;
  isRequestContribution?: boolean;
}) {
  if (!contributions.length) return null;
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-blue-700">
        Reviewing Contributions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contributions.map((contribution) => (
          <ContributionCard
            key={contribution._id}
            contribution={contribution}
            onStatusUpdate={onStatusUpdate}
            isRequestContribution={isRequestContribution}
          />
        ))}
      </div>
    </div>
  );
}
