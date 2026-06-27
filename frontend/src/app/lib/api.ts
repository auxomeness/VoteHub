const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000/api";
const TOKEN_KEY = "votehub_access_token";

export type ApiRole = "STUDENT" | "ADMIN" | "ELECTION_MANAGER";
export type AppRole = "student" | "admin" | null;

export interface ApiUser {
  id: number;
  student_number: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  full_name: string;
  email: string;
  college_id?: number | null;
  college?: string | null;
  college_abbreviation?: string | null;
  organization_id?: number | null;
  organization?: string | null;
  program?: string | null;
  year_level?: string | null;
  role: ApiRole;
  status: "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED";
  created_at: string;
  updated_at: string;
}

export interface AppUserShape {
  name: string;
  studentNumber: string;
  email: string;
  college: string;
  program: string;
  organization: string;
  role: AppRole;
  status: "active" | "pending" | "suspended";
}

export interface ElectionSummary {
  id: number;
  title: string;
  description: string | null;
  type: string;
  status: "active" | "upcoming" | "closed" | "archived";
  openDate: string;
  closeDate: string;
  eligibility: string;
  visibility: string;
  votescast: number;
  totalVoters: number;
  has_voted?: boolean;
  is_eligible?: boolean;
}

export interface CandidateSummary {
  id: number;
  position_id?: number;
  name: string;
  college?: string | null;
  org?: string | null;
  organization?: string | null;
  platform?: string | null;
}

export interface BallotPosition {
  id: number;
  event_id?: number;
  name?: string;
  title: string;
  position_scope?: string;
  college?: string | null;
  college_id?: number | null;
  organization?: string | null;
  organization_id?: number | null;
  max_selection?: number;
  display_order?: number;
  candidates: CandidateSummary[];
}

export interface BallotResponse extends ElectionSummary {
  positions: BallotPosition[];
}

export interface ResultRow {
  candidate_id?: number | null;
  name: string;
  votes: number;
  percentage: number;
  color: string;
}

export interface ResultsResponse {
  event_id: number;
  visible: boolean;
  mode: string;
  partial_result_type?: string | null;
  summary: ElectionSummary;
  positions: Array<{ position: string; position_id: number; data: ResultRow[] }>;
}

export interface VoteReceipt {
  vote_id: number;
  event_id: number;
  receipt_code: string;
  submitted_at: string;
}

export interface CollegeRef {
  id: number;
  name: string;
  abbreviation: string;
  status: string;
}

export interface OrganizationRef {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  member_count?: number;
}

export interface DashboardAnalytics {
  total_students: number;
  active_students: number;
  total_elections: number;
  active_elections: number;
  votes_cast: number;
  participation_rate: number;
}

export interface ParticipationBucket {
  label: string;
  eligible: number;
  votes: number;
  rate: number;
}

export interface TimelineBucket {
  label: string;
  votes: number;
  cumulative: number;
}

export interface ElectionAnalytics {
  event_id: number;
  summary: DashboardAnalytics;
  by_college: ParticipationBucket[];
  by_year_level: ParticipationBucket[];
  by_organization: ParticipationBucket[];
  hourly_votes: TimelineBucket[];
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function readError(response: Response) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) return data.detail.map((item) => item.msg ?? String(item)).join(", ");
    return JSON.stringify(data.detail ?? data);
  } catch {
    return response.statusText || "Request failed";
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (auth && token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401) clearToken();
    throw new ApiError(response.status, await readError(response));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function toAppUser(user: ApiUser): AppUserShape {
  return {
    name: user.full_name,
    studentNumber: user.student_number,
    email: user.email,
    college: user.college_abbreviation ?? user.college ?? "",
    program: user.program ?? "",
    organization: user.organization ?? "",
    role: user.role === "ADMIN" || user.role === "ELECTION_MANAGER" ? "admin" : "student",
    status: user.status === "ACTIVE" ? "active" : user.status === "SUSPENDED" ? "suspended" : "pending",
  };
}

export async function login(email: string, password: string) {
  const session = await apiRequest<{ access_token: string; token_type: string; user: ApiUser }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false,
  );
  setToken(session.access_token);
  return { ...session, appUser: toAppUser(session.user) };
}

export async function registerStudent(payload: {
  full_name: string;
  student_number: string;
  email: string;
  password: string;
  college: string;
  organization?: string;
  program?: string;
  year_level?: string;
}) {
  return apiRequest<ApiUser>("/auth/register", { method: "POST", body: JSON.stringify(payload) }, false);
}

