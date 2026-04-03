/**
 * CloudSense — Employee Resource Usage Data
 *
 * Default dataset uses realistic cloud cost data per employee/role.
 * You can replace this entirely by uploading your own CSV file.
 *
 * Required CSV columns:
 *   team, employee, instance_type, monthly_cost, cpu_usage, ram_usage
 *
 * Example:
 *   Development,Alice Johnson,t3.large,60,78,55
 *   Operations,Bob Singh,t3.micro,7,4,8
 */

export let companyData = [
  // Development Team
  { team: "Development", employee: "Alice Johnson",    instance_type: "c5.xlarge",  monthly_cost: 122, cpu_usage: 78, ram_usage: 62 },
  { team: "Development", employee: "Ravi Sharma",      instance_type: "t3.large",   monthly_cost: 60,  cpu_usage: 65, ram_usage: 55 },
  { team: "Development", employee: "Priya Mehta",      instance_type: "m5.xlarge",  monthly_cost: 138, cpu_usage: 72, ram_usage: 68 },
  { team: "Development", employee: "James Carter",     instance_type: "t3.medium",  monthly_cost: 30,  cpu_usage: 45, ram_usage: 40 },
  { team: "Development", employee: "Neha Gupta",       instance_type: "c5.2xlarge", monthly_cost: 245, cpu_usage: 83, ram_usage: 71 },
  { team: "Development", employee: "Arjun Patel",      instance_type: "t3.large",   monthly_cost: 60,  cpu_usage:  9, ram_usage: 12 }, // idle
  { team: "Development", employee: "Sara Williams",    instance_type: "m5.large",   monthly_cost: 69,  cpu_usage: 55, ram_usage: 48 },
  { team: "Development", employee: "Karan Verma",      instance_type: "t3.medium",  monthly_cost: 30,  cpu_usage: 11, ram_usage: 14 }, // idle

  // Operations Team
  { team: "Operations",  employee: "David Kim",        instance_type: "m5.2xlarge", monthly_cost: 277, cpu_usage: 41, ram_usage: 70 },
  { team: "Operations",  employee: "Anita Rao",        instance_type: "t3.xlarge",  monthly_cost: 120, cpu_usage:  6, ram_usage: 10 }, // idle
  { team: "Operations",  employee: "Michael Chen",     instance_type: "c5.large",   monthly_cost: 61,  cpu_usage: 34, ram_usage: 31 },
  { team: "Operations",  employee: "Sunita Nair",      instance_type: "t3.micro",   monthly_cost: 7,   cpu_usage:  3, ram_usage:  8 }, // idle
  { team: "Operations",  employee: "Vijay Kumar",      instance_type: "m5.large",   monthly_cost: 69,  cpu_usage: 29, ram_usage: 42 },
  { team: "Operations",  employee: "Emily Davis",      instance_type: "r5.large",   monthly_cost: 91,  cpu_usage: 48, ram_usage: 75 },

  // Data Science Team
  { team: "Data Science",employee: "Dr. Arun Iyer",   instance_type: "p3.2xlarge", monthly_cost: 2203, cpu_usage: 88, ram_usage: 91 },
  { team: "Data Science",employee: "Meera Pillai",    instance_type: "g4dn.xlarge",monthly_cost: 379, cpu_usage: 74, ram_usage: 80 },
  { team: "Data Science",employee: "Tom Harris",      instance_type: "m5.2xlarge", monthly_cost: 277, cpu_usage: 55, ram_usage: 65 },
  { team: "Data Science",employee: "Pooja Agarwal",   instance_type: "r5.xlarge",  monthly_cost: 182, cpu_usage: 62, ram_usage: 82 },
  { team: "Data Science",employee: "Rahul Bose",      instance_type: "c5.2xlarge", monthly_cost: 245, cpu_usage:  5, ram_usage:  9 }, // idle
  { team: "Data Science",employee: "Susan Lee",       instance_type: "m5.xlarge",  monthly_cost: 138, cpu_usage: 43, ram_usage: 55 },

  // R&D Team
  { team: "R&D",         employee: "Dr. Kavita Reddy",instance_type: "m5.xlarge",  monthly_cost: 138, cpu_usage: 58, ram_usage: 52 },
  { team: "R&D",         employee: "Sameer Joshi",    instance_type: "c5.xlarge",  monthly_cost: 122, cpu_usage: 70, ram_usage: 45 },
  { team: "R&D",         employee: "Nina Kapoor",     instance_type: "t3.large",   monthly_cost: 60,  cpu_usage:  8, ram_usage: 13 }, // idle
  { team: "R&D",         employee: "Chris Thompson",  instance_type: "r5.large",   monthly_cost: 91,  cpu_usage: 38, ram_usage: 67 },
  { team: "R&D",         employee: "Deepa Menon",     instance_type: "m5.large",   monthly_cost: 69,  cpu_usage: 26, ram_usage: 33 },
  { team: "R&D",         employee: "Alex Murphy",     instance_type: "t3.medium",  monthly_cost: 30,  cpu_usage: 12, ram_usage: 18 }, // idle

  // Security Team
  { team: "Security",    employee: "Rohit Malhotra",  instance_type: "c5.xlarge",  monthly_cost: 122, cpu_usage: 52, ram_usage: 44 },
  { team: "Security",    employee: "Divya Srinivas",  instance_type: "m5.large",   monthly_cost: 69,  cpu_usage: 33, ram_usage: 51 },
  { team: "Security",    employee: "Kevin Walsh",     instance_type: "t3.large",   monthly_cost: 60,  cpu_usage:  7, ram_usage:  9 }, // idle
  { team: "Security",    employee: "Anjali Tiwari",   instance_type: "r5.large",   monthly_cost: 91,  cpu_usage: 61, ram_usage: 73 },
];

export function getUniqueTeams(data) {
  return [...new Set(data.map(d => d.team))];
}

// Ensure every employee gets an auto-generated PIN (e.g. Alice Johnson -> alice123)
export function attachPins(dataArray) {
  dataArray.forEach(d => {
    if (!d.pin) {
      const firstName = d.employee.split(' ')[0].replace('Dr.', '').trim().toLowerCase();
      d.pin = firstName + "123";
    }
  });
}
attachPins(companyData);

/**
 * Parse a CSV string into companyData format.
 * Expected columns (with or without header row):
 *   team, employee, instance_type, monthly_cost, cpu_usage, ram_usage
 */
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const parsed = [];

  // Skip header if first row contains letters in numeric columns
  const start = isNaN(parseFloat(lines[0].split(',')[3])) ? 1 : 0;

  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < 6) continue;
    parsed.push({
      team:            cols[0],
      employee:        cols[1],
      instance_type:   cols[2],
      monthly_cost:    parseFloat(cols[3]) || 0,
      cpu_usage:       parseFloat(cols[4]) || 0,
      ram_usage:       parseFloat(cols[5]) || 0,
    });
  }
  attachPins(parsed);
  return parsed;
}
