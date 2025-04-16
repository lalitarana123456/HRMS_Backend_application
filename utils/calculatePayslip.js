//function to calculate payslip details..
const calculatePayslip = (hoursWorked, hourlyRate) =>{
    
    const grossSalary = hoursWorked * hourlyRate; //calculating gross salary
    const deductions = grossSalary *0.1 // assuning deduction will be 10%
    const netSalary = grossSalary - deductions; // Calculate net Salary

    return { grossSalary, deductions, netSalary }; // returning payslip details
};


//exporting the function
module.exports = {calculatePayslip};