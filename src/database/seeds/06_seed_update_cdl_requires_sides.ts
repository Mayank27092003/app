import type { Knex } from "knex";
import { CommonDocumentTypes } from "../../constants/enum";

export async function seed(knex: Knex): Promise<void> {
  console.log("🌱 Updating CDL document type to require sides...");

  // Update CDL document type to require sides (front and back)
  await knex("documentTypes")
    .where({ name: CommonDocumentTypes.CDL })
    .update({
      requiresSides: true,
    });

  console.log("✅ CDL document type updated to require sides successfully!");
}

