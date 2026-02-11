import type { Knex } from "knex";
import { CommonDocumentTypes } from "../../constants/enum";

export async function seed(knex: Knex): Promise<void> {
  console.log("🌱 Seeding all document types...");

  const documentTypes = [
    // Driver-related
    { name: CommonDocumentTypes.DRIVER_LICENSE, displayName: "Driver License", description: "Driver's license or permit (regular, non-CDL)", requiresExpiry: true },
    { name: CommonDocumentTypes.VEHICLE_REGISTRATION, displayName: "Vehicle Registration", description: "Vehicle registration certificate", requiresExpiry: true },
    { name: CommonDocumentTypes.INSURANCE, displayName: "Insurance", description: "Vehicle insurance certificate", requiresExpiry: true },
    { name: CommonDocumentTypes.CDL, displayName: "CDL", description: "Commercial Driver License (front & back)", requiresExpiry: true, requiresSides: true },
    { name: CommonDocumentTypes.MEDICAL_CARD, displayName: "Medical Card", description: "Medical examiner's certificate", requiresExpiry: true },
    { name: CommonDocumentTypes.HAZMAT_ENDORSEMENT, displayName: "Hazmat Endorsement", description: "Hazardous materials endorsement", requiresExpiry: true },
    { name: CommonDocumentTypes.TWIC_CARD, displayName: "TWIC Card", description: "Transportation Worker Identification Credential", requiresExpiry: true },
    { name: CommonDocumentTypes.PASSPORT, displayName: "Passport", description: "Passport for international travel", requiresExpiry: true },
    { name: CommonDocumentTypes.ID_CARD, displayName: "ID Card", description: "Government-issued identification card", requiresExpiry: true },

    // Company-related
    { name: CommonDocumentTypes.BUSINESS_LICENSE, displayName: "Business License", description: "Business operating license", requiresExpiry: true },
    { name: CommonDocumentTypes.TAX_DOCUMENT, displayName: "Tax Document", description: "Tax identification or tax clearance", requiresExpiry: false },
    { name: CommonDocumentTypes.BANK_STATEMENT, displayName: "Bank Statement", description: "Bank account statement for verification", requiresExpiry: false },
    { name: CommonDocumentTypes.ADDRESS_PROOF, displayName: "Address Proof", description: "Proof of address (utility bill, lease agreement)", requiresExpiry: false },

    // Broker-specific
    { name: CommonDocumentTypes.BROKER_LICENSE, displayName: "Broker License", description: "Broker license", requiresExpiry: true },
    { name: CommonDocumentTypes.BROKER_BOND, displayName: "Broker Bond", description: "Broker Bond (BMC-84 or BMC-85)", requiresExpiry: true },

    // Carrier-specific
    { name: CommonDocumentTypes.CARGO_INSURANCE, displayName: "Cargo Insurance", description: "Cargo insurance", requiresExpiry: true },
    { name: CommonDocumentTypes.FUEL_TAX_EXEMPTION, displayName: "Fuel Tax Exemption", description: "Fuel tax exemption", requiresExpiry: true },

    // Shipper-specific
    { name: CommonDocumentTypes.SHIPPER_REGISTRATION, displayName: "Shipper Registration", description: "Shipper registration", requiresExpiry: true },
    { name: CommonDocumentTypes.DELIVERY_TERMS, displayName: "Delivery Terms", description: "Delivery terms agreement", requiresExpiry: false },

    // Driver-specific documents
    { name: CommonDocumentTypes.WORK_AUTHORIZATION, displayName: "Work Authorization", description: "Work Permit OR Green Card OR Citizenship Card OR Permanent Resident (PR)", requiresExpiry: true },
    { name: CommonDocumentTypes.DRIVING_RECORD, displayName: "Driving Record", description: "Driving record/MVR", requiresExpiry: false },
    { name: CommonDocumentTypes.DRUG_TEST_REPORT, displayName: "Drug Test Report", description: "Drug test report", requiresExpiry: false },
    { name: CommonDocumentTypes.SOCIAL_SECURITY_NUMBER, displayName: "Social Security Number", description: "Social security number document", requiresExpiry: false, acceptsTextInput: true },
    { name: CommonDocumentTypes.PSP, displayName: "PSP", description: "Pre-Employment Screening Program (PSP)", requiresExpiry: false },
    { name: CommonDocumentTypes.CLEARINGHOUSE, displayName: "Clearinghouse", description: "Drug & Alcohol Clearinghouse (Full)", requiresExpiry: false },
    { name: CommonDocumentTypes.ROAD_TEST, displayName: "Road Test", description: "Road Test (optional)", requiresExpiry: false },
    { name: CommonDocumentTypes.I9_FORM, displayName: "I-9 Form", description: "I-9 Employment Eligibility Verification (auto-filled in app)", requiresExpiry: false },
    { name: CommonDocumentTypes.EMPLOYEE_VERIFICATION, displayName: "Employee Verification", description: "Employee verification or reference letter (optional)", requiresExpiry: false },

    // Carrier-specific documents
    { name: CommonDocumentTypes.W9_FORM, displayName: "W-9 Form", description: "W-9 Tax Form", requiresExpiry: false },
    { name: CommonDocumentTypes.MC_AUTHORITY_LETTER, displayName: "MC Authority Letter", description: "Motor Carrier Authority Letter", requiresExpiry: true },
    { name: CommonDocumentTypes.CERTIFICATE_OF_INSURANCE, displayName: "Certificate of Insurance (COI)", description: "Certificate of Insurance", requiresExpiry: true },
    { name: CommonDocumentTypes.AUTO_LIABILITY_INSURANCE, displayName: "Auto Liability Insurance", description: "Auto Liability Insurance $1,000,000", requiresExpiry: true },
    { name: CommonDocumentTypes.CARGO_INSURANCE_100K, displayName: "Cargo Insurance $100K+", description: "Cargo Insurance $100,000+", requiresExpiry: true },
    { name: CommonDocumentTypes.BROKER_CARRIER_AGREEMENT, displayName: "Broker–Carrier Agreement", description: "Broker–Carrier Agreement (LoadRider's built-in version)", requiresExpiry: false },
    { name: CommonDocumentTypes.OPERATING_AUTHORITY, displayName: "Operating Authority", description: "Operating Authority", requiresExpiry: true },
    { name: CommonDocumentTypes.FMCSA_STATUS, displayName: "FMCSA Status", description: "FMCSA Operating Status", requiresExpiry: false },
    { name: CommonDocumentTypes.CARB, displayName: "CARB", description: "California Air Resources Board compliance", requiresExpiry: true },
    { name: CommonDocumentTypes.CTC, displayName: "CTC", description: "CTC compliance document", requiresExpiry: true },
    { name: CommonDocumentTypes.MC_PERMIT, displayName: "MC Permit", description: "Motor Carrier Permit", requiresExpiry: true },
  ];

  // Insert document types (only if they don't exist)
  for (const docType of documentTypes) {
    const existing = await knex("documentTypes")
      .where("name", docType.name)
      .first();
    
    if (!existing) {
      await knex("documentTypes")
        .insert({
          ...docType,
          createdAt: new Date().toISOString(),
        });
      console.log(`✅ Added document type: ${docType.displayName}`);
    } else {
      console.log(`⏭️  Document type already exists: ${docType.displayName}`);
    }
  }

  console.log("✅ Document types seeded successfully!");

  // Fetch roles + docs
  const insertedDocTypes = await knex("documentTypes").select("*");
  const roles = await knex("roles").select("*");

  console.log("🔗 Assigning document type requirements to roles...");

  // Helper fn - adds documents if they don't exist, updates isOptional for existing ones
  async function assignDocsToRole(
    roleKeyword: string,
    documents: Array<{ name: string; isOptional: boolean }>
  ) {
    const role = roles.find((r) =>
      r.name.toLowerCase().includes(roleKeyword.toLowerCase())
    );
    if (!role) {
      console.log(`⚠️  Role not found: ${roleKeyword}`);
      return;
    }

    // Get existing document requirements for this role
    const existingRequirements = await knex("documentTypeRoleRequirements")
      .where("roleId", role.id)
      .select("documentTypeId", "id");

    const existingDocTypeIds = new Set(existingRequirements.map((r) => r.documentTypeId));
    const existingRequirementsMap = new Map(
      existingRequirements.map((r) => [r.documentTypeId, r.id])
    );

    // Insert new entries or update existing ones
    let addedCount = 0;
    let updatedCount = 0;
    for (let i = 0; i < documents.length; i++) {
      const { name, isOptional } = documents[i];
      const docType = insertedDocTypes.find((dt) => dt.name === name);
      if (docType) {
        // Check if this document is already assigned to this role
        if (!existingDocTypeIds.has(docType.id)) {
          // Insert new entry
          await knex("documentTypeRoleRequirements")
            .insert({
              documentTypeId: docType.id,
              roleId: role.id,
              sortOrder: i,
              isOptional: isOptional,
            });
          addedCount++;
        } else {
          // Update existing entry with isOptional and sortOrder
          const requirementId = existingRequirementsMap.get(docType.id);
          if (requirementId) {
            await knex("documentTypeRoleRequirements")
              .where("id", requirementId)
              .update({
                isOptional: isOptional,
                sortOrder: i,
              });
            updatedCount++;
          }
        }
      } else {
        console.log(`⚠️  Document type not found: ${name}`);
      }
    }
    console.log(`✅ Assigned ${addedCount} new docs and updated ${updatedCount} existing docs for ${role.name} (${existingDocTypeIds.size - updatedCount} unchanged)`);
  }

  // Assign to roles
  // DRIVER - Required: CDL (front & back), Medical Card, MVR, Drug Test, Clearinghouse, I-9, SSN, W-9, Work Authorization
  // DRIVER - Optional: PSP, Road Test, Employee Verification
  await assignDocsToRole("driver", [
    // Required documents
    { name: CommonDocumentTypes.CDL, isOptional: false },
    { name: CommonDocumentTypes.MEDICAL_CARD, isOptional: false },
    { name: CommonDocumentTypes.DRIVING_RECORD, isOptional: false }, // MVR
    { name: CommonDocumentTypes.DRUG_TEST_REPORT, isOptional: false },
    { name: CommonDocumentTypes.CLEARINGHOUSE, isOptional: false },
    { name: CommonDocumentTypes.I9_FORM, isOptional: false }, // I-9 (auto-filled in app but still required)
    { name: CommonDocumentTypes.SOCIAL_SECURITY_NUMBER, isOptional: false },
    { name: CommonDocumentTypes.W9_FORM, isOptional: false },
    { name: CommonDocumentTypes.WORK_AUTHORIZATION, isOptional: false },
    // Optional documents
    { name: CommonDocumentTypes.PSP, isOptional: true },
    { name: CommonDocumentTypes.ROAD_TEST, isOptional: true },
    { name: CommonDocumentTypes.EMPLOYEE_VERIFICATION, isOptional: true },
  ]);

  await assignDocsToRole("company", [
    { name: CommonDocumentTypes.BUSINESS_LICENSE, isOptional: false },
    { name: CommonDocumentTypes.TAX_DOCUMENT, isOptional: false },
    { name: CommonDocumentTypes.BANK_STATEMENT, isOptional: false },
    { name: CommonDocumentTypes.ADDRESS_PROOF, isOptional: false },
  ]);

  // BROKER - Required: MC Permit, Broker Bond, W-9
  // BROKER - Optional: Certificate of Insurance
  await assignDocsToRole("broker", [
    // Required documents
    { name: CommonDocumentTypes.MC_PERMIT, isOptional: false },
    { name: CommonDocumentTypes.BROKER_BOND, isOptional: false },
    { name: CommonDocumentTypes.W9_FORM, isOptional: false },
    // Optional documents
    { name: CommonDocumentTypes.CERTIFICATE_OF_INSURANCE, isOptional: true },
  ]);

  // CARRIER - Required: MC Permit, Certificate of Insurance (Auto + Cargo), W-9
  // According to requirements, only these 3 are required
  // Optional: Driving License
  await assignDocsToRole("carrier", [
    // Required documents (only these 3 per requirements)
    { name: CommonDocumentTypes.MC_PERMIT, isOptional: false },
    { name: CommonDocumentTypes.CERTIFICATE_OF_INSURANCE, isOptional: false },
    { name: CommonDocumentTypes.W9_FORM, isOptional: false },
    // Optional documents
    { name: CommonDocumentTypes.DRIVER_LICENSE, isOptional: true },
  ]);

  // SHIPPER - Required: W-9
  // SHIPPER - Optional: Insurance, Business License
  await assignDocsToRole("shipper", [
    // Required documents
    { name: CommonDocumentTypes.W9_FORM, isOptional: false },
    // Optional documents
    { name: CommonDocumentTypes.INSURANCE, isOptional: true },
    { name: CommonDocumentTypes.BUSINESS_LICENSE, isOptional: true },
  ]);

  console.log("🎉 All document type role requirements assigned successfully!");
}
