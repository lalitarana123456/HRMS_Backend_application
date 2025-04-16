const ExcelJS = require('exceljs');
const path = require('path');

exports.generateExcel = async (attendances) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  worksheet.columns = [
    { header: 'Employee ID', key: 'employeeId', width: 20 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Check-In', key: 'checkIn', width: 20 },
    { header: 'Check-Out', key: 'checkOut', width: 20 },
    { header: 'Breaks', key: 'breaks', width: 30 },
  ];

  attendances.forEach((attendance) => {
    worksheet.addRow({
      employeeId: attendance.employeeId,
      date: attendance.date.toISOString().split('T')[0],
      checkIn: attendance.checkIn ? attendance.checkIn.toISOString() : 'N/A',
      checkOut: attendance.checkOut ? attendance.checkOut.toISOString() : 'N/A',
      breaks: attendance.breaks
        .map((b) => `Start: ${b.start}, End: ${b.end}`)
        .join('; '),
    });
  });

  const filePath = path.join(__dirname, '..', 'AttendanceReport.xlsx');
  await workbook.xlsx.writeFile(filePath);
  return filePath;
};