export function getMe() {
  return apiRequest<ApiUser>("/auth/me");
}

export function listElections() {
  return apiRequest<ElectionSummary[]>("/elections");
}

export function getElection(eventId: number) {
  return apiRequest<BallotResponse>(`/elections/${eventId}`);
}

export function getBallot(eventId: number) {
  return apiRequest<BallotResponse>(`/elections/${eventId}/ballot`);
}

export function submitVote(eventId: number, selections: Array<{ position_id: number; candidate_id?: number | null; is_abstain?: boolean }>) {
  return apiRequest<VoteReceipt>("/votes/submit", {
    method: "POST",
    body: JSON.stringify({ event_id: eventId, selections }),
  });
}

export function getResults(eventId: number) {
  return apiRequest<ResultsResponse>(`/results/${eventId}`);
}

export function listUsers() {
  return apiRequest<ApiUser[]>("/users");
}

export function createUser(payload: {
  full_name: string;
  student_number: string;
  email: string;
  college: string;
  organization?: string;
  role?: ApiRole;
  status?: ApiUser["status"];
}) {
  return apiRequest<ApiUser>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(userId: number, payload: Partial<{
  full_name: string;
  student_number: string;
  email: string;
  college: string;
  organization: string;
  status: ApiUser["status"];
}>) {
  return apiRequest<ApiUser>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateUserStatus(userId: number, status: ApiUser["status"]) {
  return apiRequest<ApiUser>(`/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function listColleges() {
  return apiRequest<CollegeRef[]>("/colleges", {}, false);
}

export function listOrganizations() {
  return apiRequest<OrganizationRef[]>("/organizations", {}, false);
}

export function createOrganization(payload: { name: string; description?: string; status?: string }) {
  return apiRequest<OrganizationRef>("/organizations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOrganization(organizationId: number, payload: Partial<{ name: string; description: string; status: string }>) {
  return apiRequest<OrganizationRef>(`/organizations/${organizationId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteOrganization(organizationId: number) {
  return apiRequest<void>(`/organizations/${organizationId}`, { method: "DELETE" });
}

export function createElection(payload: unknown) {
  return apiRequest<BallotResponse>("/elections", { method: "POST", body: JSON.stringify(payload) });
}

export function updateElection(eventId: number, payload: Partial<{
  title: string;
  description: string | null;
  election_type: string;
  visibility_scope: string | null;
  start_date: string;
  end_date: string;
  result_visibility: string;
  result_release_date: string | null;
  partial_result_type: string | null;
  status: string;
}>) {
  return apiRequest<BallotResponse>(`/elections/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function replaceElectionEligibility(eventId: number, payload: Array<{
  eligibility_type: string;
  college?: string;
  organization?: string;
}>) {
  return apiRequest<BallotResponse>(`/elections/${eventId}/eligibility`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createPosition(eventId: number, payload: {
  name: string;
  position_scope?: string;
  college?: string;
  organization?: string;
  max_selection?: number;
  display_order?: number;
}) {
  return apiRequest<BallotPosition>(`/elections/${eventId}/positions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePosition(eventId: number, positionId: number, payload: Partial<{
  name: string;
  position_scope: string;
  college: string;
  organization: string;
  max_selection: number;
  display_order: number;
}>) {
  return apiRequest<BallotPosition>(`/elections/${eventId}/positions/${positionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deletePosition(eventId: number, positionId: number) {
  return apiRequest<void>(`/elections/${eventId}/positions/${positionId}`, { method: "DELETE" });
}

export function createCandidate(payload: {
  position_id: number;
  name: string;
  college?: string;
  organization?: string;
  platform?: string;
  biography?: string;
}) {
  return apiRequest<CandidateSummary>("/candidates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCandidate(candidateId: number, payload: Partial<{
  name: string;
  college: string;
  organization: string;
  platform: string;
  biography: string;
  status: string;
}>) {
  return apiRequest<CandidateSummary>(`/candidates/${candidateId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCandidate(candidateId: number) {
  return apiRequest<void>(`/candidates/${candidateId}`, { method: "DELETE" });
}

export function getDashboardAnalytics() {
  return apiRequest<DashboardAnalytics>("/analytics/overview");
}

export function getElectionAnalytics(eventId: number) {
  return apiRequest<ElectionAnalytics>(`/analytics/elections/${eventId}`);
}
