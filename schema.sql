-- Tables in SQLite always include an auto-increment primary key named `rowid`,
-- so creating an AUTOINCREMENT column isn't required.  However, it's possible 
-- to override the name by specifying your own INTEGER PRIMARY KEY:
--
-- CREATE TABLE my_table (
--   id INTEGER PRIMARY KEY,
--   ... 
-- );
-- 
-- More information on how SQLite handles auto incrementing primary keys can be
-- found here: https://www.sqlitetutorial.net/sqlite-autoincrement/
--
-- Information about additional data types can be found in the documentation: 
-- https://sqlite.org/datatype3.html#affinity_name_examples
--
-- A full list of all documentation topics is available on the site as well and
-- gives insight into some of the DDL statements (e.g. `CREATE TABLE`) 
-- available: https://sqlite.org/doclist.html
--

CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  user VARCHAR(100) NOT NULL,
  otherUser VARCHAR(100) NULL DEFAULT NULL,
  message TEXT NULL DEFAULT NULL,
  date TEXT NOT NULL
);
