require("dotenv").config();

const db = require("./db");

console.log("Setting up Zenora database...");

db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    role_id INTEGER NOT NULL,

    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,

    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    phone TEXT,

    is_active INTEGER NOT NULL DEFAULT 1
      CHECK (is_active IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id)
      REFERENCES roles(id)
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER UNIQUE,

    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,

    email TEXT,
    phone TEXT,

    notes TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL UNIQUE,

    description TEXT,

    price REAL NOT NULL
      CHECK (price >= 0),

    duration_minutes INTEGER NOT NULL
      CHECK (duration_minutes > 0),

    image_url TEXT,

    is_active INTEGER NOT NULL DEFAULT 1
      CHECK (is_active IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL UNIQUE,

    description TEXT,

    price REAL NOT NULL
      CHECK (price >= 0),

    is_active INTEGER NOT NULL DEFAULT 1
      CHECK (is_active IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS package_services (
    package_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL DEFAULT 1
      CHECK (quantity > 0),

    PRIMARY KEY (package_id, service_id),

    FOREIGN KEY (package_id)
      REFERENCES packages(id)
      ON DELETE CASCADE,

    FOREIGN KEY (service_id)
      REFERENCES services(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS therapist_profiles (
    user_id INTEGER PRIMARY KEY,

    bio TEXT,
    specialties TEXT,

    is_available INTEGER NOT NULL DEFAULT 1
      CHECK (is_available IN (0, 1)),

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS therapist_services (
    therapist_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,

    PRIMARY KEY (therapist_id, service_id),

    FOREIGN KEY (therapist_id)
      REFERENCES therapist_profiles(user_id)
      ON DELETE CASCADE,

    FOREIGN KEY (service_id)
      REFERENCES services(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS therapist_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    therapist_id INTEGER NOT NULL,

    day_of_week INTEGER NOT NULL
      CHECK (day_of_week BETWEEN 0 AND 6),

    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,

    is_available INTEGER NOT NULL DEFAULT 1
      CHECK (is_available IN (0, 1)),

    FOREIGN KEY (therapist_id)
      REFERENCES therapist_profiles(user_id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    client_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    therapist_id INTEGER NOT NULL,

    appointment_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (
        status IN (
          'pending',
          'confirmed',
          'ongoing',
          'completed',
          'cancelled',
          'no-show'
        )
      ),

    booking_source TEXT NOT NULL DEFAULT 'online'
      CHECK (
        booking_source IN (
          'online',
          'walk-in',
          'receptionist'
        )
      ),

    special_request TEXT,

    check_in_at TEXT,
    check_out_at TEXT,

    created_by INTEGER,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id)
      REFERENCES clients(id),

    FOREIGN KEY (service_id)
      REFERENCES services(id),

    FOREIGN KEY (therapist_id)
      REFERENCES therapist_profiles(user_id),

    FOREIGN KEY (created_by)
      REFERENCES users(id)
      ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    appointment_id INTEGER NOT NULL,

    amount REAL NOT NULL
      CHECK (amount >= 0),

    payment_method TEXT NOT NULL
      DEFAULT 'cash',

    reference_number TEXT,

    recorded_by INTEGER NOT NULL,

    paid_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (appointment_id)
      REFERENCES appointments(id),

    FOREIGN KEY (recorded_by)
      REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS service_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    appointment_id INTEGER NOT NULL UNIQUE,
    therapist_id INTEGER NOT NULL,

    notes TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (appointment_id)
      REFERENCES appointments(id)
      ON DELETE CASCADE,

    FOREIGN KEY (therapist_id)
      REFERENCES therapist_profiles(user_id)
  );

  CREATE TABLE IF NOT EXISTS time_off_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    therapist_id INTEGER NOT NULL,

    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,

    reason TEXT,

    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (
        status IN (
          'pending',
          'approved',
          'declined'
        )
      ),

    reviewed_by INTEGER,
    reviewed_at TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (therapist_id)
      REFERENCES therapist_profiles(user_id),

    FOREIGN KEY (reviewed_by)
      REFERENCES users(id)
      ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    is_read INTEGER NOT NULL DEFAULT 0
      CHECK (is_read IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER,

    action TEXT NOT NULL,

    entity_type TEXT,
    entity_id INTEGER,

    details TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE SET NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS
    idx_appointment_exact_slot
  ON appointments (
    therapist_id,
    appointment_date,
    start_time
  )
  WHERE status NOT IN ('cancelled', 'no-show');

  CREATE INDEX IF NOT EXISTS
    idx_appointments_date
  ON appointments (appointment_date);

  CREATE INDEX IF NOT EXISTS
    idx_appointments_client
  ON appointments (client_id);

  CREATE INDEX IF NOT EXISTS
    idx_appointments_therapist
  ON appointments (therapist_id);

  CREATE INDEX IF NOT EXISTS
    idx_payments_appointment
  ON payments (appointment_id);
`);

console.log("Tables created successfully.");

/* =========================
   SEED ROLES
========================= */

const insertRole = db.prepare(`
  INSERT OR IGNORE INTO roles (name)
  VALUES (?)
`);

const roles = [
  "Guest",
  "Receptionist",
  "Massage Therapist",
  "Spa Manager",
];

for (const role of roles) {
  insertRole.run(role);
}

console.log("Roles seeded.");

/* =========================
   SEED SERVICES
========================= */

const insertService = db.prepare(`
  INSERT OR IGNORE INTO services (
    name,
    description,
    price,
    duration_minutes,
    image_url
  )
  VALUES (?, ?, ?, ?, ?)
`);

const services = [
  {
    name: "Body Massage",
    description:
      "A relaxing full-body massage designed to reduce muscle tension and promote overall wellness.",
    price: 650,
    duration: 60,
    image: "/img/service-1.jpg",
  },
  {
    name: "Stone Therapy",
    description:
      "A therapeutic treatment using heated stones to relax muscles and improve circulation.",
    price: 850,
    duration: 75,
    image: "/img/service-2.jpg",
  },
  {
    name: "Facial Therapy",
    description:
      "A facial treatment designed to cleanse, refresh, and improve the appearance of the skin.",
    price: 550,
    duration: 45,
    image: "/img/service-3.jpg",
  },
  {
    name: "Skin Care",
    description:
      "A complete skin care treatment focused on cleansing, hydration, and skin rejuvenation.",
    price: 600,
    duration: 60,
    image: "/img/service-4.jpg",
  },
  {
    name: "Steam Bath",
    description:
      "A relaxing steam session that helps ease tension and provides a calming wellness experience.",
    price: 400,
    duration: 30,
    image: "/img/service-5.jpg",
  },
  {
    name: "Face Masking",
    description:
      "A refreshing facial mask treatment that helps hydrate and revitalize the skin.",
    price: 350,
    duration: 30,
    image: "/img/service-6.jpg",
  },
];

for (const service of services) {
  insertService.run(
    service.name,
    service.description,
    service.price,
    service.duration,
    service.image
  );
}

console.log("Services seeded.");

/* =========================
   SEED PACKAGES
========================= */

const insertPackage = db.prepare(`
  INSERT OR IGNORE INTO packages (
    name,
    description,
    price
  )
  VALUES (?, ?, ?)
`);

const packages = [
  {
    name: "Relax Package",
    description:
      "A relaxing combination of body massage and steam bath.",
    price: 950,
  },
  {
    name: "Glow Package",
    description:
      "A refreshing combination of facial therapy and face masking.",
    price: 800,
  },
  {
    name: "Wellness Package",
    description:
      "A premium combination of stone therapy and skin care.",
    price: 1350,
  },
];

for (const packageItem of packages) {
  insertPackage.run(
    packageItem.name,
    packageItem.description,
    packageItem.price
  );
}

/* =========================
   CONNECT PACKAGE SERVICES
========================= */

const getService = db.prepare(`
  SELECT id
  FROM services
  WHERE name = ?
`);

const getPackage = db.prepare(`
  SELECT id
  FROM packages
  WHERE name = ?
`);

const insertPackageService = db.prepare(`
  INSERT OR IGNORE INTO package_services (
    package_id,
    service_id
  )
  VALUES (?, ?)
`);

const packageContents = {
  "Relax Package": [
    "Body Massage",
    "Steam Bath",
  ],

  "Glow Package": [
    "Facial Therapy",
    "Face Masking",
  ],

  "Wellness Package": [
    "Stone Therapy",
    "Skin Care",
  ],
};

for (const [packageName, serviceNames] of Object.entries(
  packageContents
)) {
  const packageRow = getPackage.get(packageName);

  if (!packageRow) {
    continue;
  }

  for (const serviceName of serviceNames) {
    const serviceRow = getService.get(serviceName);

    if (serviceRow) {
      insertPackageService.run(
        packageRow.id,
        serviceRow.id
      );
    }
  }
}

console.log("Packages seeded.");
console.log("Zenora database setup complete.");

db.close();