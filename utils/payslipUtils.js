
//calculating daily pay(assuming fixed salary of 30000/month)
exports.calculateDailyPay = (monthlySalary) => monthlySalary/30;

//calculating deduction for unapproved or excess medical leave
exports.calculateLeaveDeductions = (approved, leaveType, medicalLeaveTaken) =>{

    if(leaveType === 'Medical Leave' && approved && medicalLeaveTaken <= 2){
        return 0; // no deduction for 2 medical leave
    }

    return 1000; //deduction full day salary for other leaves
};


//calculating half day pay
exports.calculateHalfDayPay = (dailyPay) => dailyPay/2;

