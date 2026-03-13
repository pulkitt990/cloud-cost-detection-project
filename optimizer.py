import math

INSTANCE_COST = 5000  # Monthly cost per instance

def analyze_resources(df):
    if df.empty:
        return {
            "required_instances": 1,
            "optimized_cost": INSTANCE_COST,
            "efficiency_score": 0,
            "avg_cpu": 0,
            "team_costs": {}
        }

    avg_cpu = df["cpu_usage"].mean()
    total_cpu = df["cpu_usage"].sum()
    
    # Heuristic: Each instance handles ~100 CPU units safely
    required_instances = max(2, math.ceil(total_cpu / 100))
    
    # Calculate costs
    optimized_cost = required_instances * INSTANCE_COST
    
    # Per-team cost distribution based on relative usage
    team_usage = df.groupby("team")["cpu_usage"].sum()
    total_usage = team_usage.sum()
    team_costs = (team_usage / total_usage * optimized_cost).to_dict() if total_usage > 0 else {}

    return {
        "required_instances": required_instances,
        "optimized_cost": int(optimized_cost),
        "avg_cpu": round(avg_cpu, 1),
        "team_costs": team_costs
    }