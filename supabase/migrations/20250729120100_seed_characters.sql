-- Seed 18 Bible characters with sample quiz pool questions

INSERT INTO bible_characters (name, testament, personality_traits, key_scriptures, story_summary, life_application_template) VALUES
('Noah', 'old', '["obedient", "faithful"]', '["Genesis 6:9", "Genesis 7:5"]', 'Noah obeyed God and built the ark, saving his family from the flood.', 'God wants us to obey Him even when others do not understand.'),
('Abraham', 'old', '["faithful", "trusting"]', '["Genesis 12:1", "Hebrews 11:8"]', 'Abraham trusted God and left his home to follow God''s promise.', 'God calls us to trust Him with our future.'),
('Joseph', 'old', '["forgiving", "wise"]', '["Genesis 50:20", "Genesis 39:2"]', 'Joseph forgave his brothers and God used his hardships for good.', 'God can turn hard times into something good.'),
('Moses', 'old', '["humble", "courageous"]', '["Exodus 3:10", "Numbers 12:3"]', 'Moses led God''s people out of Egypt and received the Ten Commandments.', 'God uses ordinary people to do great things.'),
('Joshua', 'old', '["brave", "obedient"]', '["Joshua 1:9", "Joshua 24:15"]', 'Joshua led Israel into the Promised Land and chose to serve the Lord.', 'Be strong and courageous — God is with you.'),
('David', 'old', '["courageous", "worshipful"]', '["1 Samuel 17:45", "Psalm 23:1"]', 'David trusted God to defeat Goliath and became a king after God''s heart.', 'With God, we can face our giants.'),
('Esther', 'old', '["brave", "selfless"]', '["Esther 4:14", "Esther 8:6"]', 'Esther risked her life to save her people from harm.', 'God puts us where we are for a purpose.'),
('Daniel', 'old', '["obedient", "faithful"]', '["Daniel 1:8", "Daniel 6:10"]', 'Daniel stood for God in Babylon and was protected in the lions'' den.', 'Stand for what is right, even when it is hard.'),
('Ruth', 'old', '["loyal", "kind"]', '["Ruth 1:16", "Ruth 2:12"]', 'Ruth stayed loyal to Naomi and God blessed her faithfulness.', 'Loyalty and kindness please God.'),
('Elijah', 'old', '["bold", "prayerful"]', '["1 Kings 18:36", "James 5:17"]', 'Elijah prayed boldly and God sent fire from heaven on Mount Carmel.', 'Prayer is powerful — God hears us.'),
('Mary', 'new', '["faithful", "humble"]', '["Luke 1:38", "Luke 2:19"]', 'Mary trusted God and became the mother of Jesus.', 'Say yes to God with a willing heart.'),
('John the Baptist', 'new', '["bold", "obedient"]', '["Matthew 3:2", "John 1:29"]', 'John prepared the way for Jesus and baptized Him.', 'Point others to Jesus.'),
('Peter', 'new', '["bold", "restored"]', '["Matthew 16:16", "John 21:17"]', 'Peter declared Jesus as Lord and was restored after denying Him.', 'Jesus gives second chances.'),
('Martha', 'new', '["serving", "learning"]', '["Luke 10:41", "John 11:27"]', 'Martha served Jesus and learned to choose what matters most.', 'Balance serving with listening to Jesus.'),
('Zacchaeus', 'new', '["repentant", "generous"]', '["Luke 19:5", "Luke 19:8"]', 'Zacchaeus met Jesus and changed his ways, giving back to others.', 'Meeting Jesus changes our hearts.'),
('Timothy', 'new', '["faithful", "young"]', '["1 Timothy 4:12", "2 Timothy 1:5"]', 'Timothy served God faithfully even as a young person.', 'You are never too young to serve God.'),
('Lydia', 'new', '["hospitable", "faithful"]', '["Acts 16:14", "Acts 16:15"]', 'Lydia opened her home for believers after receiving Christ.', 'Use your home and gifts to bless others.'),
('Paul', 'new', '["transformed", "persevering"]', '["Acts 9:3", "Philippians 3:14"]', 'Paul met Jesus and spent his life sharing the gospel.', 'God can transform anyone for His purpose.')
ON CONFLICT (name) DO NOTHING;

-- Sample quiz pool for David (others follow same pattern in production seed)
INSERT INTO character_quiz_pool (character_id, question_text, question_type, options, correct_answer, sort_order)
SELECT id, 'Who did David defeat with God''s help?', 'multiple_choice', '["Goliath", "Pharaoh", "Nebuchadnezzar", "Herod"]', 'Goliath', 1
FROM bible_characters WHERE name = 'David';

INSERT INTO character_quiz_pool (character_id, question_text, question_type, options, correct_answer, sort_order)
SELECT id, 'David was known as a man after God''s own heart.', 'true_false', NULL, 'true', 2
FROM bible_characters WHERE name = 'David';

INSERT INTO character_quiz_pool (character_id, question_text, question_type, options, correct_answer, sort_order)
SELECT id, 'What quality did David show when facing Goliath?', 'short_answer', NULL, NULL, 3
FROM bible_characters WHERE name = 'David';
