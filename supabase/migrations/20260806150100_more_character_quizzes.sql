-- Extra quiz questions for more characters (safe to re-run)

INSERT INTO character_quiz_pool (character_id, question_text, question_type, options, correct_answer, sort_order)
SELECT id, 'What did Noah build when God warned him about the flood?', 'multiple_choice',
  '["An ark", "A tower", "A temple", "A palace"]', 'An ark', 1
FROM bible_characters WHERE name = 'Noah'
AND NOT EXISTS (
  SELECT 1 FROM character_quiz_pool q WHERE q.character_id = bible_characters.id AND q.sort_order = 1
);

INSERT INTO character_quiz_pool (character_id, question_text, question_type, options, correct_answer, sort_order)
SELECT id, 'Noah obeyed God even when others did not understand.', 'true_false', NULL, 'true', 2
FROM bible_characters WHERE name = 'Noah'
AND NOT EXISTS (
  SELECT 1 FROM character_quiz_pool q WHERE q.character_id = bible_characters.id AND q.sort_order = 2
);

INSERT INTO character_quiz_pool (character_id, question_text, question_type, options, correct_answer, sort_order)
SELECT id, 'What did Esther risk to help her people?', 'multiple_choice',
  '["Her life", "Her crown only", "Her wealth only", "Nothing"]', 'Her life', 1
FROM bible_characters WHERE name = 'Esther'
AND NOT EXISTS (
  SELECT 1 FROM character_quiz_pool q WHERE q.character_id = bible_characters.id AND q.sort_order = 1
);

INSERT INTO character_quiz_pool (character_id, question_text, question_type, options, correct_answer, sort_order)
SELECT id, 'Daniel prayed to God even in Babylon.', 'true_false', NULL, 'true', 1
FROM bible_characters WHERE name = 'Daniel'
AND NOT EXISTS (
  SELECT 1 FROM character_quiz_pool q WHERE q.character_id = bible_characters.id AND q.sort_order = 1
);

INSERT INTO character_quiz_pool (character_id, question_text, question_type, options, correct_answer, sort_order)
SELECT id, 'Who led God''s people out of Egypt?', 'multiple_choice',
  '["Moses", "David", "Jonah", "Paul"]', 'Moses', 1
FROM bible_characters WHERE name = 'Moses'
AND NOT EXISTS (
  SELECT 1 FROM character_quiz_pool q WHERE q.character_id = bible_characters.id AND q.sort_order = 1
);

INSERT INTO character_quiz_pool (character_id, question_text, question_type, options, correct_answer, sort_order)
SELECT id, 'Mary trusted God and said yes to His plan.', 'true_false', NULL, 'true', 1
FROM bible_characters WHERE name = 'Mary'
AND NOT EXISTS (
  SELECT 1 FROM character_quiz_pool q WHERE q.character_id = bible_characters.id AND q.sort_order = 1
);

INSERT INTO character_quiz_pool (character_id, question_text, question_type, options, correct_answer, sort_order)
SELECT id, 'What did Peter do after denying Jesus?', 'multiple_choice',
  '["Was restored by Jesus", "Left forever", "Became a king", "Built an ark"]', 'Was restored by Jesus', 1
FROM bible_characters WHERE name = 'Peter'
AND NOT EXISTS (
  SELECT 1 FROM character_quiz_pool q WHERE q.character_id = bible_characters.id AND q.sort_order = 1
);

INSERT INTO character_quiz_pool (character_id, question_text, question_type, options, correct_answer, sort_order)
SELECT id, 'Paul''s life was transformed after meeting Jesus.', 'true_false', NULL, 'true', 1
FROM bible_characters WHERE name = 'Paul'
AND NOT EXISTS (
  SELECT 1 FROM character_quiz_pool q WHERE q.character_id = bible_characters.id AND q.sort_order = 1
);
