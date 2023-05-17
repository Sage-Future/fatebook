-- This is an empty migration.
UPDATE "QuestionScore" SET "relativeScore" = NULL                    
WHERE "questionId" IN (
  SELECT id
  FROM "Question"
  WHERE (SELECT COUNT(*) FROM "QuestionScore" WHERE "questionId" = "Question"."id")=1
);
