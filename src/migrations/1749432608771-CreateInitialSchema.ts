import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1749432608771 implements MigrationInterface {
  name = 'CreateInitialSchema1749432608771';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    await queryRunner.query(
      `CREATE TABLE "trusted_contacts" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "phoneNumber" character varying NOT NULL, "notificationPreferences" jsonb, "user_id" uuid, CONSTRAINT "PK_f4ad8b84a27d23a63a5defc1b5f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "alert_locations" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "location" geometry(Point,4326) NOT NULL, "accuracy" double precision, "speed" double precision, "heading" double precision, "alertId" character varying NOT NULL, "alert_id" uuid, CONSTRAINT "PK_28deece5d821869480ce44ccbb8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_notifications_type_enum" AS ENUM('push', 'email', 'sms')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_notifications_status_enum" AS ENUM('pending', 'sent', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "alert_notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "alertId" uuid NOT NULL, "recipientId" character varying NOT NULL, "type" "public"."alert_notifications_type_enum" NOT NULL, "status" "public"."alert_notifications_status_enum" NOT NULL DEFAULT 'pending', "error" text, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4e0b86df24774d1111c4a02b9c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sos_alerts_status_enum" AS ENUM('active', 'resolved', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sos_alerts" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."sos_alerts_status_enum" NOT NULL DEFAULT 'active', "description" character varying, "userId" character varying NOT NULL, "startedAt" TIMESTAMP NOT NULL, "resolvedAt" TIMESTAMP, "expiredAt" TIMESTAMP, "user_id" uuid, CONSTRAINT "PK_5c6f2f5f40ab2224315e007b9c4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "phoneNumber" character varying, "fcmToken" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "isActive" boolean NOT NULL DEFAULT true, "password" character varying NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "trusted_contacts" ADD CONSTRAINT "FK_d9959475c1ebe97e902f8adc9c7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_locations" ADD CONSTRAINT "FK_73005cbb743314b82eeed659cbb" FOREIGN KEY ("alert_id") REFERENCES "sos_alerts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notifications" ADD CONSTRAINT "FK_8dee1fb736dd85159ece9dc76fd" FOREIGN KEY ("alertId") REFERENCES "sos_alerts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sos_alerts" ADD CONSTRAINT "FK_7a5209ca217c11fd1c5767d1450" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sos_alerts" DROP CONSTRAINT "FK_7a5209ca217c11fd1c5767d1450"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notifications" DROP CONSTRAINT "FK_8dee1fb736dd85159ece9dc76fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_locations" DROP CONSTRAINT "FK_73005cbb743314b82eeed659cbb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trusted_contacts" DROP CONSTRAINT "FK_d9959475c1ebe97e902f8adc9c7"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "sos_alerts"`);
    await queryRunner.query(`DROP TYPE "public"."sos_alerts_status_enum"`);
    await queryRunner.query(`DROP TABLE "alert_notifications"`);
    await queryRunner.query(
      `DROP TYPE "public"."alert_notifications_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."alert_notifications_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "alert_locations"`);
    await queryRunner.query(`DROP TABLE "trusted_contacts"`);

    await queryRunner.query(`DROP EXTENSION IF EXISTS postgis;`);
  }
}
