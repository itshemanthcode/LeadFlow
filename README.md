# LeadFlow

A collaborative, real-time lead management web application that empowers HSR Motors' sales team to efficiently track, manage, and convert leads while providing business managers with actionable insights through comprehensive analytics.

## Features

- **Real-time Lead Management**: Track and manage leads from multiple channels (FB, Twitter, Google, Website, Offline)
- **SLA Tracking**: Monitor response times and follow-up compliance
- **Smart Automations**: Auto-enrichment, deduplication, lead scoring, and assignment
- **Multiple Views**: Table listing, Kanban board, and detailed lead view
- **Manager Dashboard**: Analytics, KPIs, and performance metrics
- **Quick Actions**: One-click calling, WhatsApp, email templates
- **Test Drive Scheduler**: Calendar integration with reminders

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

- `/app` - Next.js app router pages and layouts
- `/components` - Reusable React components
- `/lib` - Utilities, types, and data models
- `/hooks` - Custom React hooks
- `/styles` - Global styles and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React

## Success Metrics

- Lead response time: 1h → 15m (median)
- First contact rate (24h): 55% → 85%
- Qualified lead rate: 30% → 45%
- Duplicate lead rate: 12% → <2%

