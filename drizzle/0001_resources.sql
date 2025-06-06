CREATE TABLE "resources" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"format" text NOT NULL,
	"data" "bytea" NOT NULL,
	CONSTRAINT "resources_resource_id_unique" UNIQUE("resource_id")
);
