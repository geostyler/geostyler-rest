CREATE TABLE "styles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"style_id" text NOT NULL,
	"title" text,
	"style" text,
	"metadata" jsonb,
	"format" text,
	CONSTRAINT "styles_style_id_unique" UNIQUE("style_id")
);
