CREATE TABLE mtm_reach (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  motion_length_cm TEXT,
  r_a REAL,
  r_b REAL,
  r_c_r_d REAL,
  r_e REAL,
  mr_a_r_am REAL,
  mr_b_r_bm REAL,
  m_b REAL
);

CREATE TABLE mtm_move (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  motion_length_cm TEXT,
  m_a REAL,
  m_b_value REAL,
  m_c REAL,
  mm_b_m_bm REAL,
  m_b_small REAL
);

CREATE TABLE mtm_grasp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT,
  tmu REAL,
  description TEXT
);

CREATE TABLE mtm_release (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT,
  tmu REAL,
  description TEXT
);

CREATE TABLE mtm_eye_focus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT,
  tmu REAL,
  description TEXT
);

CREATE TABLE mtm_position (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT,
  tmu REAL,
  description TEXT
);

INSERT INTO mtm_reach
(motion_length_cm, r_a, r_b, r_c_r_d, r_e)
VALUES
('2', 2.0, 2.0, 2.0, 2.0),
('4', 3.4, 3.4, 5.1, 3.2),
('6', 4.5, 4.5, 6.5, 4.4),
('8', 5.5, 5.5, 7.5, 5.5),
('10', 6.1, 6.3, 8.4, 6.8),
('12', 6.4, 7.4, 9.1, 7.3),
('14', 6.8, 8.2, 9.7, 7.8),
('16', 7.1, 8.8, 10.3, 8.2),
('18', 7.5, 9.4, 10.8, 8.7),
('20', 7.8, 10.0, 11.4, 9.2),
('22', 8.1, 10.5, 11.9, 9.7),
('24', 8.5, 11.1, 12.5, 10.2),
('26', 8.8, 11.7, 13.0, 10.7),
('28', 9.2, 12.2, 13.6, 11.2),
('30', 9.5, 12.8, 14.1, 11.7),
('35', 10.4, 14.2, 15.5, 12.9),
('40', 11.3, 15.6, 16.8, 14.1),
('45', 12.1, 17.0, 18.2, 15.3),
('50', 13.0, 18.4, 19.6, 16.5),
('55', 13.9, 19.8, 20.9, 17.8),
('60', 14.7, 21.2, 22.3, 19.0),
('65', 15.6, 22.6, 23.6, 20.2),
('70', 16.5, 24.1, 25.0, 21.4),
('75', 17.3, 25.5, 26.4, 22.6),
('80', 18.2, 26.9, 27.7, 23.9);

INSERT INTO mtm_move
(motion_length_cm, m_a, m_b_value, m_c)
VALUES
('2', 2.0, 2.0, 2.0),
('4', 3.1, 4.0, 4.5),
('6', 4.1, 5.0, 5.8),
('8', 5.1, 5.9, 6.9),
('10', 6.0, 6.8, 7.9),
('12', 6.9, 7.7, 8.8),
('14', 7.7, 8.5, 9.8),
('16', 8.3, 9.2, 10.5),
('18', 9.0, 9.8, 11.1),
('20', 9.6, 10.5, 11.7),
('22', 10.2, 11.2, 12.4),
('24', 10.8, 11.8, 13.0),
('26', 11.5, 12.3, 13.7),
('28', 12.1, 12.8, 14.4),
('30', 12.7, 13.3, 15.1),
('35', 14.3, 14.5, 16.8),
('40', 15.8, 15.6, 18.5),
('45', 17.4, 16.8, 20.1),
('50', 19.0, 18.0, 21.8),
('55', 20.5, 19.2, 23.5),
('60', 22.1, 20.4, 25.2),
('65', 23.6, 21.6, 26.9),
('70', 25.2, 22.8, 28.6),
('75', 26.7, 24.0, 30.3),
('80', 28.3, 25.2, 32.0);

INSERT INTO mtm_grasp (code, tmu, description)
VALUES
('G1A', 2.0, 'Pick-up grasp'),
('G1B', 3.5, 'Small object'),
('G1C1', 7.3, 'Cylindrical object large'),
('G1C2', 8.7, 'Cylindrical object medium'),
('G1C3', 10.8, 'Cylindrical object small'),
('G2', 5.6, 'Regrasp'),
('G3', 5.6, 'Transfer grasp'),
('G4A', 7.3, 'Jumbled large object'),
('G4B', 9.1, 'Jumbled medium object'),
('G4C', 12.9, 'Jumbled small object'),
('G5', 0.0, 'Contact grasp');

INSERT INTO mtm_release (code, tmu, description)
VALUES
('RL1', 2.0, 'Normal release'),
('RL2', 0.0, 'Contact release');

INSERT INTO mtm_eye_focus (code, tmu, description)
VALUES
('EF', 7.3, 'Eye Focus');

INSERT INTO mtm_position (code, tmu, description)
VALUES
('P1SSE', 9.1, 'Position, class 1, symmetrical, easy to handle');
