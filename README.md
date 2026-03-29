# SwiftFlow - Synchronized Order Management

SwiftFlow is a professional logistics and order management ecosystem built for jewelry workshops and storefronts. It synchronizes business operations between **Sellers (Admins)** and **Customers (Shoppers)** in real-time.

## Key Features

- **Real-Time Dashboard**: Role-based command centers for both sellers and customers.
- **Unified Inventory**: Manage both "Finished Goods" (visible to customers) and "Raw Materials" (private to the workshop).
- **Synchronized Chat**: Context-aware messaging between buyers and sellers with persistent history.
- **M-Pesa Integration (Simulated)**: Mobile-first checkout and payment authorization flow.
- **Logistics Command**: Track orders from "Pending" to "Completed" with automated stock updates.

## The Seed Catalog

To help you get started quickly, we've included a **Seed Catalog** feature located on the **Inventory Page**.

### What it does:
The Seed Catalog is an automated script that populates your database with a professional starter set of data. This allows you to test the full "SwiftFlow" experience without manual data entry.

### What is added:
- **Finished Goods**: Premium jewelry pieces like "Infinity Bridal Sets" and "Maasai Beaded Chokers". These will appear instantly in the **Customer Shop**.
- **Raw Materials**: Workshop essentials like "14K Gold Wire" and "Sterling Silver Sheets". These are only visible in the **Seller Inventory** for restocking and logistics tracking.

### How to use it:
1. Log in as a **Seller**.
2. Navigate to the **Inventory** page.
3. Click the **"Seed Catalog"** button in the top-right corner.
4. Your inventory will be synchronized with sample data, and the Shop will become active for your customers.

## Tech Stack

- **Framework**: NextJS (App Router)
- **Styling**: Tailwind CSS & ShadCN UI
- **Database/Auth**: Firebase Firestore & Firebase Authentication
- **AI**: Genkit (Inventory Recommendations)
