/**
 * Cloud Cost Optimizer — CloudSense Rule Engine
 * Analyzes active instances and generates actionable recommendations.
 *
 * Rules:
 *   IDLE:         cpu_usage < 15%  → Recommend shutdown
 *   UNDERUTILIZED: 15% ≤ cpu < 30% → Recommend downsize to next smaller type
 *   ACTIVE:       cpu ≥ 30%        → OK, no action needed
 */

const DOWNSIZE_MAP = {
  'p3.2xlarge': 'm5.2xlarge', 'g4dn.xlarge': 'm5.xlarge',
  'm5.2xlarge': 'm5.xlarge',  'r5.xlarge':   'r5.large',
  'c5.2xlarge': 'c5.xlarge',  't3.xlarge':   't3.large',
  'm5.xlarge':  'm5.large',   'r5.large':    'm5.large',
  'c5.xlarge':  'c5.large',   'm5.large':    't3.large',
  'c5.large':   't3.large',   't3.large':    't3.medium',
  't3.medium':  't3.small',   't3.small':    't3.micro',
};

// Approximate monthly savings when downsizing (in $)
const DOWNSIZE_SAVINGS = {
  'p3.2xlarge': 1926, 'g4dn.xlarge': 241, 'm5.2xlarge': 139,
  'r5.xlarge': 91,    'c5.2xlarge': 123,  't3.xlarge': 60,
  'm5.xlarge': 69,    'r5.large': 22,     'c5.xlarge': 61,
  'm5.large': 9,      'c5.large': 1,      't3.large': 30,
  't3.medium': 15,    't3.small': 8,
};

export function analyzeResources(data) {
  if (!data || data.length === 0) {
    return {
      current_instances: 0, required_instances: 0,
      current_cost: 0, optimized_cost: 0,
      avg_cpu: 0, team_costs: {},
      instances_to_stop: [], instances_to_downsize: [],
      recommendations: [],
    };
  }

  const avgCpu = data.reduce((s, d) => s + d.cpu_usage, 0) / data.length;
  const currentCost = data.reduce((s, d) => s + d.monthly_cost, 0);

  const idleInstances = data.filter(d => d.cpu_usage < 15);
  const underutilizedInstances = data.filter(d => d.cpu_usage >= 15 && d.cpu_usage < 30);

  // Cost savings from shutting down idle instances
  const shutdownSavings = idleInstances.reduce((s, d) => s + d.monthly_cost, 0);

  // Cost savings from downsizing underutilized instances
  const downsizeSavings = underutilizedInstances.reduce((s, d) => {
    return s + (DOWNSIZE_SAVINGS[d.instance_type] || 0);
  }, 0);

  const totalSavings = shutdownSavings + downsizeSavings;
  const optimizedCost = Math.max(0, currentCost - totalSavings);
  const requiredInstances = data.length - idleInstances.length;

  // Per-team cost distribution
  const teamCosts = {};
  data.forEach(d => {
    teamCosts[d.team] = (teamCosts[d.team] || 0) + d.monthly_cost;
  });

  // Generate human-readable recommendations
  const recommendations = [
    ...idleInstances.map(d => ({
      instance_id: d.instance_id,
      type: 'IDLE',
      action: 'Stop',
      savings: d.monthly_cost,
      reason: `CPU only ${d.cpu_usage}% — idle for ${d.uptime_days} days`,
    })),
    ...underutilizedInstances.map(d => ({
      instance_id: d.instance_id,
      type: 'UNDERUTILIZED',
      action: `Downsize to ${DOWNSIZE_MAP[d.instance_type] || 'smaller type'}`,
      savings: DOWNSIZE_SAVINGS[d.instance_type] || 0,
      reason: `CPU only ${d.cpu_usage}% — overprovisioned for load`,
    })),
  ];

  return {
    current_instances: data.length,
    required_instances: requiredInstances,
    current_cost: currentCost,
    optimized_cost: optimizedCost,
    avg_cpu: Math.round(avgCpu * 10) / 10,
    team_costs: teamCosts,
    instances_to_stop: idleInstances.map(d => d.instance_id),
    instances_to_downsize: underutilizedInstances.map(d => d.instance_id),
    recommendations,
  };
}
