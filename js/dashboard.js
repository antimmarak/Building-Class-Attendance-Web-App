async function loadDashboard() {
  try {
    const [students, classes, attendance] = await Promise.all([
      sb.select('students'),
      sb.select('classes'),
      sb.select('attendance')
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const todaysAttendance = attendance.filter(a => a.date === today);

    document.getElementById('totalStaff').textContent = students.length;
    document.getElementById('presentToday').textContent = todaysAttendance.filter(a => a.status === 'present').length;
    document.getElementById('absentToday').textContent = todaysAttendance.filter(a => a.status === 'absent').length;
    document.getElementById('onLeave').textContent = todaysAttendance.filter(a => a.status === 'leave').length;

    const user = sb.auth.user();
    if (user) {
      const userInitial = user.email.charAt(0).toUpperCase();
      document.getElementById('userAvatar').textContent = userInitial;
    }

    const attendanceRecords = document.getElementById('attendanceRecords');
    if (todaysAttendance.length === 0) {
      attendanceRecords.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px;">No attendance records for today</td></tr>`;
      return;
    }

    attendanceRecords.innerHTML = todaysAttendance.map(a => {
      const student = students.find(s => s.id === a.student_id);
      const studentName = student?.student_name || 'Unknown';
      const studentClass = classes.find(c => c.id === student?.class_id)?.class_name || 'N/A';
      const statusClass = a.status === 'present' ? 'text-green' : (a.status === 'absent' ? 'text-red' : 'text-yellow');

      return `
        <tr>
          <td>${studentName}</td>
          <td>${a.student_id}</td>
          <td>${studentClass}</td>
          <td><span class="status ${statusClass}">${a.status}</span></td>
          <td>${a.time}</td>
        </tr>
      `;
    }).join('');

  } catch (e) {
    console.error('Failed to load dashboard data:', e);
    alert('Could not load dashboard data. Check your connection and Supabase config.');
  }
}
