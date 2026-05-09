import { sql } from "drizzle-orm"
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

export const clerkUsers = sqliteTable("clerk_users", {
  id: text("id").primaryKey(),
  primaryEmail: text("primary_email"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
})

export const notes = sqliteTable(
  "notes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    contentMarkdown: text("content_markdown").notNull(),
    tags: text("tags").notNull().default(""),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    notesUserIdx: index("notes_user_id_idx").on(t.userId),
  })
)

export const labs = sqliteTable(
  "labs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("planned"),
    notesMarkdown: text("notes_markdown").notNull().default(""),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    labsUserIdx: index("labs_user_id_idx").on(t.userId),
  })
)

export const ctfEntries = sqliteTable(
  "ctf_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    challengeName: text("challenge_name").notNull(),
    platform: text("platform").notNull(),
    difficulty: text("difficulty").notNull(),
    status: text("status").notNull().default("planned"),
    writeupMarkdown: text("writeup_markdown").notNull().default(""),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    ctfsUserIdx: index("ctf_entries_user_id_idx").on(t.userId),
  })
)

export const certifications = sqliteTable(
  "certifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    targetExamDate: text("target_exam_date"),
    progressPercent: integer("progress_percent").notNull().default(0),
    notesMarkdown: text("notes_markdown").notNull().default(""),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    certsUserIdx: index("certifications_user_id_idx").on(t.userId),
  })
)

export const certificationChecklistItems = sqliteTable(
  "certification_checklist_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    certificationId: text("certification_id")
      .notNull()
      .references(() => certifications.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    isDone: integer("is_done", { mode: "boolean" }).notNull().default(false),
    position: integer("position").notNull().default(0),
  }
)

export const resources = sqliteTable(
  "resources",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    tags: text("tags").notNull().default(""),
    notesMarkdown: text("notes_markdown").notNull().default(""),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    resourcesUserIdx: index("resources_user_id_idx").on(t.userId),
  })
)

export const codeSnippets = sqliteTable(
  "code_snippets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    language: text("language").notNull(),
    code: text("code").notNull(),
    notesMarkdown: text("notes_markdown").notNull().default(""),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    snippetsUserIdx: index("code_snippets_user_id_idx").on(t.userId),
  })
)

export const commands = sqliteTable(
  "commands",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    commandText: text("command_text").notNull(),
    description: text("description").notNull(),
    tags: text("tags").notNull().default(""),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    commandsUserIdx: index("commands_user_id_idx").on(t.userId),
  })
)

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    attachmentsUserIdx: index("attachments_user_id_idx").on(t.userId),
  })
)

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    detailsMarkdown: text("details_markdown").notNull().default(""),
    status: text("status").notNull().default("open"),
    relatedEntityType: text("related_entity_type"),
    relatedEntityId: text("related_entity_id"),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    tasksUserIdx: index("tasks_user_id_idx").on(t.userId),
  })
)

export const assistantChats = sqliteTable(
  "assistant_chats",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    title: text("title").notNull().default("New chat"),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    assistantChatsUserIdx: index("assistant_chats_user_id_idx").on(t.userId),
  })
)

export const assistantMessages = sqliteTable("assistant_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chatId: text("chat_id")
    .notNull()
    .references(() => assistantChats.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  contentMarkdown: text("content_markdown").notNull(),
  metadataJson: text("metadata_json"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
})

export const uploadedFiles = sqliteTable(
  "uploaded_files",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    filename: text("filename").notNull(),
    storagePath: text("storage_path").notNull(),
    url: text("url").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    uploadsUserIdx: index("uploaded_files_user_id_idx").on(t.userId),
  })
)

export const allowedUsers = sqliteTable(
  "allowed_users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    allowedUsersEmailIdx: uniqueIndex("allowed_users_email_idx").on(t.email),
  })
)
