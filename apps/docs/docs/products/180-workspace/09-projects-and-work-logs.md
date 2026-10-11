---
id: projects-and-work-logs
title: Projects, Kanban & Billable Work Logs
sidebar_label: Projects & Work Logs
sidebar_position: 9
description: High-velocity agile sprints, interactive Kanban boards, milestone roadmaps, and billable time clocking integrated on the Work Graph.
---

# Projects, Kanban & Billable Work Logs

**Projects & Tasks** provides engineering teams, digital agencies, and consultants with high-velocity project management natively linked to client contracts and billing.

```mermaid
graph TD
    Deal[CRM Deal Won] -->|Auto-Provision| Proj[Client Project Created]
    Proj --> Sprints[Agile Sprints & Kanban Columns]
    Sprints --> Logs[Engineer Billable Work Logs]
    Logs --> Timesheet[Aggregated Timesheet]
    Timesheet --> Inv[Draft Client Invoice (180 Finance)]
```

---

## 1. Core Features

- **Multi-View Project Boards**: Toggle between Kanban boards, linear task lists, sprint calendars, and Gantt milestone roadmaps with sub-5ms UI updates.
- **Integrated Billable Time Clocking**: Developers and team members log hours directly inside task modals. Time is categorized as billable or internal with custom hourly rate overrides.
- **Automated Milestone Invoicing**: When a project milestone is marked `COMPLETED`, 180 Workspace automatically generates a draft invoice in **180 Finance** with line items for all approved hours.
- **Client Review Portals**: External clients can review deliverable mockups, approve sprint checkpoints, and leave comments without occupying internal workspace seats.

---

## 2. Programmatic Task Creation

```typescript
import { WorkspaceClient } from '@180workspace/sdk';

const client = new WorkspaceClient({
  apiKey: process.env.WORKSPACE_API_KEY,
});

// Create task inside client sprint
const task = await client.projects.createTask({
  projectId: 'prj_cloud_migration',
  title: 'Implement RS256 JWKS Keyring verification on auth gateway',
  priority: 'HIGH',
  estimatedHours: 6.5,
  assigneeId: 'usr_senior_engineer',
  dueDate: '2026-10-15',
  tags: ['backend', 'security', '180-core'],
});
```
