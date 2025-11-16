# Smart Receipt & Document Manager - Setup Guide

## Project Overview

This is a comprehensive receipt and document management app built with Expo and Supabase. The app allows users to capture, organize, and track receipts and bills with AI-powered document processing.

### Key Features

- User authentication with email/password
- Document capture and OCR processing
- Automatic filing by payment method
- Bills tracking with due dates
- CSV export and printing
- Bank statement reconciliation (framework ready)
- Dark mode toggle
- Responsive mobile-first design

## Project Structure

```
project/
├── app/
│   ├── (auth)/          # Authentication screens
│   │   ├── index.tsx    # Welcome/landing page
│   │   ├── sign-in.tsx  # Sign in screen
│   │   └── sign-up.tsx  # Account creation
│   ├── (tabs)/          # Main app screens
│   │   ├── index.tsx    # Dashboard
│   │   ├── capture.tsx  # Document capture
│   │   ├── documents.tsx# Document list
│   │   └── settings.tsx # Settings & preferences
│   └── _layout.tsx      # Root layout with auth provider
├── contexts/
│   └── AuthContext.tsx  # Authentication state management
├── lib/
│   ├── supabase.ts      # Supabase client instance
│   └── database.types.ts# TypeScript types for database
├── services/
│   └── documentService.ts # Database operations for documents
├── utils/
│   ├── ocrUtils.ts      # OCR processing utilities
│   └── exportUtils.ts   # CSV export and print utilities
```

## Database Schema

The app uses Supabase with the following tables:

### Core Tables
- **users**: Extended user profiles with subscription info
- **payment_methods**: Credit cards and bank accounts
- **documents**: Document metadata and file references
- **receipts**: Filed receipts with payment methods
- **bills**: Unpaid bills with due dates

### Supporting Tables
- **documents_ocr_data**: OCR extraction results
- **categories**: User-defined expense categories
- **document_categories**: Category assignments
- **bank_statements**: Uploaded bank statements
- **reconciliation_matches**: Receipt-to-statement matching

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase project (already configured)
- iOS device or simulator for testing

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   The `.env` file is already configured with Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Database Setup**
   The database schema is already created. To verify, check the Supabase dashboard for these tables:
   - users
   - payment_methods
   - documents
   - receipts
   - bills

### Running the App

**Web Development**
```bash
npm run dev
```
The app will be available at `http://localhost:8081`

**Build for Web**
```bash
npm run build:web
```

**Type Checking**
```bash
npm run typecheck
```

**Linting**
```bash
npm run lint
```

## Feature Implementation Guide

### 1. Document Capture
- Location: `app/(tabs)/capture.tsx`
- Uses `expo-camera` for image capture
- Integrates with Supabase Storage for file uploads
- OCR processing via `utils/ocrUtils.ts`

### 2. Smart Filing
- Automatically detects credit card numbers
- Routes receipts to payment method folders
- Standardized naming: `VENDOR_AMOUNT_MMDDYYYY`
- Handles both paid receipts and unpaid bills

### 3. Payment Method Management
- Add credit cards and bank accounts
- Track by last 4 digits
- Set default payment method
- Assign nicknames (e.g., "Personal AMEX")

### 4. Bill Tracking
- Unpaid bills shown by due date
- Mark as paid with payment method
- Converts to receipt upon payment
- Automatic reminders (framework ready)

### 5. Export Features
- Generate CSV reports
- Print receipt summaries
- Filter by date range and category
- Bulk export capabilities

### 6. Bank Reconciliation
- Upload bank statements
- Auto-match transactions to receipts
- Confidence scoring
- Reconciliation workflow (framework ready)

## Authentication Flow

1. User visits welcome screen
2. Creates account or signs in
3. Auth context manages session state
4. Protected routes redirect unauthenticated users
5. Token automatically persists via Supabase

## Services and Utilities

### documentService.ts
Handles all document-related database operations:
- `createPaymentMethod()` - Add payment methods
- `createDocument()` - Create document records
- `createReceipt()` - File paid documents
- `createBill()` - Create unpaid bills
- `getReceiptsByPaymentMethod()` - Filter receipts
- `uploadDocumentFile()` - Upload to storage

### ocrUtils.ts
Provides OCR processing:
- `mockOCRProcessing()` - Extract data from text
- `extractCardInfo()` - Detect credit cards
- `extractVendor()` - Identify vendor
- `extractAmount()` - Get amount
- `isBill()` - Classify document type

### exportUtils.ts
Export and reporting:
- `generateReceiptCSV()` - Create receipt CSV
- `generateBillCSV()` - Create bill CSV
- `downloadCSV()` - Trigger download
- `printReceipts()` - Print receipt report

## Styling and Theme

- **Colors**: Professional blue (#0066cc) primary with neutral grays
- **Fonts**: Inter (body), Plus Jakarta Sans (headings)
- **Dark Mode**: Supported via `useColorScheme()`
- **Spacing**: 8px-based system for consistency

## Next Steps & Roadmap

### Phase 1 (Current)
- [x] Database schema
- [x] Authentication system
- [x] Navigation structure
- [x] Dashboard UI
- [ ] Camera integration (enable expo-camera)
- [ ] OCR API integration

### Phase 2
- [ ] Subscription billing (integrate RevenueCat)
- [ ] Advanced bank reconciliation
- [ ] ML-powered vendor recognition
- [ ] Multi-user/family support

### Phase 3
- [ ] Offline support
- [ ] Advanced analytics
- [ ] Tax category automation
- [ ] Receipt search

## Important Notes

### Storage Setup
To enable document uploads, configure Supabase Storage:
1. Create a bucket named `documents`
2. Set access level to authenticated users
3. Define RLS policies for user-scoped access

### OCR Integration
Currently using mock OCR. To integrate real OCR:
1. Use an Edge Function to call external API (e.g., AWS Textract)
2. Store results in `documents_ocr_data` table
3. Update `mockOCRProcessing()` to call Edge Function

### Subscription Billing
When ready to add RevenueCat:
1. Create RevenueCat account
2. Configure entitlements
3. Import RevenueCat SDK
4. Update settings screen with subscription UI

## Troubleshooting

**Build Errors**
- Clear cache: `npm cache clean --force`
- Reinstall: `rm -rf node_modules && npm install`

**Authentication Issues**
- Verify Supabase URL and key in `.env`
- Check Supabase auth configuration
- Ensure database user table exists

**Database Issues**
- Verify RLS policies allow authenticated access
- Check user_id matches auth.uid()
- Review error logs in Supabase dashboard

## Support

For issues or questions:
1. Check Supabase documentation
2. Review Expo Router documentation
3. Check TypeScript errors with `npm run typecheck`
