export type StatCard = {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  status: "success" | "pending" | "warning";
};

export type DeploymentRow = {
  id: string;
  environment: string;
  branch: string;
  status: "live" | "building" | "failed";
  updated: string;
};

export const stats: StatCard[] = [
  {
    label: "Active users",
    value: "12,480",
    change: "+8.2%",
    trend: "up",
  },
  {
    label: "Deployments",
    value: "326",
    change: "+14 this week",
    trend: "up",
  },
  {
    label: "Avg. response",
    value: "142ms",
    change: "-12ms",
    trend: "up",
  },
  {
    label: "Error rate",
    value: "0.04%",
    change: "+0.01%",
    trend: "down",
  },
];

export const weeklyTraffic = [
  { day: "Mon", value: 62 },
  { day: "Tue", value: 74 },
  { day: "Wed", value: 58 },
  { day: "Thu", value: 81 },
  { day: "Fri", value: 92 },
  { day: "Sat", value: 48 },
  { day: "Sun", value: 55 },
];

export const activity: ActivityItem[] = [
  {
    id: "1",
    title: "Production deploy",
    detail: "cursor/vercel-deploy-demo-8309 promoted to live",
    time: "2m ago",
    status: "success",
  },
  {
    id: "2",
    title: "Build completed",
    detail: "Next.js 16.3.0 build finished in 23s",
    time: "18m ago",
    status: "success",
  },
  {
    id: "3",
    title: "Edge cache warmed",
    detail: "Static routes pre-rendered for / and /_not-found",
    time: "42m ago",
    status: "pending",
  },
  {
    id: "4",
    title: "Health check",
    detail: "All regions responding within SLA",
    time: "1h ago",
    status: "success",
  },
];

export const deployments: DeploymentRow[] = [
  {
    id: "dpl_4Yr6",
    environment: "Production",
    branch: "cursor/vercel-deploy-demo-8309",
    status: "live",
    updated: "Today, 5:55 PM",
  },
  {
    id: "dpl_8Km2",
    environment: "Preview",
    branch: "main",
    status: "building",
    updated: "Today, 4:12 PM",
  },
  {
    id: "dpl_1Qn9",
    environment: "Preview",
    branch: "feature/analytics",
    status: "failed",
    updated: "Yesterday",
  },
];

export const navItems = [
  { label: "Overview", href: "#overview", active: true },
  { label: "Integrations", href: "#integrations", active: false },
  { label: "Deployments", href: "#deployments", active: false },
  { label: "Analytics", href: "#analytics", active: false },
  { label: "Settings", href: "#settings", active: false },
];
