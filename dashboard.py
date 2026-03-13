import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import os
import math
from optimizer import analyze_resources, INSTANCE_COST

# ------------------------------------------------
# PAGE CONFIG
# ------------------------------------------------
st.set_page_config(
    page_title="Cloud Cost Control Platform",
    page_icon="☁️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ------------------------------------------------
# THEME SYSTEM
# ------------------------------------------------
if "theme" not in st.session_state:
    st.session_state.theme = "dark"

is_dark = st.session_state.theme == "dark"

# Theme palettes
DARK = {
    "bg_primary": "#0a0e1a",
    "bg_secondary": "#121829",
    "bg_card": "rgba(18, 24, 56, 0.65)",
    "bg_card_solid": "#151c35",
    "border": "rgba(99, 130, 255, 0.15)",
    "border_hover": "rgba(99, 200, 255, 0.4)",
    "text_primary": "#e8ecf4",
    "text_secondary": "#8892a8",
    "accent_1": "#6c5ce7",
    "accent_2": "#00cec9",
    "accent_3": "#0984e3",
    "gradient_start": "#6c5ce7",
    "gradient_end": "#00cec9",
    "danger": "#ff6b6b",
    "success": "#00b894",
    "warning": "#fdcb6e",
    "chart_bg": "rgba(0,0,0,0)",
    "chart_font": "#e8ecf4",
    "chart_grid": "rgba(255,255,255,0.06)",
    "gauge_bar": "#00cec9",
    "gauge_low": "#ff6b6b",
    "gauge_mid": "#fdcb6e",
    "gauge_high": "#00b894",
    "heatmap_scale": "Viridis",
    "bar_scale": "Purp",
    "current_line": "#ff6b6b",
    "optimized_line": "#00cec9",
}

LIGHT = {
    "bg_primary": "#f0f2f8",
    "bg_secondary": "#ffffff",
    "bg_card": "rgba(255, 255, 255, 0.75)",
    "bg_card_solid": "#ffffff",
    "border": "rgba(108, 92, 231, 0.12)",
    "border_hover": "rgba(108, 92, 231, 0.35)",
    "text_primary": "#1a1a2e",
    "text_secondary": "#6b7280",
    "accent_1": "#6c5ce7",
    "accent_2": "#0984e3",
    "accent_3": "#00b894",
    "gradient_start": "#6c5ce7",
    "gradient_end": "#0984e3",
    "danger": "#e55039",
    "success": "#00b894",
    "warning": "#f39c12",
    "chart_bg": "rgba(0,0,0,0)",
    "chart_font": "#1a1a2e",
    "chart_grid": "rgba(0,0,0,0.06)",
    "gauge_bar": "#6c5ce7",
    "gauge_low": "#e55039",
    "gauge_mid": "#f39c12",
    "gauge_high": "#00b894",
    "heatmap_scale": "Blues",
    "bar_scale": "Purp",
    "current_line": "#e55039",
    "optimized_line": "#00b894",
}

T = DARK if is_dark else LIGHT

# ------------------------------------------------
# PREMIUM CSS INJECTION
# ------------------------------------------------
st.markdown(f"""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

    /* ===== ROOT VARIABLES ===== */
    :root {{
        --bg-primary: {T["bg_primary"]};
        --bg-secondary: {T["bg_secondary"]};
        --bg-card: {T["bg_card"]};
        --border: {T["border"]};
        --border-hover: {T["border_hover"]};
        --text-primary: {T["text_primary"]};
        --text-secondary: {T["text_secondary"]};
        --accent-1: {T["accent_1"]};
        --accent-2: {T["accent_2"]};
        --gradient-start: {T["gradient_start"]};
        --gradient-end: {T["gradient_end"]};
    }}

    /* ===== GLOBAL ===== */
    html, body, [class*="css"] {{
        font-family: 'Inter', sans-serif !important;
        color: var(--text-primary);
    }}

    .main .block-container {{
        padding-top: 1.5rem;
        padding-bottom: 2rem;
        max-width: 1400px;
    }}

    /* Main Area Background */
    .stApp, .main {{
        background: var(--bg-primary) !important;
    }}

    header[data-testid="stHeader"] {{
        background: transparent !important;
    }}

    /* ===== SCROLLBAR ===== */
    ::-webkit-scrollbar {{ width: 6px; }}
    ::-webkit-scrollbar-track {{ background: transparent; }}
    ::-webkit-scrollbar-thumb {{
        background: var(--accent-1);
        border-radius: 8px;
    }}

    /* ===== SIDEBAR ===== */
    section[data-testid="stSidebar"] {{
        background: {T["bg_secondary"]} !important;
        border-right: 1px solid var(--border);
    }}

    section[data-testid="stSidebar"] .stSlider > div > div > div {{
        color: var(--text-primary) !important;
    }}

    /* ===== GLASSMORPHISM METRIC CARDS ===== */
    div[data-testid="stMetric"] {{
        background: var(--bg-card);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        padding: 22px 24px;
        border-radius: 16px;
        border: 1px solid var(--border);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }}

    div[data-testid="stMetric"]:hover {{
        border-color: var(--border-hover);
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(108, 92, 231, 0.15);
    }}

    div[data-testid="stMetric"] label {{
        color: var(--text-secondary) !important;
        font-weight: 500;
        text-transform: uppercase;
        font-size: 0.72rem;
        letter-spacing: 1.2px;
    }}

    div[data-testid="stMetric"] [data-testid="stMetricValue"] {{
        color: var(--text-primary) !important;
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 700;
        font-size: 1.85rem !important;
    }}

    div[data-testid="stMetric"] [data-testid="stMetricDelta"] {{
        font-weight: 600;
    }}

    /* ===== BUTTONS ===== */
    .stButton > button {{
        width: 100%;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end)) !important;
        color: #ffffff !important;
        font-weight: 600;
        font-size: 0.88rem;
        border: none !important;
        padding: 12px 24px;
        letter-spacing: 0.4px;
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        box-shadow: 0 4px 15px rgba(108, 92, 231, 0.25);
    }}

    .stButton > button:hover {{
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 30px rgba(108, 92, 231, 0.4) !important;
        filter: brightness(1.1);
    }}

    .stButton > button:active {{
        transform: translateY(0px) !important;
    }}

    /* ===== TABS ===== */
    .stTabs [data-baseweb="tab-list"] {{
        gap: 0;
        background: var(--bg-card);
        border-radius: 12px;
        padding: 4px;
        border: 1px solid var(--border);
    }}

    .stTabs [data-baseweb="tab"] {{
        border-radius: 10px;
        padding: 10px 24px;
        color: var(--text-secondary);
        font-weight: 500;
        transition: all 0.3s ease;
    }}

    .stTabs [data-baseweb="tab"]:hover {{
        color: var(--text-primary);
    }}

    .stTabs [aria-selected="true"] {{
        background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end)) !important;
        color: #ffffff !important;
        font-weight: 600;
    }}

    .stTabs [data-baseweb="tab-highlight"] {{
        display: none;
    }}

    .stTabs [data-baseweb="tab-border"] {{
        display: none;
    }}

    /* ===== EXPANDER ===== */
    .streamlit-expanderHeader {{
        background: var(--bg-card) !important;
        border-radius: 12px !important;
        border: 1px solid var(--border) !important;
        color: var(--text-primary) !important;
        font-weight: 500;
        transition: all 0.3s ease;
    }}

    .streamlit-expanderHeader:hover {{
        border-color: var(--border-hover) !important;
    }}

    details {{
        border: 1px solid var(--border) !important;
        border-radius: 12px !important;
        background: var(--bg-card) !important;
    }}

    /* ===== DIVIDER ===== */
    hr {{
        border-color: var(--border) !important;
    }}

    /* ===== CUSTOM CLASSES ===== */
    .luxury-header {{
        background: linear-gradient(135deg, {T["gradient_start"]} 0%, {T["accent_2"]} 50%, {T["gradient_end"]} 100%);
        background-size: 200% 200%;
        animation: gradient-shift 6s ease infinite;
        padding: 48px 44px;
        border-radius: 20px;
        margin-bottom: 32px;
        position: relative;
        overflow: hidden;
    }}

    .luxury-header::before {{
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%);
        animation: shimmer 4s linear infinite;
    }}

    @keyframes gradient-shift {{
        0% {{ background-position: 0% 50%; }}
        50% {{ background-position: 100% 50%; }}
        100% {{ background-position: 0% 50%; }}
    }}

    @keyframes shimmer {{
        0% {{ transform: rotate(0deg); }}
        100% {{ transform: rotate(360deg); }}
    }}

    .luxury-header h1 {{
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 800;
        font-size: 2.4rem;
        margin: 0;
        color: #ffffff;
        position: relative;
        z-index: 1;
        text-shadow: 0 2px 20px rgba(0,0,0,0.15);
    }}

    .luxury-header p {{
        margin: 8px 0 0 0;
        opacity: 0.85;
        font-size: 1.05rem;
        color: rgba(255,255,255,0.92);
        position: relative;
        z-index: 1;
        font-weight: 400;
        letter-spacing: 0.3px;
    }}

    .status-dot {{
        display: inline-block;
        width: 10px;
        height: 10px;
        background: #00ff88;
        border-radius: 50%;
        margin-right: 8px;
        animation: pulse-glow 2s ease-in-out infinite;
        position: relative;
        z-index: 1;
    }}

    @keyframes pulse-glow {{
        0%, 100% {{ box-shadow: 0 0 4px #00ff88, 0 0 12px rgba(0,255,136,0.4); }}
        50% {{ box-shadow: 0 0 8px #00ff88, 0 0 24px rgba(0,255,136,0.6); }}
    }}

    .glass-card {{
        background: {T["bg_card"]};
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        padding: 28px;
        border-radius: 18px;
        border: 1px solid {T["border"]};
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.12);
        margin-bottom: 20px;
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }}

    .glass-card:hover {{
        border-color: {T["border_hover"]};
        box-shadow: 0 8px 40px rgba(108, 92, 231, 0.12);
    }}

    .glass-card h3 {{
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 700;
        color: {T["text_primary"]};
        margin-bottom: 16px;
        font-size: 1.15rem;
    }}

    .section-title {{
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 700;
        color: {T["text_primary"]};
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
        font-size: 1.1rem;
    }}

    .team-card {{
        background: {T["bg_card"]};
        backdrop-filter: blur(12px);
        padding: 18px;
        border-radius: 14px;
        border: 1px solid {T["border"]};
        text-align: center;
        transition: all 0.3s ease;
    }}

    .team-card:hover {{
        border-color: {T["border_hover"]};
        transform: translateY(-2px);
    }}

    .active-dot {{
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 6px;
        animation: pulse-glow 2s ease-in-out infinite;
    }}

    .active-dot.green {{
        background: #00b894;
        box-shadow: 0 0 8px rgba(0,184,148,0.5);
    }}

    .active-dot.red {{
        background: #ff6b6b;
        box-shadow: 0 0 8px rgba(255,107,107,0.5);
        animation: none;
    }}

    .emp-row {{
        padding: 10px 16px;
        border-radius: 10px;
        transition: all 0.2s ease;
        margin-bottom: 4px;
    }}

    .emp-row:hover {{
        background: {T["border"]};
    }}

    .footer {{
        text-align: center;
        padding: 24px;
        margin-top: 40px;
        border-top: 1px solid {T["border"]};
        color: {T["text_secondary"]};
        font-size: 0.82rem;
        letter-spacing: 0.5px;
    }}

    .footer:hover {{
        color: {T["accent_1"]};
    }}

    /* ===== THEME TOGGLE ===== */
    .theme-toggle-container {{
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 12px;
        background: {T["bg_card"]};
        border-radius: 14px;
        border: 1px solid {T["border"]};
        margin-bottom: 16px;
    }}

    .theme-icon {{
        font-size: 1.3rem;
        transition: all 0.3s ease;
    }}

    /* ===== ANIMATIONS ===== */
    @keyframes fadeInUp {{
        from {{
            opacity: 0;
            transform: translateY(20px);
        }}
        to {{
            opacity: 1;
            transform: translateY(0);
        }}
    }}

    .stMetric, .glass-card, .luxury-header {{
        animation: fadeInUp 0.6s ease-out;
    }}

    /* Stagger animation for metric cards */
    [data-testid="stHorizontalBlock"] > div:nth-child(1) div[data-testid="stMetric"] {{
        animation-delay: 0.05s;
    }}
    [data-testid="stHorizontalBlock"] > div:nth-child(2) div[data-testid="stMetric"] {{
        animation-delay: 0.15s;
    }}
    [data-testid="stHorizontalBlock"] > div:nth-child(3) div[data-testid="stMetric"] {{
        animation-delay: 0.25s;
    }}
    [data-testid="stHorizontalBlock"] > div:nth-child(4) div[data-testid="stMetric"] {{
        animation-delay: 0.35s;
    }}

    /* Toast */
    div[data-testid="stToast"] {{
        background: {T["bg_card_solid"]} !important;
        border: 1px solid {T["border"]} !important;
        border-radius: 14px !important;
        color: {T["text_primary"]} !important;
    }}

</style>
""", unsafe_allow_html=True)

# ------------------------------------------------
# DATA INITIALIZATION
# ------------------------------------------------
if not os.path.exists("company_usage.csv"):
    os.system("python data_generator.py")

@st.cache_data(ttl=60)
def load_data():
    return pd.read_csv("company_usage.csv")

df_raw = load_data()

# Session State Initialization
if "instances" not in st.session_state:
    st.session_state.instances = 12

if "disabled_actors" not in st.session_state:
    st.session_state.disabled_actors = {"employees": [], "teams": []}

# ------------------------------------------------
# SIDEBAR - CONTROLS
# ------------------------------------------------
with st.sidebar:
    st.image("https://img.icons8.com/isometric-folders/100/cloud.png", width=80)
    st.title("Admin Console")

    # Theme Toggle
    st.markdown(f"""
    <div class="theme-toggle-container">
        <span class="theme-icon">{'🌙' if is_dark else '☀️'}</span>
        <span style="font-weight:600; color: {T['text_primary']}; font-size: 0.9rem;">
            {'Dark Mode' if is_dark else 'Light Mode'}
        </span>
    </div>
    """, unsafe_allow_html=True)

    if st.button("🌓 Toggle Theme"):
        st.session_state.theme = "light" if is_dark else "dark"
        st.rerun()

    st.divider()

    st.subheader("Infrastructure Simulation")

    st.slider(
        "Simulation: Running Instances",
        min_value=1,
        max_value=25,
        key="instances",
        help="Simulate the current number of active server instances."
    )

    st.divider()

    if st.button("🔄 Reset Environment"):
        st.session_state.disabled_actors = {"employees": [], "teams": []}
        st.session_state.instances = 12
        st.rerun()

# ------------------------------------------------
# DATA FILTERING
# ------------------------------------------------
filtered_df = df_raw.copy()
filtered_df = filtered_df[~filtered_df["team"].isin(st.session_state.disabled_actors["teams"])]
filtered_df = filtered_df[~filtered_df["employee"].isin(st.session_state.disabled_actors["employees"])]

results = analyze_resources(filtered_df)
current_cost = st.session_state.instances * INSTANCE_COST
savings = current_cost - results["optimized_cost"]
efficiency_score = (results["required_instances"] / st.session_state.instances) * 100 if st.session_state.instances > 0 else 0

# ------------------------------------------------
# PLOTLY CHART HELPER
# ------------------------------------------------
def chart_layout(fig, height=None):
    """Apply themed layout to any Plotly figure."""
    layout_args = dict(
        plot_bgcolor=T["chart_bg"],
        paper_bgcolor=T["chart_bg"],
        font=dict(color=T["chart_font"], family="Inter"),
        margin=dict(t=30, b=0, l=0, r=0),
    )
    if height:
        layout_args["height"] = height
    fig.update_layout(**layout_args)
    fig.update_xaxes(gridcolor=T["chart_grid"], zerolinecolor=T["chart_grid"])
    fig.update_yaxes(gridcolor=T["chart_grid"], zerolinecolor=T["chart_grid"])
    return fig

# ------------------------------------------------
# MAIN DASHBOARD UI
# ------------------------------------------------

# Header Section
st.markdown(f"""
<div class="luxury-header">
    <h1>☁️ Cloud Cost Control Platform</h1>
    <p><span class="status-dot"></span> Intelligent Infrastructure Monitoring & Optimization Dashboard</p>
</div>
""", unsafe_allow_html=True)

# Executive Summary Metrics
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Running Instances", st.session_state.instances)
with col2:
    st.metric("Required Instances", results["required_instances"], delta=int(results["required_instances"] - st.session_state.instances), delta_color="inverse")
with col3:
    st.metric("Current Monthly Cost", f"${current_cost:,}")
with col4:
    st.metric("Potential Savings", f"${savings:,}", delta=f"{efficiency_score:.1f}% Efficiency", delta_color="normal" if efficiency_score > 80 else "inverse")

st.markdown("<br>", unsafe_allow_html=True)

# Charts Section
col_left, col_right = st.columns([1.5, 1])

with col_left:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    st.markdown(f'<div class="section-title">📊 Team Resource Usage vs Allocation</div>', unsafe_allow_html=True)

    # Prepare data for team usage
    team_metrics = filtered_df.groupby("team").agg({
        "cpu_usage": "mean",
        "ram_usage": "mean"
    }).reset_index()

    fig_team = px.bar(
        team_metrics,
        x="team",
        y="cpu_usage",
        color="cpu_usage",
        color_continuous_scale=T["bar_scale"],
        text_auto=".1f",
        labels={"cpu_usage": "Avg CPU %", "team": "Business Unit"}
    )
    fig_team.update_traces(
        marker_line_width=0,
        textfont_size=13,
        textfont_color=T["text_primary"],
    )
    chart_layout(fig_team)
    st.plotly_chart(fig_team, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

with col_right:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    st.markdown(f'<div class="section-title">💡 Optimization Impact</div>', unsafe_allow_html=True)

    # Gauge for Efficiency
    fig_gauge = go.Figure(go.Indicator(
        mode = "gauge+number+delta",
        value = efficiency_score,
        number = {"suffix": "%", "font": {"size": 42, "family": "Plus Jakarta Sans", "color": T["text_primary"]}},
        delta = {"reference": 80, "increasing": {"color": T["success"]}, "decreasing": {"color": T["danger"]}},
        domain = {'x': [0, 1], 'y': [0, 1]},
        title = {'text': "Efficiency Score", 'font': {'color': T["text_secondary"], 'size': 14}},
        gauge = {
            'axis': {'range': [0, 100], 'tickfont': {'color': T["text_secondary"]}},
            'bar': {'color': T["gauge_bar"], 'thickness': 0.7},
            'bgcolor': "rgba(0,0,0,0)",
            'borderwidth': 0,
            'steps': [
                {'range': [0, 50], 'color': T["gauge_low"]},
                {'range': [50, 80], 'color': T["gauge_mid"]},
                {'range': [80, 100], 'color': T["gauge_high"]}
            ],
            'threshold': {
                'line': {'color': "#ffffff", 'width': 3},
                'thickness': 0.8,
                'value': efficiency_score
            }
        }
    ))
    chart_layout(fig_gauge, height=260)
    st.plotly_chart(fig_gauge, use_container_width=True)

    if st.button("✨ Auto-Optimize Infrastructure"):
        st.session_state.instances = results["required_instances"]
        st.toast(f"Successfully optimized to {results['required_instances']} instances!")
        st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)

# Resource Heatmap & Forecasting
col_a, col_b = st.columns(2)

with col_a:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    st.markdown(f'<div class="section-title">🔥 Employee Workload Heatmap</div>', unsafe_allow_html=True)
    if not filtered_df.empty:
        heatmap_data = filtered_df.pivot_table(index="employee", columns="team", values="cpu_usage")
        fig_heat = px.imshow(
            heatmap_data,
            color_continuous_scale=T["heatmap_scale"],
            labels=dict(x="Team", y="Employee", color="CPU %")
        )
        chart_layout(fig_heat)
        fig_heat.update_layout(
            xaxis=dict(tickfont=dict(color=T["text_secondary"])),
            yaxis=dict(tickfont=dict(color=T["text_secondary"])),
        )
        st.plotly_chart(fig_heat, use_container_width=True)
    else:
        st.info("No active resources to display.")
    st.markdown('</div>', unsafe_allow_html=True)

with col_b:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    st.markdown(f'<div class="section-title">📈 Cost Savings Forecast</div>', unsafe_allow_html=True)

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Projection"]
    current_trend = [current_cost * (1 + (i*0.02)) for i in range(5)] + [current_cost * 1.05]
    optimized_trend = [current_cost * (1 + (i*0.02)) for i in range(5)] + [results["optimized_cost"]]

    fig_trend = go.Figure()
    fig_trend.add_trace(go.Scatter(
        x=months, y=current_trend,
        name="Current Path",
        line=dict(color=T["current_line"], dash='dash', width=2),
        mode='lines+markers',
        marker=dict(size=6)
    ))
    fig_trend.add_trace(go.Scatter(
        x=months, y=optimized_trend,
        name="Optimized Path",
        fill='tonexty',
        fillcolor=f"rgba({int(T['optimized_line'][1:3],16)},{int(T['optimized_line'][3:5],16)},{int(T['optimized_line'][5:7],16)},0.12)",
        line=dict(color=T["optimized_line"], width=3),
        mode='lines+markers',
        marker=dict(size=7)
    ))

    chart_layout(fig_trend)
    fig_trend.update_layout(
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            font=dict(color=T["text_secondary"])
        )
    )
    st.plotly_chart(fig_trend, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

# Management Panel
st.markdown('<div class="glass-card">', unsafe_allow_html=True)
st.markdown(f'<div class="section-title">🛡️ Business Continuity & Resource Control</div>', unsafe_allow_html=True)

tab_team, tab_emp = st.tabs(["🏢  Team Controls", "👥  Employee Controls"])

with tab_team:
    unique_teams = df_raw["team"].unique()
    cols = st.columns(min(len(unique_teams), 4))
    for i, team in enumerate(unique_teams):
        with cols[i % 4]:
            is_active = team not in st.session_state.disabled_actors["teams"]
            dot_class = "green" if is_active else "red"
            status_text = "Active" if is_active else "Stopped"
            st.markdown(f"""
            <div class="team-card">
                <div style="font-weight:600; color:{T['text_primary']}; font-size:0.95rem; margin-bottom:8px;">{team}</div>
                <div style="font-size:0.82rem; color:{T['text_secondary']};">
                    <span class="active-dot {dot_class}"></span>{status_text}
                </div>
            </div>
            """, unsafe_allow_html=True)
            st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)
            if is_active:
                if st.button("⏹️ Stop Units", key=f"stop_t_{team}"):
                    st.session_state.disabled_actors["teams"].append(team)
                    st.rerun()
            else:
                if st.button("▶️ Start Units", key=f"start_t_{team}"):
                    st.session_state.disabled_actors["teams"].remove(team)
                    st.rerun()

with tab_emp:
    for team in unique_teams:
        if team in st.session_state.disabled_actors["teams"]:
            continue

        with st.expander(f"📋 {team} Staffing"):
            team_df = df_raw[df_raw["team"] == team]
            for _, row in team_df.iterrows():
                emp = row["employee"]
                is_active = emp not in st.session_state.disabled_actors["employees"]
                c1, c2, c3 = st.columns([3, 1, 1])
                c1.write(f"👤 {emp}")
                c2.write("✅ Active" if is_active else "❌ Idle")
                if is_active:
                    if c3.button("Suspend", key=f"susp_{emp}"):
                        st.session_state.disabled_actors["employees"].append(emp)
                        st.rerun()
                else:
                    if c3.button("Resume", key=f"res_{emp}"):
                        st.session_state.disabled_actors["employees"].remove(emp)
                        st.rerun()

st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown(f"""
<div class="footer">
    ✦ © 2026 Cloud-Cost-Detection Project • Powered by Antigravity Intelligence ✦
</div>
""", unsafe_allow_html=True)