// Company usage data (simulated cloud instances)
export const companyData = [
  { team: "Development", instance_id: "Dev_Server_1", instance_type: "t3.large", monthly_cost: 65, cpu_usage: 80, ram_usage: 5, active: true },
  { team: "Development", instance_id: "Dev_Server_2", instance_type: "t3.medium", monthly_cost: 35, cpu_usage: 49, ram_usage: 10, active: true },
  { team: "Development", instance_id: "Dev_Server_3", instance_type: "c5.xlarge", monthly_cost: 153, cpu_usage: 75, ram_usage: 15, active: true },
  { team: "Development", instance_id: "Dev_Server_4", instance_type: "m5.large", monthly_cost: 85, cpu_usage: 78, ram_usage: 16, active: true },
  { team: "Operations", instance_id: "Ops_Server_1", instance_type: "t3.medium", monthly_cost: 35, cpu_usage: 4, ram_usage: 5, active: true },
  { team: "Operations", instance_id: "Ops_Server_2", instance_type: "t3.large", monthly_cost: 65, cpu_usage: 16, ram_usage: 8, active: true },
  { team: "Operations", instance_id: "Ops_Server_3", instance_type: "m5.large", monthly_cost: 85, cpu_usage: 26, ram_usage: 16, active: true },
  { team: "Operations", instance_id: "Ops_Server_4", instance_type: "t3.micro", monthly_cost: 10, cpu_usage: 4, ram_usage: 8, active: true },
  { team: "Data Science", instance_id: "DS_Node_1", instance_type: "p3.2xlarge", monthly_cost: 2235, cpu_usage: 45, ram_usage: 11, active: true },
  { team: "Data Science", instance_id: "DS_Node_2", instance_type: "g4dn.xlarge", monthly_cost: 500, cpu_usage: 43, ram_usage: 16, active: true },
  { team: "Data Science", instance_id: "DS_Node_3", instance_type: "m5.xlarge", monthly_cost: 170, cpu_usage: 4, ram_usage: 7, active: true },
  { team: "Data Science", instance_id: "DS_Node_4", instance_type: "c5.2xlarge", monthly_cost: 306, cpu_usage: 38, ram_usage: 16, active: true },
  { team: "R&D", instance_id: "RD_Server_1", instance_type: "m5.xlarge", monthly_cost: 170, cpu_usage: 42, ram_usage: 11, active: true },
  { team: "R&D", instance_id: "RD_Server_2", instance_type: "t3.large", monthly_cost: 65, cpu_usage: 30, ram_usage: 8, active: true },
  { team: "R&D", instance_id: "RD_Server_3", instance_type: "c5.large", monthly_cost: 76, cpu_usage: 73, ram_usage: 16, active: true },
  { team: "R&D", instance_id: "RD_Server_4", instance_type: "t3.medium", monthly_cost: 35, cpu_usage: 17, ram_usage: 7, active: true },
];

export function getUniqueTeams(data) {
  return [...new Set(data.map(d => d.team))];
}
