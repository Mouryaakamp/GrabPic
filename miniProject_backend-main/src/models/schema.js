/**
 * Database schema in JS. Run via init-db (CREATE EXTENSION + these CREATE TABLEs).
 * Tables: users, events, event_members, photos, faces, search_logs.
 */

// Enable pgvector first, then run createTables in order (FKs depend on it).
function getCreateTablesSql() {
  return [
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK (role IN ('organizer','attendee')) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      join_code TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);`,
    `CREATE TABLE IF NOT EXISTS event_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(event_id, user_id)
    );`,
    `CREATE INDEX IF NOT EXISTS idx_event_members_event ON event_members(event_id);`,
    `CREATE TABLE IF NOT EXISTS photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      storage_key TEXT NOT NULL,
      processing_status TEXT CHECK (processing_status IN ('pending','processed','failed')) DEFAULT 'pending',
      uploaded_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE INDEX IF NOT EXISTS idx_photos_event ON photos(event_id);`,
    `CREATE TABLE IF NOT EXISTS faces (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      embedding vector(512) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE INDEX IF NOT EXISTS idx_faces_event ON faces(event_id);`,
    `CREATE TABLE IF NOT EXISTS search_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      event_id UUID NOT NULL REFERENCES events(id),
      created_at TIMESTAMP DEFAULT NOW()
    );`,
  ];
}

module.exports = { getCreateTablesSql };
