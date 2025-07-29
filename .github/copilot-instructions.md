# Copilot Instructions for Digital Permission Slip System

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js TypeScript project for a role-based digital permission slip system with the following specifications:

## Project Overview
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Authentication**: NextAuth.js with Google OAuth provider
- **Database**: Firebase Firestore
- **State Management**: Zustand
- **Styling**: Tailwind CSS + DaisyUI
- **Utilities**: Lodash for data manipulation

## Key Features
- Role-based access control (student, teacher, admin)
- Google OAuth authentication
- Permission slip submission and approval workflow
- User management (admin only)
- Real-time data synchronization

## Code Style Guidelines
- Use TypeScript strict mode with explicit types
- Follow Next.js App Router conventions
- Use server components where possible, client components only when necessary
- Implement proper error handling and loading states
- Use Zustand for client-side state management
- Follow Firebase best practices for Firestore operations

## File Structure
- `/src/app`: Next.js App Router pages and API routes
- `/src/components`: Reusable UI components
- `/src/lib`: External service configurations (Firebase, NextAuth)
- `/src/store`: Zustand stores
- `/src/types`: TypeScript type definitions
- `/src/utils`: Utility functions

## Database Schema
- `users` collection: email (doc ID), name, image, role
- `permissionSlips` collection: student info, reason, status, timestamps, teacher info
