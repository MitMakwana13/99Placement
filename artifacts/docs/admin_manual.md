# TalentLab RMS - Administrator Manual

## Overview
As a Tenant Admin, you have full control over the workspace, users, billing, and system configurations. This document outlines your primary responsibilities.

## 1. Workspace Configuration
Navigate to **Settings > Workspace** to customize your instance:
- **Branding**: Set your primary colors and upload a logo. These appear on the Client Portal and Candidate Assessment Portal.
- **Localization**: Configure your time zone and currency to ensure reports match your operational locale.

## 2. Managing Users & Roles
- **Inviting Members**: Go to **Settings > Team**. Click "Invite Member" to send an email invitation via Resend. You can assign them roles like Recruiter or Manager.
- **Role-Based Access Control (RBAC)**: Roles determine what modules a user can access. For example, standard recruiters cannot view billing or modify workspace branding.

## 3. Integrations & AI
- **LLM Configuration**: Under **Settings > AI Copilot**, you can provide your own API key for OpenAI, Gemini, or Anthropic. This powers the resume parsing and candidate matching engines.
- **Email Delivery**: Ensure your sender domain is authenticated if you wish to use a custom `FROM` address.

## 4. Billing & Usage
Monitor your AI credits and active seats under the **Billing** tab. The system will prevent you from exceeding your tier's limits (e.g., maximum active job postings or recruiter seats).
