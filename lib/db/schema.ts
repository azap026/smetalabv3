import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  index,
  customType,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════

export const platformRoleEnum = pgEnum('platform_role', ['superadmin', 'support']);
export const tenantRoleEnum = pgEnum('tenant_role', ['admin', 'estimator', 'manager']);
export const permissionScopeEnum = pgEnum('permission_scope', ['platform', 'tenant']);
export const accessLevelEnum = pgEnum('access_level', ['view', 'comment', 'download']);
export const rbacLevelEnum = pgEnum('rbac_level', ['none', 'read', 'manage']);
export const workStatusEnum = pgEnum('work_status', ['active', 'draft', 'archived', 'deleted']);

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'), // legacy
  platformRole: platformRoleEnum('platform_role'),
  isAdmin: boolean('is_admin').notNull().default(false), // legacy - will be removed
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ═══════════════════════════════════════════════════════════════
// TEAMS (Tenants)
// ═══════════════════════════════════════════════════════════════

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

// ═══════════════════════════════════════════════════════════════
// TEAM MEMBERS
// ═══════════════════════════════════════════════════════════════

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: tenantRoleEnum('role').notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  leftAt: timestamp('left_at'),
}, (table) => [
  uniqueIndex('team_members_active_unique').on(table.teamId, table.userId),
]);

// ═══════════════════════════════════════════════════════════════
// PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  scope: permissionScopeEnum('scope').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════════
// ROLE PERMISSIONS (Tenant roles only)
// ═══════════════════════════════════════════════════════════════

export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  role: tenantRoleEnum('role').notNull(),
  permissionId: integer('permission_id')
    .notNull()
    .references(() => permissions.id),
  accessLevel: rbacLevelEnum('access_level').notNull().default('read'),
}, (table) => [
  uniqueIndex('role_permissions_unique').on(table.role, table.permissionId),
]);

// ═══════════════════════════════════════════════════════════════
// PLATFORM ROLE PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export const platformRolePermissions = pgTable('platform_role_permissions', {
  id: serial('id').primaryKey(),
  platformRole: platformRoleEnum('platform_role').notNull(),
  permissionId: integer('permission_id')
    .notNull()
    .references(() => permissions.id),
  accessLevel: rbacLevelEnum('access_level').notNull().default('manage'),
}, (table) => [
  uniqueIndex('platform_role_permissions_unique').on(table.platformRole, table.permissionId),
]);

// ═══════════════════════════════════════════════════════════════
// ESTIMATE SHARES (Share links for customers)
// ═══════════════════════════════════════════════════════════════

export const estimateShares = pgTable('estimate_shares', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  estimateId: integer('estimate_id').notNull(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  accessLevel: accessLevelEnum('access_level').notNull().default('view'),
  expiresAt: timestamp('expires_at'),
  revokedAt: timestamp('revoked_at'),
  lastAccessedAt: timestamp('last_accessed_at'),
  createdByUserId: integer('created_by_user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('estimate_shares_team_estimate_idx').on(table.teamId, table.estimateId),
  index('estimate_shares_expires_idx').on(table.expiresAt),
]);

// ═══════════════════════════════════════════════════════════════
// IMPERSONATION SESSIONS (Audit for superadmin)
// ═══════════════════════════════════════════════════════════════

export const impersonationSessions = pgTable('impersonation_sessions', {
  id: serial('id').primaryKey(),
  superadminUserId: integer('superadmin_user_id')
    .notNull()
    .references(() => users.id),
  targetTeamId: integer('target_team_id')
    .notNull()
    .references(() => teams.id),
  sessionToken: varchar('session_token', { length: 64 }).notNull().unique(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  ipAddress: varchar('ip_address', { length: 45 }),
});

// ═══════════════════════════════════════════════════════════════
// ACTIVITY LOGS
// ═══════════════════════════════════════════════════════════════

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

// ═══════════════════════════════════════════════════════════════
// INVITATIONS
// ═══════════════════════════════════════════════════════════════

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: tenantRoleEnum('role').notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .references(() => teams.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════════
// CUSTOM TYPES
// ═══════════════════════════════════════════════════════════════

export const vector = customType<{
  data: number[];
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions})`;
  },
  toDriver(value: number[]) {
    return JSON.stringify(value);
  },
  fromDriver(value: unknown) {
    return JSON.parse(value as string);
  },
});

// ═══════════════════════════════════════════════════════════════
// WORKS (Guide)
// ═══════════════════════════════════════════════════════════════

export const works = pgTable('works', {
  id: text('id').default(sql`gen_random_uuid()`).primaryKey(),
  tenantId: integer('tenant_id').references(() => teams.id),

  code: varchar('code', { length: 64 }).notNull(),
  name: text('name').notNull(),
  unit: varchar('unit', { length: 20 }),
  price: integer('price'),
  shortDescription: text('short_description'),
  description: text('description'),

  phase: text('phase'),
  category: text('category'),
  subcategory: text('subcategory'),
  tags: text('tags').array(), // pgCore text array

  status: workStatusEnum('status').notNull().default('draft'),
  metadata: jsonb('metadata').default({}),

  embedding: vector('embedding', { dimensions: 1536 }), // OpenAI text-embedding-3-small uses 1536 dimensions
  // search_vector: customType<{ data: string }>({ dataType() { return 'tsvector'; } })('search_vector'),

  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('works_tenant_status_idx').on(table.tenantId).where(sql`deleted_at IS NULL AND status = 'active'`),
  uniqueIndex('idx_works_code_tenant_unique').on(table.tenantId, table.code),
]);

// ═══════════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════════

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  estimateShares: many(estimateShares),
  impersonationSessions: many(impersonationSessions),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  estimateSharesCreated: many(estimateShares),
  impersonationSessions: many(impersonationSessions),
  notifications: many(notifications),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  platformRolePermissions: many(platformRolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const platformRolePermissionsRelations = relations(platformRolePermissions, ({ one }) => ({
  permission: one(permissions, {
    fields: [platformRolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const estimateSharesRelations = relations(estimateShares, ({ one }) => ({
  team: one(teams, {
    fields: [estimateShares.teamId],
    references: [teams.id],
  }),
  createdBy: one(users, {
    fields: [estimateShares.createdByUserId],
    references: [users.id],
  }),
}));

export const impersonationSessionsRelations = relations(impersonationSessions, ({ one }) => ({
  superadmin: one(users, {
    fields: [impersonationSessions.superadminUserId],
    references: [users.id],
  }),
  targetTeam: one(teams, {
    fields: [impersonationSessions.targetTeamId],
    references: [teams.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [notifications.teamId],
    references: [teams.id],
  }),
}));

export const worksRelations = relations(works, ({ one }) => ({
  tenant: one(teams, {
    fields: [works.tenantId],
    references: [teams.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type PlatformRolePermission = typeof platformRolePermissions.$inferSelect;
export type EstimateShare = typeof estimateShares.$inferSelect;
export type ImpersonationSession = typeof impersonationSessions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Work = typeof works.$inferSelect;
export type NewWork = typeof works.$inferInsert;

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  IMPERSONATION_START = 'IMPERSONATION_START',
  IMPERSONATION_END = 'IMPERSONATION_END',
}

// Role types for TypeScript
export type PlatformRole = 'superadmin' | 'support';
export type TenantRole = 'admin' | 'estimator' | 'manager';
export type PermissionScope = 'platform' | 'tenant';
export type AccessLevel = 'view' | 'comment' | 'download';
