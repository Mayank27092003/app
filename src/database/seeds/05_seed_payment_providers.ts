import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  console.log("🌱 Seeding payment providers...");

  // Check if payment providers already exist
  const existingProviders = await knex("paymentProviders").select("name");
  const existingNames = existingProviders.map(p => p.name);

  const providers = [
    {
      name: "stripe",
      description: "Stripe payment processor",
      isEnabled: true,
    },
    {
      name: "paypal",
      description: "PayPal payment processor",
      isEnabled: false, // Disabled by default
    },
    {
      name: "square",
      description: "Square payment processor",
      isEnabled: false, // Disabled by default
    },
  ];

  // Only insert providers that don't exist
  const providersToInsert = providers.filter(p => !existingNames.includes(p.name));

  if (providersToInsert.length > 0) {
    await knex("paymentProviders").insert(providersToInsert);
    console.log(`✅ Inserted ${providersToInsert.length} payment providers`);
  } else {
    console.log("✅ Payment providers already exist, skipping...");
  }
}
