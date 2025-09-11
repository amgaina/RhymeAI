-- DropIndex
DROP INDEX "events_chat_id_key";

-- AlterTable
ALTER TABLE "events" ALTER COLUMN "chat_id" DROP NOT NULL;
