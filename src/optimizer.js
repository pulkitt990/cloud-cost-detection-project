export function analyzeResources(data) {
  if (!data || data.length === 0) {
    return {
      current_instances: 0,
      required_instances: 0,
      current_cost: 0,
      optimized_cost: 0,
      efficiency_score: 0,
      avg_cpu: 0,
      team_costs: {},
      instances_to_stop: []
    };
  }

  const avgCpu = data.reduce((s, d) => s + d.cpu_usage, 0) / data.length;
  const currentCost = data.reduce((s, d) => s + d.monthly_cost, 0);

  // Optimization logic: Flag instances using < 20% CPU for shutdown
  const instancesToStop = data.filter(d => d.cpu_usage < 20);
  const wastedCost = instancesToStop.reduce((s, d) => s + d.monthly_cost, 0);

  const optimizedCost = currentCost - wastedCost;
  const requiredInstances = data.length - instancesToStop.length;

  // Per-team cost distribution based on actual retained instances' costs
  const teamCosts = {};
  data.forEach(d => {
    // Current cost allocation
    teamCosts[d.team] = (teamCosts[d.team] || 0) + d.monthly_cost;
  });

  return {
    current_instances: data.length,
    required_instances: requiredInstances,
    current_cost: currentCost,
    optimized_cost: optimizedCost,
    avg_cpu: Math.round(avgCpu * 10) / 10,
    team_costs: teamCosts,
    instances_to_stop: instancesToStop.map(d => d.instance_id) // IDs of instances to shut down
  };
}

