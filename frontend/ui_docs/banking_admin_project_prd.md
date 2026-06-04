# Project Requirements Document: Banking Admin System

## 1. Project Overview
A specialized administrative interface for bank personnel to manage customer applications (murojaatlar) and track restricted/flagged payment cards (drop kartalar). The system emphasizes security, data integrity, and operational efficiency through a clean, professional financial dashboard interface.

## 2. Target Audience
- **Super Administrators:** Full access to system settings and user management.
- **Bank Administrators/Operators:** Daily management of applications and card registries.

## 3. Core Modules & Functionality

### A. Authentication
- **Secure Login:** Centralized authentication portal for bank staff.
- **Access Control:** User roles (Admin vs. Regular User) managed via a dedicated Admin Panel.

### B. Application Management (Murojaatlar)
- **Registry:** Comprehensive table view of all customer applications with status indicators (Mobile, Web, ATM).
- **Creation:** Specialized modal window for entering new applications directly from the registry page.
- **Filtering:** Date range, direction (Yo'nalish), and system (Tizim) filters.
- **Reporting:** Export capability to Excel for offline analysis.

### C. Drop Card Registry
- **Card Monitoring:** Database of blocked or suspicious bank cards.
- **Management:** Add new blocked cards via a dedicated modal with fields for card number, balance, blocking reason, and user details.
- **Quick Filters:** Fast sorting by card type (Humo, UzCard, Visa).

### D. Analytics Dashboard
- **Key Metrics:** High-level overview of total applications, financial losses, and blocked card counts.
- **Activity Tracking:** Monthly analysis charts for application trends.
- **Staff Performance:** "Xodimlar statistikasi" section tracking individual operator productivity with monthly/annual filters.

## 4. User Interface & Design System
- **Brand Identity:** "Pro-Admin Financial System" – a professional, high-contrast light theme using Corporate Blue (#003366) and slate surfaces.
- **Typography:** Inter (Sans-serif) for high readability in data-dense tables.
- **Layout Navigation:** 
  - Persistent Side Navigation for quick module switching.
  - Minimalist Top Header focusing on page identity and user profile.
- **Consistency:** Uniform modal structures and button styling across all modules.

## 5. Technical Specifications (Based on Database Structure)
- **User Table:** ID, Username, Password Hash, Admin Status, Created At.
- **Navigation:** Integrated sidebar with active state highlighting.
- **Responsiveness:** Optimized for Desktop administrative workflows.

## 6. Project Status & Roadmap
- [x] Login & Authentication Flow
- [x] Dashboard & Statistics
- [x] Application Registry & Modal
- [x] Drop Card Registry & Modal
- [x] User Management (Admin Panel)
- [ ] Notifications/Audit Logs (Pending)
- [ ] Detailed Report Generation (Pending)
