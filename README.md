CodeCraftHub API
CodeCraftHub is a simple Node.js + Express REST API to track personal learning goals (courses you want to learn). It stores data in a JSON file (courses.json) and exposes CRUD operations under /api/courses.

Lightweight, beginner-friendly REST API
JSON file storage (no database)
Auto-generated course IDs (start at 1)
Validation for required fields and status values
Automatic creation of the storage file if missing
Features
Create a new course (POST /api/courses)
Read all courses (GET /api/courses)
Read a specific course (GET /api/courses/{id})
Update a course completely (PUT /api/courses/{id})
Delete a course (DELETE /api/courses/{id})
Data fields per course:
id: auto-generated starting from 1
name: string (required)
description: string (required)
target_date: string in format YYYY-MM-DD (required)
status: one of "Not Started", "In Progress", "Completed" (required)
created_at: timestamp when the course was created (auto-generated)
Installation
Ensure Node.js is installed on your system.
Create a project directory and navigate into it.
Place your code files (app.js, package.json, etc.) in the directory.
Install dependencies:
npm install
Start the server:
npm start
The server runs on port 5000 (http://localhost:5000).
Note: The app will automatically create courses.json in the project root if it doesn’t exist.

How to run the application
Start the server:
npm start
Open in a browser or use curl/Postman to interact with the API:
http://localhost:5000/api/courses
API Endpoint Documentation (examples)
Base URL: http://localhost:5000/api/courses

Create a new course
POST /api/courses
Body (JSON): { "name": "Learn Node.js", "description": "Basics of Node.js and Express", "target_date": "2026-05-30", "status": "Not Started" }
Response: 201 Created with the new course object (includes id and created_at)
Get all courses
GET /api/courses
Response: 200 OK with an array of course objects
Get a specific course
GET /api/courses/{id}
Example: GET /api/courses/1
Response: 200 OK with the course object, or 404 if not found
Update a course (full update)
PUT /api/courses/{id}
Body (JSON) - all fields required: { "name": "Learn Node.js", "description": "Updated description", "target_date": "2026-06-15", "status": "In Progress" }
Response: 200 OK with the updated course, or 400/404 on error
Delete a course
DELETE /api/courses/{id}
Response: 200 OK with the deleted course object, or 404 if not found
Notes on validation and errors:

If required fields are missing on create/update, you’ll receive a 400 with details.
Invalid status values (anything other than Not Started, In Progress, Completed) will yield a 400.
If the course is not found for GET/PUT/DELETE, you’ll receive a 404.
If there are file read/write errors, the API responds with a 500 and a descriptive message.
Example curl commands:

List all courses curl http://localhost:5000/api/courses

Create a course curl -X POST -H "Content-Type: application/json"
-d '{"name":"React Basics","description":"Learn React fundamentals","target_date":"2026-07-01","status":"Not Started"}'
http://localhost:5000/api/courses

Get a course curl http://localhost:5000/api/courses/1

Update a course curl -X PUT -H "Content-Type: application/json"
-d '{"name":"React Basics","description":"Updated description","target_date":"2026-07-15","status":"In Progress"}'
http://localhost:5000/api/courses/1

Delete a course curl -X DELETE http://localhost:5000/api/courses/1

Troubleshooting
Server won’t start or port is in use

Ensure nothing else is running on port 5000.
If needed, modify app.js to use a different port (e.g., 3000) and run again.
Express module not found

Run npm install to install dependencies.
File read/write errors with courses.json

Ensure the project directory is writable.
If the file becomes corrupted, delete or restore it; the app will recreate an empty array [].
Invalid or missing fields

The API returns 400 with details. Check you’re sending:
name: string
description: string
target_date: YYYY-MM-DD (valid date)
status: one of Not Started, In Progress, Completed
Invalid date format

target_date must be in format YYYY-MM-DD and a valid calendar date.
Unexpected server errors

Check the server logs/console for stack traces and fix accordingly.
Project structure (recommended)
app.js (main Express server and routes)
courses.json (JSON storage; created automatically if missing)
package.json (dependencies and start script)
README.md (this file)
