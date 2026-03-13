// Company usage data (from company_usage.csv)
export const companyData = [
  { team: "Development", employee: "Development_Lead_1", cpu_usage: 80, ram_usage: 5, active: true },
  { team: "Development", employee: "Development_Dev_2", cpu_usage: 49, ram_usage: 10, active: true },
  { team: "Development", employee: "Development_Dev_3", cpu_usage: 75, ram_usage: 15, active: true },
  { team: "Development", employee: "Development_Dev_4", cpu_usage: 78, ram_usage: 16, active: true },
  { team: "Operations", employee: "Operations_Lead_1", cpu_usage: 4, ram_usage: 5, active: true },
  { team: "Operations", employee: "Operations_Dev_2", cpu_usage: 16, ram_usage: 8, active: true },
  { team: "Operations", employee: "Operations_Dev_3", cpu_usage: 26, ram_usage: 16, active: true },
  { team: "Operations", employee: "Operations_Dev_4", cpu_usage: 4, ram_usage: 8, active: true },
  { team: "Data Science", employee: "Data Science_Lead_1", cpu_usage: 45, ram_usage: 11, active: true },
  { team: "Data Science", employee: "Data Science_Dev_2", cpu_usage: 43, ram_usage: 16, active: true },
  { team: "Data Science", employee: "Data Science_Dev_3", cpu_usage: 4, ram_usage: 7, active: true },
  { team: "Data Science", employee: "Data Science_Dev_4", cpu_usage: 38, ram_usage: 16, active: true },
  { team: "R&D", employee: "R&D_Lead_1", cpu_usage: 42, ram_usage: 11, active: true },
  { team: "R&D", employee: "R&D_Dev_2", cpu_usage: 30, ram_usage: 8, active: true },
  { team: "R&D", employee: "R&D_Dev_3", cpu_usage: 73, ram_usage: 16, active: true },
  { team: "R&D", employee: "R&D_Dev_4", cpu_usage: 17, ram_usage: 7, active: true },
];

export function getUniqueTeams(data) {
  return [...new Set(data.map(d => d.team))];
}
