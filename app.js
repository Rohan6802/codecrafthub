const express = require("express");
const fs = require("fs").promises;
const path = require("path");

// Create the Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// JSON storage file (placed in project root as per requirement)
const DATA_FILE = path.join(__dirname, "courses.json");

// Allowed statuses
const VALID_STATUSES = ["Not Started", "In Progress", "Completed"];

// --------------------
// Storage helpers
// --------------------

// Ensure the storage file exists. If not, create it with an empty array.
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    // File doesn't exist yet - create with an empty array
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

// Read all courses from the JSON file
async function readCourses() {
  await ensureDataFile();
  const content = await fs.readFile(DATA_FILE, "utf8");
  // In case the file has invalid JSON, catch in higher level (but we keep it simple here)
  return JSON.parse(content);
}

// Write the full courses array back to the JSON file
async function writeCourses(data) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// Generate a simple incremental ID (starts at 1)
function generateId(courses) {
  const max = courses.reduce((m, c) => Math.max(m, c.id || 0), 0);
  return max + 1;
}

// --------------------
// Validation helpers
// --------------------

// Validate that a date string is in YYYY-MM-DD format and represents a real date
function isValidDateStr(dateStr) {
  if (typeof dateStr !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  // Extra check to ensure the date components match (e.g., not 2023-02-31)
  const [y, m, day] = dateStr.split("-").map(Number);
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}

// Validate course payload for create/update
// requireAll = true -> all fields must be present (used for POST and PUT)
// requireAll = false -> allow partial payload (used for potential PATCH in future)
function validateCoursePayload(payload, requireAll = true) {
  const errors = [];

  if (!payload) {
    errors.push("Request body is required.");
    return { isValid: false, errors };
  }

  const { name, description, target_date, status } = payload;

  if (requireAll) {
    if (!name) errors.push("name is required.");
    if (!description) errors.push("description is required.");
    if (!target_date) errors.push("target_date is required.");
    if (!status) errors.push("status is required.");
  }

  // If provided, validate fields
  if (target_date !== undefined && !isValidDateStr(target_date)) {
    errors.push(
      "target_date must be in format YYYY-MM-DD and be a valid date.",
    );
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push("status must be one of: " + VALID_STATUSES.join(", "));
  }

  const isValid = errors.length === 0;
  return { isValid, errors };
}

// --------------------
// Routes
// --------------------

// GET /api/courses
// Retrieve all courses
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await readCourses();
    res.json(courses);
  } catch (err) {
    console.error("Error reading courses:", err);
    res.status(500).json({ error: "Failed to read courses." });
  }
});

// GET /api/courses/:id
// Retrieve a single course by ID
app.get("/api/courses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid course id." });
    }

    const courses = await readCourses();
    const course = courses.find((c) => c.id === id);
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }
    res.json(course);
  } catch (err) {
    console.error("Error fetching course:", err);
    res.status(500).json({ error: "Failed to fetch the course." });
  }
});

// POST /api/courses
// Create a new course
app.post("/api/courses", async (req, res) => {
  try {
    const { name, description, target_date, status } = req.body;

    // Validate required fields
    const { isValid, errors } = validateCoursePayload(
      { name, description, target_date, status },
      true,
    );
    if (!isValid) {
      return res
        .status(400)
        .json({ error: "Invalid course data.", details: errors });
    }

    const courses = await readCourses();
    const newCourse = {
      id: generateId(courses),
      name,
      description,
      target_date,
      status,
      created_at: new Date().toISOString(),
    };

    courses.push(newCourse);
    await writeCourses(courses);

    res.status(201).json(newCourse);
  } catch (err) {
    console.error("Error creating course:", err);
    res.status(500).json({ error: "Failed to create course." });
  }
});

// PUT /api/courses/:id
// Full update of a course (all fields required)
app.put("/api/courses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid course id." });
    }

    const { name, description, target_date, status } = req.body;

    // Validate required fields for full update
    const { isValid, errors } = validateCoursePayload(
      { name, description, target_date, status },
      true,
    );
    if (!isValid) {
      return res
        .status(400)
        .json({ error: "Invalid course data.", details: errors });
    }

    const courses = await readCourses();
    const idx = courses.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Course not found." });
    }

    // Preserve created_at from existing record
    const updatedCourse = {
      id,
      name,
      description,
      target_date,
      status,
      created_at: courses[idx].created_at,
    };

    courses[idx] = updatedCourse;
    await writeCourses(courses);

    res.json(updatedCourse);
  } catch (err) {
    console.error("Error updating course:", err);
    res.status(500).json({ error: "Failed to update course." });
  }
});

// DELETE /api/courses/:id
// Delete a course by ID
app.delete("/api/courses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid course id." });
    }

    const courses = await readCourses();
    const idx = courses.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Course not found." });
    }

    const [removed] = courses.splice(idx, 1);
    await writeCourses(courses);

    res.json(removed);
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ error: "Failed to delete course." });
  }
});

// --------------------
// Basic error handling middleware
// (Catches any unexpected errors in route handlers)
// --------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// --------------------
// Start the server
// --------------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`CodeCraftHub API is running on http://localhost:${PORT}`);
});
