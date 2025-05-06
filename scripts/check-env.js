#!/usr/bin/env node

/**
 * Environment variables validation script
 *
 * This script checks that all required environment variables are set
 * and properly formatted.
 */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from .env.local if it exists
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  console.log("Loading environment variables from .env.local");
  dotenv.config({ path: envPath });
} else {
  console.log("No .env.local file found, using existing environment variables");
}

// Define required environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "S3_BUCKET_NAME",
];

// Define environment variables that should be checked but aren't strictly required
const optionalEnvVars = [
  "GOOGLE_APPLICATION_CREDENTIALS_JSON",
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_APP_URL",
  "PRISMA_ACCELERATE_URL",
];

// Check required environment variables
let missingVars = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  console.error("\n❌ Missing required environment variables:");
  missingVars.forEach((v) => console.error(`   - ${v}`));
  console.error("\nPlease add these to your .env.local file");
} else {
  console.log("\n✅ All required environment variables are set");
}

// Check optional environment variables
let missingOptionalVars = [];
for (const envVar of optionalEnvVars) {
  if (!process.env[envVar]) {
    missingOptionalVars.push(envVar);
  }
}

if (missingOptionalVars.length > 0) {
  console.warn("\n⚠️ Missing optional environment variables:");
  missingOptionalVars.forEach((v) => console.warn(`   - ${v}`));
  console.warn("\nThese are not strictly required but may limit functionality");
} else {
  console.log("✅ All optional environment variables are set");
}

// Validate Google TTS configuration
let googleTtsConfigured = false;

// Check for API key (Option 1)
if (process.env.GOOGLE_API_KEY) {
  if (process.env.GOOGLE_API_KEY.startsWith("AIza")) {
    console.log("✅ Google API key is properly formatted");
    googleTtsConfigured = true;

    if (!process.env.GOOGLE_PROJECT_ID) {
      console.warn(
        "⚠️ GOOGLE_PROJECT_ID is missing but recommended when using GOOGLE_API_KEY"
      );
    }
  } else {
    console.warn(
      '⚠️ Google API key does not start with "AIza" - it may not be valid'
    );
  }
}

// Check for service account JSON (Option 2)
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    const credentials = JSON.parse(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    );
    const requiredFields = [
      "type",
      "project_id",
      "private_key",
      "client_email",
    ];
    const missingFields = requiredFields.filter((field) => !credentials[field]);

    if (missingFields.length > 0) {
      console.error(
        "\n❌ Google TTS credentials are missing required fields:",
        missingFields.join(", ")
      );
    } else {
      console.log(
        "✅ Google TTS service account credentials are properly formatted"
      );
      googleTtsConfigured = true;
    }
  } catch (error) {
    // It might be an API key stored in the wrong variable
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON.startsWith("AIza")) {
      console.warn(
        "⚠️ GOOGLE_APPLICATION_CREDENTIALS_JSON contains what appears to be an API key, not a JSON object"
      );
      console.warn("   Consider moving this value to GOOGLE_API_KEY instead");
      googleTtsConfigured = true;
    } else {
      console.error(
        "\n❌ Google TTS credentials are not valid JSON:",
        error.message
      );
    }
  }
}

// Check for service account key file path (Option 3)
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    console.log("✅ Google TTS service account key file exists");
    googleTtsConfigured = true;
  } else {
    console.error(
      `\n❌ Google TTS service account key file not found at: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`
    );
  }
}

// Summary for Google TTS configuration
if (!googleTtsConfigured) {
  console.warn(
    "\n⚠️ No Google TTS configuration found. Text-to-speech features will not work."
  );
  console.warn(
    "   Configure one of: GOOGLE_API_KEY, GOOGLE_APPLICATION_CREDENTIALS_JSON, or GOOGLE_APPLICATION_CREDENTIALS"
  );
} else {
  console.log("✅ Google TTS is configured");
}

// Validate AWS S3 configuration
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  if (
    process.env.AWS_ACCESS_KEY_ID.length < 16 ||
    process.env.AWS_SECRET_ACCESS_KEY.length < 16
  ) {
    console.warn(
      "\n⚠️ AWS credentials appear to be too short, please verify they are correct"
    );
  } else {
    console.log("✅ AWS credentials appear to be properly formatted");
  }
}

// Validate database URL
if (process.env.DATABASE_URL) {
  if (!process.env.DATABASE_URL.startsWith("postgresql://")) {
    console.error(
      "\n❌ DATABASE_URL does not appear to be a valid PostgreSQL connection string"
    );
  } else {
    console.log("✅ DATABASE_URL appears to be properly formatted");
  }
}

// Summary
if (missingVars.length === 0 && missingOptionalVars.length === 0) {
  console.log("\n🎉 All environment variables are properly configured!");
} else if (missingVars.length === 0) {
  console.log(
    "\n🟡 Basic configuration is complete, but some optional features may not work"
  );
} else {
  console.error(
    "\n🔴 Please fix the missing required environment variables to proceed"
  );
  process.exit(1);
}
