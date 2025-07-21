import { ContributionCard } from "@/components/ContributionCard";

export default function RejectedContributions({
  contributions,
  isRequestContribution = false,
}: {
  contributions: any[];
  isRequestContribution?: boolean;
}) {
  if (!contributions.length) return null;
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-red-700">
        Rejected Contributions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contributions.map((contribution) => (
          <ContributionCard
            key={contribution._id}
            contribution={contribution}
            isRequestContribution={isRequestContribution}
          />
        ))}
      </div>
    </div>
  );
}
