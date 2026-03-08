-- Performance optimization indexes for job-manager
-- Run this in Supabase SQL Editor to improve query performance

-- =====================================================
-- LEAVE TABLE INDEXES
-- =====================================================
-- Used for filtering leaves by user and ordering
CREATE INDEX IF NOT EXISTS "Leave_userId_idx" ON "Leave"("userId");
CREATE INDEX IF NOT EXISTS "Leave_createdAt_idx" ON "Leave"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Leave_status_idx" ON "Leave"("status");
-- Composite index for common query pattern (user's leaves ordered by date)
CREATE INDEX IF NOT EXISTS "Leave_userId_createdAt_idx" ON "Leave"("userId", "createdAt" DESC);
-- Date range queries for reports
CREATE INDEX IF NOT EXISTS "Leave_startDate_idx" ON "Leave"("startDate");
CREATE INDEX IF NOT EXISTS "Leave_endDate_idx" ON "Leave"("endDate");

-- =====================================================
-- ABSENT TABLE INDEXES
-- =====================================================
-- Used for filtering absents by user and date
CREATE INDEX IF NOT EXISTS "Absent_userId_idx" ON "Absent"("userId");
CREATE INDEX IF NOT EXISTS "Absent_date_idx" ON "Absent"("date");
-- Composite index for common query pattern (user's absents by date range)
CREATE INDEX IF NOT EXISTS "Absent_userId_date_idx" ON "Absent"("userId", "date" DESC);
CREATE INDEX IF NOT EXISTS "Absent_isExcused_idx" ON "Absent"("isExcused");

-- =====================================================
-- PROJECT TABLE INDEXES
-- =====================================================
-- Used for filtering projects by user
CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "Project"("userId");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");
CREATE INDEX IF NOT EXISTS "Project_createdAt_idx" ON "Project"("createdAt" DESC);
-- Composite index for common query (user's active projects)
CREATE INDEX IF NOT EXISTS "Project_userId_status_idx" ON "Project"("userId", "status");

-- =====================================================
-- SECTION TABLE INDEXES
-- =====================================================
-- Used for joining sections to projects
CREATE INDEX IF NOT EXISTS "Section_projectId_idx" ON "Section"("projectId");
-- Ordering index
CREATE INDEX IF NOT EXISTS "Section_order_idx" ON "Section"("order");
-- Composite for project sections with order
CREATE INDEX IF NOT EXISTS "Section_projectId_order_idx" ON "Section"("projectId", "order");

-- =====================================================
-- TASK TABLE INDEXES
-- =====================================================
-- Foreign key indexes
CREATE INDEX IF NOT EXISTS "Task_sectionId_idx" ON "Task"("sectionId");
CREATE INDEX IF NOT EXISTS "Task_assignedTo_idx" ON "Task"("assignedTo");
CREATE INDEX IF NOT EXISTS "Task_createdBy_idx" ON "Task"("createdBy");
-- Status and filtering indexes
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");
CREATE INDEX IF NOT EXISTS "Task_priority_idx" ON "Task"("priority");
CREATE INDEX IF NOT EXISTS "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX IF NOT EXISTS "Task_createdAt_idx" ON "Task"("createdAt" DESC);
-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS "Task_sectionId_status_idx" ON "Task"("sectionId", "status");
CREATE INDEX IF NOT EXISTS "Task_assignedTo_status_idx" ON "Task"("assignedTo", "status");

-- =====================================================
-- ACCOUNT TABLE INDEXES (NextAuth)
-- =====================================================
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");

-- =====================================================
-- SESSION TABLE INDEXES (NextAuth)
-- =====================================================
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_expires_idx" ON "Session"("expires");

-- =====================================================
-- LEAVEBALANCE TABLE INDEXES
-- =====================================================
-- Composite index for the common userId + year lookup
CREATE INDEX IF NOT EXISTS "LeaveBalance_userId_year_idx" ON "LeaveBalance"("userId", "year");

-- =====================================================
-- FULL TEXT SEARCH INDEXES (for search functionality)
-- =====================================================
-- GIN indexes for text search (much faster than LIKE)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Project name/description search
CREATE INDEX IF NOT EXISTS "Project_name_trgm_idx" ON "Project" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Project_description_trgm_idx" ON "Project" USING GIN ("description" gin_trgm_ops);

-- Task title/description search
CREATE INDEX IF NOT EXISTS "Task_title_trgm_idx" ON "Task" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Task_description_trgm_idx" ON "Task" USING GIN ("description" gin_trgm_ops);

-- Leave reason search
CREATE INDEX IF NOT EXISTS "Leave_reason_trgm_idx" ON "Leave" USING GIN ("reason" gin_trgm_ops);

-- =====================================================
-- ANALYZE TABLES (Update statistics for query planner)
-- =====================================================
ANALYZE "User";
ANALYZE "Account";
ANALYZE "Session";
ANALYZE "Leave";
ANALYZE "LeaveBalance";
ANALYZE "Absent";
ANALYZE "Project";
ANALYZE "Section";
ANALYZE "Task";
ANALYZE "Attachment";
