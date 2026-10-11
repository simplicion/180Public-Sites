---
id: communications-and-meetings
title: Team Chat & HD Video Meetings Architecture
sidebar_label: Chat & Video Meetings
sidebar_position: 10
description: Embedded WebRTC 1080p HD video conferencing, contextual deal/project channels, and unified company messaging with zero add-on fees.
---

# Team Chat & HD Video Meetings Architecture

**Communications & Meetings** eliminates third-party subscriptions like Slack and Zoom by embedding high-definition encrypted video conferencing and team messaging directly into the workspace.

```mermaid
graph LR
    Client[Browser / Mobile Client] <--> SFU[180 WebRTC Selective Forwarding Unit (SFU)]
    SFU <--> RecEngine[Real-Time Audio Recorder]
    RecEngine --> AIExtractor[Orbit AI Action Item Extractor]
    AIExtractor --> Tasks[Auto-Generated Project Tasks]
    AIExtractor --> CRM[Client Deal Notes Synced]
```

---

## 1. Zero Add-On Video Conferencing

- **1080p60 WebRTC Audio & Video**: Low-latency mesh and SFU architecture for 1-on-1 and team video calls.
- **Screen Sharing & Annotation**: Multi-screen sharing, presentation mode, and interactive whiteboard overlays.
- **Contextual Channels**: Channels automatically bind to specific CRM deals or engineering projects, keeping client discussions organized.

---

## 2. Orbit AI Meeting Extractor

During or immediately following a client meeting:
1. The audio is transcribed via streaming speech recognition.
2. The AI summarizes decisions, timelines, and commitments.
3. Automatically generates task tickets in **Projects & Tasks** with pre-filled descriptions and assignees.
4. Generates a follow-up email draft ready to send to the client with one click.
