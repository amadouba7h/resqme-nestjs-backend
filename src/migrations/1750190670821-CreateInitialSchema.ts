import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1750190670821 implements MigrationInterface {
  name = 'CreateInitialSchema1750190670821';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    await queryRunner.query(
      `CREATE TABLE "trusted_contacts" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "phone_number" character varying, "notification_preferences" jsonb, "user_id" uuid NOT NULL, CONSTRAINT "PK_f4ad8b84a27d23a63a5defc1b5f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "alert_locations" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "location" geometry(Point,4326) NOT NULL, "accuracy" double precision, "speed" double precision, "heading" double precision, "alert_id" uuid NOT NULL, CONSTRAINT "PK_28deece5d821869480ce44ccbb8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_notifications_type_enum" AS ENUM('push', 'email', 'sms')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_notifications_status_enum" AS ENUM('pending', 'sent', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "alert_notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "alert_id" uuid NOT NULL, "recipient_id" uuid NOT NULL, "type" "public"."alert_notifications_type_enum" NOT NULL, "status" "public"."alert_notifications_status_enum" NOT NULL DEFAULT 'pending', "error" text, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4e0b86df24774d1111c4a02b9c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "alert_ratings" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "alert_id" uuid NOT NULL, "trusted_contact_id" uuid, "rating" integer NOT NULL, "comment" text, CONSTRAINT "PK_96367cf91784ee96dfbc3c68327" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sos_alerts_status_enum" AS ENUM('active', 'resolved', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sos_alerts_resolution_reason_enum" AS ENUM('situation_resolved', 'false_alarm')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sos_alerts" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."sos_alerts_status_enum" NOT NULL DEFAULT 'active', "description" character varying, "user_id" uuid NOT NULL, "started_at" TIMESTAMP NOT NULL, "resolved_at" TIMESTAMP, "resolution_reason" "public"."sos_alerts_resolution_reason_enum", "expired_at" TIMESTAMP, CONSTRAINT "PK_5c6f2f5f40ab2224315e007b9c4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_provider_enum" AS ENUM('local', 'google', 'github', 'facebook')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "phone_number" character varying, "fcm_token" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "provider" "public"."users_provider_enum" NOT NULL DEFAULT 'local', "provider_id" character varying, "is_active" boolean NOT NULL DEFAULT true, "password" character varying, "refresh_token" text, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "trusted_contacts" ADD CONSTRAINT "FK_d9959475c1ebe97e902f8adc9c7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_locations" ADD CONSTRAINT "FK_73005cbb743314b82eeed659cbb" FOREIGN KEY ("alert_id") REFERENCES "sos_alerts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notifications" ADD CONSTRAINT "FK_4efd9357c55ffe0a97ecfacd020" FOREIGN KEY ("alert_id") REFERENCES "sos_alerts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_ratings" ADD CONSTRAINT "FK_4ea537aa97f2f51487bd02c66c6" FOREIGN KEY ("alert_id") REFERENCES "sos_alerts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_ratings" ADD CONSTRAINT "FK_824a06fd0b31479da9093d973b5" FOREIGN KEY ("trusted_contact_id") REFERENCES "trusted_contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "alert_ratings" DROP CONSTRAINT "FK_824a06fd0b31479da9093d973b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_ratings" DROP CONSTRAINT "FK_4ea537aa97f2f51487bd02c66c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notifications" DROP CONSTRAINT "FK_4efd9357c55ffe0a97ecfacd020"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_locations" DROP CONSTRAINT "FK_73005cbb743314b82eeed659cbb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trusted_contacts" DROP CONSTRAINT "FK_d9959475c1ebe97e902f8adc9c7"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "sos_alerts"`);
    await queryRunner.query(
      `DROP TYPE "public"."sos_alerts_resolution_reason_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."sos_alerts_status_enum"`);
    await queryRunner.query(`DROP TABLE "alert_ratings"`);
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
