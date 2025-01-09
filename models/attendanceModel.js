const pool = require('../db');

// Mark attendance
const markAttendance = async (studentId, date, status) => {
  const query = `
    INSERT INTO attendance (student_id, date, status)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [studentId, date, status];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get attendance records for a student
const getAttendanceByStudent = async (studentId) => {
  const query = `
    SELECT * FROM attendance
    WHERE student_id = $1
    ORDER BY date DESC;
  `;
  const result = await pool.query(query, [studentId]);
  return result.rows;
};

module.exports = { markAttendance, getAttendanceByStudent };

