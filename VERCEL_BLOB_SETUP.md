# Vercel Blob Storage Setup Guide

## What is Vercel Blob?

Vercel Blob is a serverless file storage solution that works seamlessly with Vercel deployments. It's perfect for storing user-uploaded files like logos, images, etc.

## Setup Steps

### 1. Enable Vercel Blob in Your Project

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (`menuvibe-frontend`)
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Blob** from the options
6. Click **Create**

### 2. Environment Variable

Vercel automatically adds the `BLOB_READ_WRITE_TOKEN` environment variable to your project when you enable Blob storage. You don't need to manually configure it.

**For local development:**
1. In your Vercel dashboard, go to your project
2. Go to **Settings** → **Environment Variables**
3. Find `BLOB_READ_WRITE_TOKEN` 
4. Copy the value
5. Add it to your local `.env.local` file:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
   ```

### 3. Verify Installation

The `@vercel/blob` package is already installed in this project. You can verify by checking `package.json`.

### 4. Usage in the App

The business profile API (`app/api/business-profile/route.ts`) is already configured to use Vercel Blob for logo uploads:

```typescript
import { put } from '@vercel/blob';

// Upload file
const blob = await put(filename, file, {
  access: 'public',
  addRandomSuffix: false,
});

// blob.url contains the public URL to the uploaded file
```

### 5. Testing

After enabling Vercel Blob:

1. **Production**: Just push your code and deploy. Vercel Blob will work automatically.
2. **Local Development**: 
   - Add `BLOB_READ_WRITE_TOKEN` to `.env.local`
   - Run `npm run dev`
   - Test logo upload in the profile page

### 6. Features

- ✅ **Serverless**: No server management needed
- ✅ **Automatic CDN**: Files are served via Vercel's global CDN
- ✅ **Public Access**: Uploaded logos are publicly accessible via URL
- ✅ **Scalable**: Pay only for what you use
- ✅ **Fast**: Optimized for quick uploads and downloads

### 7. Pricing

- **Hobby Plan**: 500MB storage free
- **Pro Plan**: 100GB included, then $0.15/GB
- More details: https://vercel.com/docs/storage/vercel-blob/usage-and-pricing

### 8. Alternative Storage Options

If you prefer other storage solutions:

- **AWS S3**: More configuration but very scalable
- **Cloudinary**: Image-specific with transformations
- **UploadThing**: Developer-friendly file uploads
- **Supabase Storage**: Open-source alternative

To switch to another provider, update the upload logic in:
- `app/api/business-profile/route.ts` (for business logos)

### 9. Migration from Base64

If you have existing logos stored as base64 in the database, they will continue to work. New uploads will use Vercel Blob automatically.

## Troubleshooting

**Issue**: "Missing Blob read/write token"
- **Solution**: Make sure you've enabled Blob storage in Vercel dashboard and the environment variable is set.

**Issue**: Logo upload fails in local development
- **Solution**: Add `BLOB_READ_WRITE_TOKEN` from Vercel dashboard to your `.env.local` file.

**Issue**: Uploaded images not showing
- **Solution**: Check that the blob URL is being saved to the database correctly.

## Documentation

- Vercel Blob Docs: https://vercel.com/docs/storage/vercel-blob
- API Reference: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
