-- CreateTable
CREATE TABLE "events" (
    "event_id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "user_id" TEXT NOT NULL DEFAULT (auth.jwt() ->> 'sub'::text),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "location" TEXT,
    "event_date" DATE NOT NULL,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "expected_attendees" INTEGER,
    "voice_settings" JSONB,
    "language" TEXT NOT NULL DEFAULT 'English',
    "script_segments" JSONB[],
    "has_presentation" BOOLEAN NOT NULL DEFAULT false,
    "presentation_slides" JSONB,
    "recording_devices" JSONB,
    "streaming_destinations" JSONB,
    "event_settings" JSONB,
    "total_duration" INTEGER,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "last_played" TIMESTAMPTZ(6),

    CONSTRAINT "events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL DEFAULT (auth.jwt() ->> 'sub'::text),
    "email" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "preferences" JSONB,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_segments" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "segment_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audio_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "timing" INTEGER,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "script_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_analytics" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL DEFAULT (auth.jwt() ->> 'sub'::text),
    "event_id" INTEGER NOT NULL,
    "accessed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_user_id_idx" ON "events"("user_id");

-- CreateIndex
CREATE INDEX "events_event_date_idx" ON "events"("event_date");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_user_id_idx" ON "users"("user_id");

-- CreateIndex
CREATE INDEX "script_segments_event_id_idx" ON "script_segments"("event_id");

-- CreateIndex
CREATE INDEX "user_analytics_user_id_idx" ON "user_analytics"("user_id");

-- CreateIndex
CREATE INDEX "user_analytics_event_id_idx" ON "user_analytics"("event_id");

-- CreateIndex
CREATE INDEX "user_analytics_accessed_at_idx" ON "user_analytics"("accessed_at");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_segments" ADD CONSTRAINT "script_segments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_analytics" ADD CONSTRAINT "user_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_analytics" ADD CONSTRAINT "user_analytics_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;
