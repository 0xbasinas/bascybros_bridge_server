import { z } from "zod"

import {
  ATTACHMENT_ENTITY_TYPES,
  CTF_DIFFICULTIES,
  CTF_STATUSES,
  LAB_STATUSES,
  TASK_STATUSES,
} from "./constants"

const trimmedString = (message: string) =>
  z.string().trim().min(1, message).max(5000)

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  contentMarkdown: z.string().trim().min(1, "Content is required").max(10000),
  tags: z.string().trim().max(200).optional().default(""),
})

export const labSchema = z.object({
  name: z.string().trim().min(1, "Lab name is required").max(200),
  status: z.enum(LAB_STATUSES),
  notesMarkdown: z.string().trim().max(10000).optional().default(""),
})

export const ctfSchema = z.object({
  challengeName: z.string().trim().min(1, "Challenge name is required").max(200),
  platform: z.string().trim().min(1, "Platform is required").max(120),
  difficulty: z.enum(CTF_DIFFICULTIES),
  status: z.enum(CTF_STATUSES),
  writeupMarkdown: z.string().trim().max(12000).optional().default(""),
})

export const certificationSchema = z.object({
  name: z.string().trim().min(1, "Certification name is required").max(200),
  targetExamDate: z.string().optional().nullable(),
  progressPercent: z.coerce.number().min(0).max(100),
  notesMarkdown: z.string().trim().max(10000).optional().default(""),
})

export const checklistItemSchema = z.object({
  certificationId: z.string().trim().min(1),
  label: trimmedString("Checklist label is required"),
})

export const resourceSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  url: z.string().trim().url("Enter a valid URL"),
  tags: z.string().trim().max(200).optional().default(""),
  notesMarkdown: z.string().trim().max(10000).optional().default(""),
})

export const snippetSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  language: z.string().trim().min(1, "Language is required").max(80),
  code: z.string().trim().min(1, "Code is required").max(20000),
  notesMarkdown: z.string().trim().max(10000).optional().default(""),
})

export const commandSchema = z.object({
  commandText: z.string().trim().min(1, "Command is required").max(2000),
  description: z.string().trim().min(1, "Description is required").max(3000),
  tags: z.string().trim().max(200).optional().default(""),
})

export const attachmentSchema = z.object({
  entityType: z.enum(ATTACHMENT_ENTITY_TYPES),
  entityId: z.string().trim().min(1, "Entity id is required"),
  title: z.string().trim().min(1, "Title is required").max(200),
  url: z.string().trim().url("Enter a valid URL"),
})

export const uploadedFileSchema = z.object({
  storagePath: z.string().trim().min(1),
  url: z.string().trim().url(),
  filename: z.string().trim().min(1).max(300),
  mimeType: z.string().trim().min(1),
  size: z.number().min(1),
  entityType: z.string().trim().max(40).optional(),
  entityId: z.string().trim().max(120).optional(),
})

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200),
  detailsMarkdown: z.string().trim().max(10000).optional().default(""),
  status: z.enum(TASK_STATUSES).optional().default("open"),
  relatedEntityType: z.string().trim().max(40).optional().nullable(),
  relatedEntityId: z.string().trim().max(120).optional().nullable(),
})
