import pandas as pd
import random

teams = ["Development", "Operations", "Data Science", "R&D"]
employees_per_team = 4

data = []

for team in teams:
    for i in range(1, employees_per_team + 1):
        # Generate variable metrics
        cpu_base = random.randint(15, 85)
        ram_base = random.randint(4, 16)
        
        # Add some "idle" employees for optimization realism
        if random.random() < 0.2:
            cpu_base = random.randint(2, 10)
            
        data.append({
            "team": team,
            "employee": f"{team}_Lead_{i}" if i == 1 else f"{team}_Dev_{i}",
            "cpu_usage": cpu_base,
            "ram_usage": ram_base,
            "active": True
        })

df = pd.DataFrame(data)
df.to_csv("company_usage.csv", index=False)
print(f"Generated data for {len(teams)} teams and {len(data)} employees.")