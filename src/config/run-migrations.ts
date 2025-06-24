import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Charger les variables d'environnement
config();

// Configuration de la connexion à la base de données
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'resqme',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  synchronize: false,
  ssl: process.env.DB_USE_SSL === 'true',
  namingStrategy: new SnakeNamingStrategy(),
  extra: {
    // Enable PostGIS extension
    extensions: ['postgis'],
  },
});

// Fonction principale pour exécuter les migrations
async function runMigrations() {
  try {
    console.log('Initializing connection to database...');
    await dataSource.initialize();

    console.log('Starting database migrations...');
    const migrations = await dataSource.runMigrations();

    console.log(`Successfully ran ${migrations.length} migrations:`);
    migrations.forEach((migration) => console.log(`- ${migration.name}`));

    await dataSource.destroy();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Exécuter les migrations
runMigrations()
  .then(() => {
    console.log('Migrations completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
  });
