-- Fix incorrect image URLs in database
-- Run this script to fix URLs like "http:/.goozi.org/api/uploads/..." to "http://api.goozi.org/uploads/..."

-- Fix vocabularies.avatar
UPDATE vocabularies 
SET avatar = REPLACE(avatar, 'http:/.goozi.org/api', 'http://api.goozi.org')
WHERE avatar LIKE 'http:/.goozi.org%';

UPDATE vocabularies 
SET avatar = REPLACE(avatar, '.goozi.org/api', 'api.goozi.org')
WHERE avatar LIKE '%.goozi.org/api%';

-- Fix vocabulary_translations.audioUrl
UPDATE vocabulary_translations 
SET "audioUrl" = REPLACE("audioUrl", 'http:/.goozi.org/api', 'http://api.goozi.org')
WHERE "audioUrl" LIKE 'http:/.goozi.org%';

UPDATE vocabulary_translations 
SET "audioUrl" = REPLACE("audioUrl", '.goozi.org/api', 'api.goozi.org')
WHERE "audioUrl" LIKE '%.goozi.org/api%';

-- Fix home_settings.value (for images)
UPDATE home_settings 
SET value = REPLACE(value, 'http:/.goozi.org/api', 'http://api.goozi.org')
WHERE value LIKE 'http:/.goozi.org%' AND key IN ('picture', 'background_image');

UPDATE home_settings 
SET value = REPLACE(value, '.goozi.org/api', 'api.goozi.org')
WHERE value LIKE '%.goozi.org/api%' AND key IN ('picture', 'background_image');

-- Show results
SELECT 'vocabularies' as table_name, COUNT(*) as fixed_count 
FROM vocabularies 
WHERE avatar LIKE '%api.goozi.org%' OR avatar LIKE 'http://api.goozi.org%'
UNION ALL
SELECT 'vocabulary_translations', COUNT(*) 
FROM vocabulary_translations 
WHERE "audioUrl" LIKE '%api.goozi.org%' OR "audioUrl" LIKE 'http://api.goozi.org%'
UNION ALL
SELECT 'home_settings', COUNT(*) 
FROM home_settings 
WHERE value LIKE '%api.goozi.org%' OR value LIKE 'http://api.goozi.org%';
