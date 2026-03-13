// Port of optimizer.py
export const INSTANCE_COST = 5000; // Monthly cost per instance

export function analyzeResources(data) {
  if (!data || data.length === 0) {
    return {
      required_instances: 1,
      optimized_cost: INSTANCE_COST,
      efficiency_score: 0,
      avg_cpu: 0,
      team_costs: {},
    };
  }

  const avgCpu = data.reduce((s, d) => s + d.cpu_usage, 0) / data.length;
  const totalCpu = data.reduce((s, d) => s + d.cpu_usage, 0);

  // Heuristic: Each instance handles ~100 CPU units safely
  const requiredInstances = Math.max(2, Math.ceil(totalCpu / 100));
  const optimizedCost = requiredInstances * INSTANCE_COST;

  // Per-team cost distribution based on relative usage
  const teamUsage = {};
  data.forEach(d => {
    teamUsage[d.team] = (teamUsage[d.team] || 0) + d.cpu_usage;
  });
  const totalUsage = Object.values(teamUsage).reduce((s, v) => s + v, 0);
  const teamCosts = {};
  if (totalUsage > 0) {
    for (const [team, usage] of Object.entries(teamUsage)) {
      teamCosts[team] = (usage / totalUsage) * optimizedCost;
    }
  }

  return {
    required_instances: requiredInstances,
    optimized_cost: Math.round(optimizedCost),
    avg_cpu: Math.round(avgCpu * 10) / 10,
    team_costs: teamCosts,
  };
}
