import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  console.log('🚀 Running UP migration: Creating translationKeys table...');
  await knex.schema.createTable('translationKeys', (table) => {
    table.increments('id').primary();
    table.string('key').notNullable().unique(); // e.g., "loginSuccess"
    table.string('namespace').defaultTo('common'); // e.g., "auth"
    table.text('description');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });

  console.log('✅ Created translationKeys table');

  console.log('🚀 Creating translations table...');
  await knex.schema.createTable('translations', (table) => {
    table.increments('id').primary();
    table
      .integer('keyId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('translationKeys')
      .onDelete('CASCADE');
    table.string('lang', 10).notNullable(); // e.g., "en", "fr"
    table.text('value').notNullable(); // e.g., "Welcome, {{user}}!"
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.unique(['keyId', 'lang']);
  });

  console.log('✅ Created translations table');

  console.log('🌱 Seeding translation keys...');
  const [loginSuccessKey] = await knex('translationKeys')
    .insert({
      key: 'loginSuccess',
      namespace: 'auth',
      description: 'Message shown on successful login',
    })
    .returning<{ id: number }[]>('id');

  const [invalidLoginKey] = await knex('translationKeys')
    .insert({
      key: 'invalidLogin',
      namespace: 'auth',
      description: 'Message shown when login fails',
    })
    .returning<{ id: number }[]>('id');

  console.log('🌱 Seeding translations...');
  await knex('translations').insert([
    {
      keyId: loginSuccessKey.id,
      lang: 'en',
      value: 'Welcome, {{user}}!',
    },
    {
      keyId: loginSuccessKey.id,
      lang: 'fr',
      value: 'Bienvenue, {{user}}!',
    },
    {
      keyId: invalidLoginKey.id,
      lang: 'en',
      value: 'Invalid credentials',
    },
    {
      keyId: invalidLoginKey.id,
      lang: 'es',
      value: 'Credenciales inválidas',
    },
  ]);

  console.log('✅ Migration UP complete.');
}

export async function down(knex: Knex): Promise<void> {
  console.log('🧨 Rolling back: Dropping translations and translationKeys tables...');
  await knex.schema.dropTableIfExists('translations');
  await knex.schema.dropTableIfExists('translationKeys');
  console.log('✅ Migration DOWN complete.');
}
