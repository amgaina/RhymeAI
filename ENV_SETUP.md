# Environment Variables Setup Guide

This guide explains how to set up the environment variables required for RhymeAI to function properly.

## Required Environment Variables

Copy the `.env.example` file to a new file named `.env.local`:

```bash
cp .env.example .env.local
```

Then edit the `.env.local` file with your actual values.

## Database Configuration

```
DATABASE_URL="postgresql://username:password@localhost:5432/rhymeai?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/rhymeai?schema=public"
```

- Replace `username`, `password`, and potentially the host and database name with your actual PostgreSQL credentials.
- `DIRECT_URL` is used by Prisma when Prisma Accelerate is enabled.

## Authentication

```
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-clerk-publishable-key"
CLERK_SECRET_KEY="sk_test_your-clerk-secret-key"
```

- `NEXTAUTH_SECRET`: Generate a secure random string (e.g., using `openssl rand -base64 32`)
- Clerk keys: Obtain from your Clerk dashboard at https://dashboard.clerk.dev/

## AWS S3 Configuration

```
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="rhymeai-audio"
```

1. Create an AWS account if you don't have one
2. Create an IAM user with S3 access permissions
3. Create an S3 bucket for storing audio files
4. Configure CORS on your S3 bucket to allow access from your application domain

## Google Cloud Text-to-Speech

You have three options for setting up Google Cloud Text-to-Speech:

### Option 1: API Key (Simplest)

```
GOOGLE_API_KEY="AIzaSyYourGoogleApiKeyHere"
GOOGLE_PROJECT_ID="your-project-id"
```

1. Create a Google Cloud Platform account
2. Create a new project
3. Enable the Text-to-Speech API
4. Create an API key in the Google Cloud Console
5. Copy the API key into the `GOOGLE_API_KEY` environment variable
6. Copy your project ID into the `GOOGLE_PROJECT_ID` environment variable

### Option 2: Service Account JSON

```
GOOGLE_APPLICATION_CREDENTIALS_JSON='{...}'
```

1. Create a Google Cloud Platform account
2. Create a new project
3. Enable the Text-to-Speech API
4. Create a service account with Text-to-Speech access
5. Generate a JSON key for the service account
6. Copy the entire JSON content into the `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable

### Option 3: Service Account Key File

```
GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

1. Create a Google Cloud Platform account
2. Create a new project
3. Enable the Text-to-Speech API
4. Create a service account with Text-to-Speech access
5. Generate a JSON key for the service account
6. Save the JSON key file to your local machine
7. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of the JSON key file

## Other Configuration

```
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

- Set `NODE_ENV` to `production` in production environments
- Update `NEXT_PUBLIC_APP_URL` to your actual domain in production

## Optional: Analytics and Monitoring

```
SENTRY_DSN="your-sentry-dsn"
VERCEL_ANALYTICS_ID="your-vercel-analytics-id"
```

Uncomment and configure these if you're using Sentry for error tracking or Vercel Analytics.

## Verifying Your Setup

You can verify your environment variables are correctly set up by running:

```bash
npm run env:check
```

This will check that all required environment variables are present and properly formatted.
