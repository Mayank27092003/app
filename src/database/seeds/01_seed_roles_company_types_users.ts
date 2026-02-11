import type { Knex } from "knex";
import bcrypt from "bcryptjs";

type BillingCycle = "hourly" | "weekly" | "monthly";

export async function seed(knex: Knex): Promise<void> {
  console.log("🌱 Seeding 'roles' table...");
  console.log("🌱 Seeding 'roleCategories'...");
  const categories = [
    {
      id: 1,
      name: "Send Goods",
      description: "Roles for posting or arranging shipments",
    },
    {
      id: 2,
      name: "Driver",
      description: "Licensed drivers who can deliver goods",
    },
    { id: 3, name: "System", description: "Internal system roles" },
  ];

  for (const category of categories) {
    const exists = await knex("roleCategories")
      .where("id", category.id)
      .first();
    if (!exists) {
      await knex("roleCategories").insert(category);
      console.log(`✅ Category inserted: ${category.name}`);
    }
  }

  console.log("🌱 Seeding 'roles'...");
  const allRoles = [
    { name: "shipper", description: "Posts job requests", categoryId: 1 },
    {
      name: "carrier",
      description: "Provides transport & drivers",
      categoryId: 1,
    },
    {
      name: "broker",
      description: "Arranges freight between parties",
      categoryId: 1,
    },
    { name: "driver", description: "Certified CDL driver", categoryId: 2 },
    { name: "admin", description: "Platform administrator", categoryId: 3 },
    { name: "company", description: "General company user", categoryId: 3 },
    { name: "manager", description: "Company manager", categoryId: 3 },
  ];

  for (const role of allRoles) {
    const exists = await knex("roles").where("name", role.name).first();
    if (!exists) {
      await knex("roles").insert(role);
      console.log(`✅ Role inserted: ${role.name}`);
    }
  }

  console.log("🌱 Seeding 'companyTypes' table...");

  const companyTypesToSeed = [
    {
      name: "broker",
      description: "Handles freight arrangement between parties",
      roleCategoryId: 1,
    },
    {
      name: "shipper",
      description: "Owns goods and posts jobs",
      roleCategoryId: 1,
    },
    {
      name: "carrier",
      description: "Provides transportation and drivers",
      roleCategoryId: 1,
    },
  ];

  for (const type of companyTypesToSeed) {
    const exists = await knex("companyTypes").where("name", type.name).first();
    if (!exists) {
      await knex("companyTypes").insert(type);
      console.log(`✅ Inserted company type: ${type.name}`);
    } else {
      console.log(`ℹ️ Company type already exists: ${type.name}`);
    }
  }

  console.log("🌱 Creating default admin user...");
  const adminEmail = "admin@loadmyride.com";
  const existingAdmin = await knex("users").where("email", adminEmail).first();

  let adminUserId: number;
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [user] = await knex("users")
      .insert({
        userName: "Admin User",
        firstName: "Admin",
        middleName: "",
        lastName: "",
        email: adminEmail,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning("id");
    adminUserId = user.id || user;
    console.log("✅ Admin user inserted.");
  } else {
    adminUserId = existingAdmin.id;
    console.log("ℹ️ Admin user already exists.");
  }

  const adminRole = await knex("roles").where({ name: "admin" }).first();
  const adminRoleAssignment = await knex("userRoles")
    .where({ userId: adminUserId, roleId: adminRole.id })
    .first();

  if (!adminRoleAssignment) {
    await knex("userRoles").insert({
      userId: adminUserId,
      roleId: adminRole.id,
      // assignedBy: null,
      // assignedAt: new Date(),
    });
    console.log("✅ Assigned 'admin' role to admin user.");
  } else {
    console.log("ℹ️ 'admin' role already assigned.");
  }

  console.log("🌱 Seeding 'roleVisibilityPermissions' table...");
  const roles = await knex("roles").select("id", "name");
  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

  const visibilityData = [
    { from: "broker", to: "carrier" },
    { from: "broker", to: "driver" },
    { from: "shipper", to: "broker" },
    { from: "carrier", to: "driver" },
  ];

  for (const item of visibilityData) {
    const fromRoleId = roleMap[item.from];
    const visibleToRoleId = roleMap[item.to];

    const exists = await knex("roleVisibilityPermissions")
      .where({ fromRoleId, visibleToRoleId })
      .first();

    if (!exists) {
      await knex("roleVisibilityPermissions").insert({
        fromRoleId,
        visibleToRoleId,
        createdAt: new Date(),
      });
      console.log(`✅ ${item.from} can see ${item.to}`);
    } else {
      console.log(`ℹ️ Visibility already set: ${item.from} -> ${item.to}`);
    }
  }

  console.log("🌱 Seeding 'roleCommissions' table...");

  const billingCycles: BillingCycle[] = ["hourly", "weekly", "monthly"];
  const defaultCommissions: Record<string, Record<BillingCycle, number>> = {
    shipper: { hourly: 5.0, weekly: 4.5, monthly: 4.0 },
    broker: { hourly: 10.0, weekly: 7.5, monthly: 6.0 },
    driver: { hourly: 5.0, weekly: 5.0, monthly: 5.0 },
  };

  const rows = [];

  for (const [roleName, commissionByCycle] of Object.entries(
    defaultCommissions
  )) {
    const roleId = roleMap[roleName];
    if (!roleId) continue;

    for (const billingCycle of billingCycles) {
      rows.push({
        roleId,
        billingCycle,
        platformCommissionPercent: commissionByCycle[billingCycle],
        createdAt: new Date(),
      });
    }
  }

  for (const row of rows) {
    await knex("roleCommissions").insert(row);
  }

  const existing = await knex("paymentProviders")
    .where({ name: "Stripe" })
    .first();

  if (!existing) {
    await knex("paymentProviders").insert({
      name: "Stripe",
      description: "Stripe payment gateway integration",
      isEnabled: true,
      createdAt: knex.fn.now(),
    });

    console.log("✅ Stripe payment provider inserted");
  } else {
    console.log("ℹ️ Stripe payment provider already exists, skipping...");
  }

  console.log("✅ Seeding complete.");
}
