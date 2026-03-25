# **App Name**: Musaa OrderFlow

## Core Features:

- User Authentication & Authorization: Secure login and user role management (seller, customer) to control access to different parts of the system, ensuring appropriate permissions for each user type.
- Seller Order Management (CRUD): Empower sellers to create, view, update, and delete customer orders, managing all essential details like items, quantities, and customer information.
- Customer Order Placement: Allow customers to browse available products, add items to a shopping cart, and submit new orders seamlessly.
- Customer Order Tracking: Provide customers with a dedicated interface to view the real-time status and history of their active and past orders.
- In-App Messaging (Customer-Seller): Enable direct, secure communication between customers and sellers for inquiries, order clarification, and support.
- Inventory Tracking & Auto-Reduction: Maintain real-time inventory levels for all products, with automatic stock quantity reduction triggered upon full order payment and completion.
- Payment Processing & Status Update: Integrate with various payment methods to facilitate transactions, automatically marking orders as 'paid' and updating their status across both seller and customer interfaces.
- Product Catalog Management: Allow sellers to add, edit, and manage product listings, including detailed descriptions, pricing, and stock keeping units (SKUs).
- Dashboard & Reporting: A centralized dashboard providing sellers with an overview of recent orders, current inventory status, and key operational metrics.
- Intelligent Inventory Recommendation Tool: An AI-powered tool providing recommendations for optimal inventory reorder points and proactively alerting sellers about low-stock items based on historical sales data and current inventory levels.

## Style Guidelines:

- Primary Dark (Top Navigation & Sidebar): #0f172a (Slate-900).
- Main Background (App Body): #f8fafc (Slate-50) for depth and readability.
- Accent Teal (Currency values, success states, primary icons): #2dd4bf (Teal-400).
- Status Amber ('Unpaid'/'Pending' states): Background #fef3c7, text #92400e.
- Cards/Surfaces: Pure white (#ffffff) with subtle shadow-sm for emphasis.
- Body and Headline font: 'Inter' (sans-serif) for a clean, professional appearance. Headers use 'font-semibold', table data uses 'font-medium'. Note: currently only Google Fonts are supported.
- Primary icons should utilize the Accent Teal color to denote interactive elements and success states. Ensure a consistent, clean, and functional icon set across the application.
- Utilize a Responsive Container (max-w-7xl mx-auto px-6 py-8) for all page content. The top navigation bar must remain fixed, including the 'musaa' branding and 'Logout' button.
- Every page must feature a clear Page Header section with a large title and a smaller, descriptive sub-headline in 'text-slate-500'.
- Interactive tables will feature 'hover:bg-slate-50' for row hover states. Incorporate subtle transitions for state changes and user feedback.