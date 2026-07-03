export const PAGINATION_DEFAULTS = {
  LIMIT: 50,
  MAX_LIMIT: 250,
};

export const FILE_LIMITS = {
  MAX_RESUME_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_RESUME_EXTENSIONS: [".pdf", ".docx", ".doc"],
};

export const ROLES = {
  ADMIN: "admin",
  RECRUITER: "recruiter",
  INTERVIEWER: "interviewer",
  CLIENT: "client",
} as const;

export const TENANT_STATUS = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  TRIAL: "trial",
} as const;
