CREATE TABLE IF NOT EXISTS raids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  summary TEXT,
  date TEXT,
  location TEXT,
  lat REAL,
  lon REAL,
  url TEXT
);