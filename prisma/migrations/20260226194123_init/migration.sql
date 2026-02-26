-- CreateEnum
CREATE TYPE "LinkPrecedence" AS ENUM ('primary', 'secondary');

-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "phone_number" VARCHAR(20),
    "email" VARCHAR(255),
    "linked_id" INTEGER,
    "link_precedence" "LinkPrecedence" NOT NULL DEFAULT 'primary',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_contact_email" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "idx_contact_phone_number" ON "contacts"("phone_number");

-- CreateIndex
CREATE INDEX "idx_contact_linked_id" ON "contacts"("linked_id");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_linked_id_fkey" FOREIGN KEY ("linked_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
