// Attendance marking and history

function initAttendancePage() {
  populateClassSelect('classSelect');
  document.getElementById('classSelect').addEventListener('change', loadSubjectsForClass);
  document.getElementById('loadStudentsBtn').addEventListener('click', loadStudentsForAttendance);
  document.getElementById('saveAttendanceBtn').addEventListener('click', saveAttendance);
  const today = new Date();
  document.getElementById('attendanceDate').value = today.toISOString().split('T')[0];
}

async function loadSubjectsForClass() {
  const classId = parseInt(document.getElementById('classSelect').value, 10);
  const sel = document.getElementById('subjectSelect');
  if (!classId) { sel.innerHTML = ''; return; }
  const rows = await sb.select('subjects', { select: '*', class_id: `eq.${classId}` });
  sel.innerHTML = rows.map(r => `<option value="${r.id}">${r.subject_name}</option>`).join('');
}

async function loadStudentsForAttendance() {
  const classId = parseInt(document.getElementById('classSelect').value, 10);
  if (!classId) return alert('Select a class');
  const students = await sb.select('students', { select: '*', class_id: `eq.${classId}` });
  const tbody = document.getElementById('studentRows');
  tbody.innerHTML = students.map(s => `
    <tr data-id="${s.id}">
      <td>${s.roll}</td>
      <td>${s.name}</td>
      <td>
        <label class="switch">
          <input type="checkbox" class="status" checked />
          <span>Present</span>
        </label>
      </td>
    </tr>`).join('');
}

async function saveAttendance() {
  const classId = parseInt(document.getElementById('classSelect').value, 10);
  const subjectId = parseInt(document.getElementById('subjectSelect').value, 10);
  const dateVal = document.getElementById('attendanceDate').value;
  if (!classId || !subjectId || !dateVal) return alert('Select class, subject, and date');
  const timeVal = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const rows = Array.from(document.querySelectorAll('#studentRows tr')).map(tr => {
    const student_id = parseInt(tr.getAttribute('data-id'), 10);
    const status = tr.querySelector('.status').checked ? 'present' : 'absent';
    return { student_id, class_id: classId, subject_id: subjectId, status, date: dateVal, time: timeVal };
  });
  if (!rows.length) return alert('No students loaded');
  try {
    const btn = document.getElementById('saveAttendanceBtn');
    if (btn) btn.disabled = true;
    await sb.insert('attendance', rows);
    document.getElementById('dailySummary').textContent = `Saved ${rows.length} records for ${dateVal}`;
    if (btn) btn.disabled = false;
  } catch (e) { alert(e.message); }
}

// History page
function initHistoryPage() {
  populateClassSelect('historyClass', true);
  document.getElementById('loadHistoryBtn').addEventListener('click', loadHistory);
}

async function loadHistory() {
  const classId = document.getElementById('historyClass').value;
  const from = document.getElementById('historyFrom').value;
  const to = document.getElementById('historyTo').value;
  const params = { select: '*' };
  if (classId) params.class_id = `eq.${classId}`;
  let rows = await sb.select('attendance', params);
  if (from) rows = rows.filter(r => r.date >= from);
  if (to) rows = rows.filter(r => r.date <= to);
  const classes = await sb.select('classes', { select: '*' });
  const subjects = await sb.select('subjects', { select: '*' });
  const students = await sb.select('students', { select: '*' });
  const classById = Object.fromEntries(classes.map(c => [c.id, c.class_name]));
  const subjectById = Object.fromEntries(subjects.map(s => [s.id, s.subject_name]));
  const studentById = Object.fromEntries(students.map(s => [s.id, s.name]));
  const tbody = document.getElementById('historyRows');
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.date}</td>
      <td>${classById[r.class_id] || '-'}</td>
      <td>${subjectById[r.subject_id] || '-'}</td>
      <td>${studentById[r.student_id] || '-'}</td>
      <td>${r.status}</td>
    </tr>`).join('');
}

// Expose required functions
window.initAttendancePage = initAttendancePage;
window.initHistoryPage = initHistoryPage;
window.loadHistory = loadHistory;
window.saveAttendance = saveAttendance;

// Spec-required name aliases
async function markAttendance() { return saveAttendance(); }
async function fetchAttendanceHistory() { return loadHistory(); }
window.markAttendance = markAttendance;
window.fetchAttendanceHistory = fetchAttendanceHistory;
