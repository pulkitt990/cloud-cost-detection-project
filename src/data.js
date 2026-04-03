/**
 * Cloud Infrastructure Dataset — CloudSense
 * Based on real AWS EC2 on-demand pricing (us-east-1, Linux)
 * Includes 40 instances across 5 departments
 *
 * Instance types and monthly costs (approximate real AWS pricing):
 *   t3.micro    → $7    | t3.small   → $15   | t3.medium  → $30
 *   t3.large    → $60   | t3.xlarge  → $120  |
 *   m5.large    → $69   | m5.xlarge  → $138  | m5.2xlarge → $277
 *   c5.large    → $61   | c5.xlarge  → $122  | c5.2xlarge → $245
 *   r5.large    → $91   | r5.xlarge  → $182  |
 *   g4dn.xlarge → $379  | p3.2xlarge → $2203 |
 */
export const companyData = [
  // ── Development (10 instances) ────────────────────────────────────────────
  { team: "Development",  instance_id: "i-dev-001", instance_type: "c5.xlarge",   region: "us-east-1", monthly_cost: 122,  cpu_usage: 78, ram_usage: 62, uptime_days: 30 },
  { team: "Development",  instance_id: "i-dev-002", instance_type: "t3.large",    region: "us-east-1", monthly_cost: 60,   cpu_usage: 65, ram_usage: 55, uptime_days: 30 },
  { team: "Development",  instance_id: "i-dev-003", instance_type: "m5.xlarge",   region: "us-east-1", monthly_cost: 138,  cpu_usage: 72, ram_usage: 68, uptime_days: 30 },
  { team: "Development",  instance_id: "i-dev-004", instance_type: "t3.medium",   region: "us-east-1", monthly_cost: 30,   cpu_usage: 45, ram_usage: 40, uptime_days: 30 },
  { team: "Development",  instance_id: "i-dev-005", instance_type: "c5.2xlarge",  region: "us-west-2", monthly_cost: 245,  cpu_usage: 83, ram_usage: 71, uptime_days: 30 },
  { team: "Development",  instance_id: "i-dev-006", instance_type: "t3.large",    region: "us-west-2", monthly_cost: 60,   cpu_usage: 9,  ram_usage: 12, uptime_days: 45 },  // IDLE
  { team: "Development",  instance_id: "i-dev-007", instance_type: "m5.large",    region: "us-east-1", monthly_cost: 69,   cpu_usage: 55, ram_usage: 48, uptime_days: 30 },
  { team: "Development",  instance_id: "i-dev-008", instance_type: "t3.small",    region: "ap-south-1",monthly_cost: 15,   cpu_usage: 25, ram_usage: 22, uptime_days: 30 },
  { team: "Development",  instance_id: "i-dev-009", instance_type: "t3.medium",   region: "eu-west-1", monthly_cost: 30,   cpu_usage: 11, ram_usage: 14, uptime_days: 60 },  // IDLE
  { team: "Development",  instance_id: "i-dev-010", instance_type: "c5.xlarge",   region: "us-east-1", monthly_cost: 122,  cpu_usage: 67, ram_usage: 59, uptime_days: 30 },

  // ── Operations (8 instances) ──────────────────────────────────────────────
  { team: "Operations",   instance_id: "i-ops-001", instance_type: "m5.2xlarge",  region: "us-east-1", monthly_cost: 277,  cpu_usage: 41, ram_usage: 70, uptime_days: 30 },
  { team: "Operations",   instance_id: "i-ops-002", instance_type: "t3.xlarge",   region: "us-east-1", monthly_cost: 120,  cpu_usage: 6,  ram_usage: 10, uptime_days: 90 },  // IDLE
  { team: "Operations",   instance_id: "i-ops-003", instance_type: "c5.large",    region: "us-east-1", monthly_cost: 61,   cpu_usage: 34, ram_usage: 31, uptime_days: 30 },
  { team: "Operations",   instance_id: "i-ops-004", instance_type: "t3.micro",    region: "us-east-1", monthly_cost: 7,    cpu_usage: 3,  ram_usage: 8,  uptime_days: 120 }, // IDLE
  { team: "Operations",   instance_id: "i-ops-005", instance_type: "m5.large",    region: "us-west-2", monthly_cost: 69,   cpu_usage: 29, ram_usage: 42, uptime_days: 30 },
  { team: "Operations",   instance_id: "i-ops-006", instance_type: "t3.medium",   region: "eu-west-1", monthly_cost: 30,   cpu_usage: 19, ram_usage: 25, uptime_days: 30 },
  { team: "Operations",   instance_id: "i-ops-007", instance_type: "r5.large",    region: "us-east-1", monthly_cost: 91,   cpu_usage: 48, ram_usage: 75, uptime_days: 30 },
  { team: "Operations",   instance_id: "i-ops-008", instance_type: "t3.large",    region: "ap-south-1",monthly_cost: 60,   cpu_usage: 7,  ram_usage: 11, uptime_days: 75 },  // IDLE

  // ── Data Science (8 instances) ────────────────────────────────────────────
  { team: "Data Science", instance_id: "i-ds-001",  instance_type: "p3.2xlarge",  region: "us-east-1", monthly_cost: 2203, cpu_usage: 88, ram_usage: 91, uptime_days: 14 },
  { team: "Data Science", instance_id: "i-ds-002",  instance_type: "g4dn.xlarge", region: "us-east-1", monthly_cost: 379,  cpu_usage: 74, ram_usage: 80, uptime_days: 21 },
  { team: "Data Science", instance_id: "i-ds-003",  instance_type: "m5.2xlarge",  region: "us-east-1", monthly_cost: 277,  cpu_usage: 55, ram_usage: 65, uptime_days: 30 },
  { team: "Data Science", instance_id: "i-ds-004",  instance_type: "r5.xlarge",   region: "us-west-2", monthly_cost: 182,  cpu_usage: 62, ram_usage: 82, uptime_days: 30 },
  { team: "Data Science", instance_id: "i-ds-005",  instance_type: "c5.2xlarge",  region: "us-east-1", monthly_cost: 245,  cpu_usage: 5,  ram_usage: 9,  uptime_days: 55 },  // IDLE
  { team: "Data Science", instance_id: "i-ds-006",  instance_type: "m5.xlarge",   region: "eu-west-1", monthly_cost: 138,  cpu_usage: 43, ram_usage: 55, uptime_days: 30 },
  { team: "Data Science", instance_id: "i-ds-007",  instance_type: "t3.xlarge",   region: "us-east-1", monthly_cost: 120,  cpu_usage: 31, ram_usage: 38, uptime_days: 30 },
  { team: "Data Science", instance_id: "i-ds-008",  instance_type: "g4dn.xlarge", region: "us-west-2", monthly_cost: 379,  cpu_usage: 4,  ram_usage: 7,  uptime_days: 45 },  // IDLE (forgotten GPU node)

  // ── R&D (8 instances) ────────────────────────────────────────────────────
  { team: "R&D",          instance_id: "i-rd-001",  instance_type: "m5.xlarge",   region: "us-east-1", monthly_cost: 138,  cpu_usage: 58, ram_usage: 52, uptime_days: 30 },
  { team: "R&D",          instance_id: "i-rd-002",  instance_type: "c5.xlarge",   region: "us-east-1", monthly_cost: 122,  cpu_usage: 70, ram_usage: 45, uptime_days: 30 },
  { team: "R&D",          instance_id: "i-rd-003",  instance_type: "t3.large",    region: "eu-west-1", monthly_cost: 60,   cpu_usage: 8,  ram_usage: 13, uptime_days: 88 },  // IDLE
  { team: "R&D",          instance_id: "i-rd-004",  instance_type: "r5.large",    region: "us-east-1", monthly_cost: 91,   cpu_usage: 38, ram_usage: 67, uptime_days: 30 },
  { team: "R&D",          instance_id: "i-rd-005",  instance_type: "m5.large",    region: "ap-south-1",monthly_cost: 69,   cpu_usage: 26, ram_usage: 33, uptime_days: 30 },
  { team: "R&D",          instance_id: "i-rd-006",  instance_type: "c5.large",    region: "us-west-2", monthly_cost: 61,   cpu_usage: 49, ram_usage: 40, uptime_days: 30 },
  { team: "R&D",          instance_id: "i-rd-007",  instance_type: "t3.medium",   region: "us-east-1", monthly_cost: 30,   cpu_usage: 12, ram_usage: 18, uptime_days: 95 },  // IDLE
  { team: "R&D",          instance_id: "i-rd-008",  instance_type: "m5.2xlarge",  region: "us-east-1", monthly_cost: 277,  cpu_usage: 77, ram_usage: 73, uptime_days: 30 },

  // ── Security (6 instances) ────────────────────────────────────────────────
  { team: "Security",     instance_id: "i-sec-001", instance_type: "c5.xlarge",   region: "us-east-1", monthly_cost: 122,  cpu_usage: 52, ram_usage: 44, uptime_days: 30 },
  { team: "Security",     instance_id: "i-sec-002", instance_type: "m5.large",    region: "us-east-1", monthly_cost: 69,   cpu_usage: 33, ram_usage: 51, uptime_days: 30 },
  { team: "Security",     instance_id: "i-sec-003", instance_type: "t3.large",    region: "us-west-2", monthly_cost: 60,   cpu_usage: 7,  ram_usage: 9,  uptime_days: 110 }, // IDLE
  { team: "Security",     instance_id: "i-sec-004", instance_type: "r5.large",    region: "us-east-1", monthly_cost: 91,   cpu_usage: 61, ram_usage: 73, uptime_days: 30 },
  { team: "Security",     instance_id: "i-sec-005", instance_type: "t3.medium",   region: "eu-west-1", monthly_cost: 30,   cpu_usage: 41, ram_usage: 36, uptime_days: 30 },
  { team: "Security",     instance_id: "i-sec-006", instance_type: "c5.large",    region: "ap-south-1",monthly_cost: 61,   cpu_usage: 28, ram_usage: 32, uptime_days: 30 },
];

export function getUniqueTeams(data) {
  return [...new Set(data.map(d => d.team))];
}
