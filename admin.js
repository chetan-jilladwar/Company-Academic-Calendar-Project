const apiURL = "https://script.google.com/macros/s/AKfycbzsMIwmP48TRS4eIgDHNPzgQiQysQPQdQClLVshJ2qBqWJ5qgbDTpp0dUwPv6JzfMPVUA/exec";


let holidays = {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allEmployees = [];



// --- NEW HELPER: Safely extracts the YYYY-MM-DD date part ---
function getCleanDate(dateInput) {
  if (!dateInput) return '';
  // If already yyyy-mm-dd string
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return String(dateInput).substring(0, 10);
    }
    // Use LOCAL getters to avoid UTC shift issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return String(dateInput).substring(0, 10);
  }
}




// --- Modal calendar nav vars
let modalCurMonth = new Date().getMonth();
let modalCurYear = new Date().getFullYear();
let currentDetailEmp = null;


window.onload = () => {
  if (localStorage.getItem("role") !== "admin") logout();

  loadAllData();

  // FIX: Corrected element ID from 'prevMoznth' to 'prevMonth'
  document.getElementById('prevMonth').onclick = () => { 
    currentMonth = (currentMonth === 0 ? 11 : currentMonth - 1);
    if(currentMonth === 11) currentYear--;
    renderCalendar(currentMonth, currentYear);
  };

  document.getElementById('nextMonth').onclick = () => {
    currentMonth = (currentMonth === 11 ? 0 : currentMonth + 1);
    if(currentMonth === 0) currentYear++;
    renderCalendar(currentMonth, currentYear);
  };
};


function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}


function formatDate(dateInput) {
  let dt = new Date(dateInput);
  let year = dt.getFullYear();
  let month = String(dt.getMonth() + 1).padStart(2, '0');
  let day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


function getData(callback) {
  fetch(`${apiURL}?action=getData`)
    .then(res => res.json())
    .then(callback)
    .catch(() => callback({ holidays: [], weekoffs: [], employees: [] }));
}


function loadAllData() {
  getData(data => {
    holidays = {};
   for(let i=1; i < data.holidays.length; i++) {
      // Use getCleanDate here!
      let cleanDate = getCleanDate(data.holidays[i][0]); 
      holidays[cleanDate] = { // FIX
        name: data.holidays[i][1],
        type: data.holidays[i][2] || "-"
      };
    }
    allEmployees = data.employees.slice(1); // Assuming first row is header
    renderCalendar(currentMonth, currentYear);
    renderEvents(data);
    loadLeaveRequests();
    renderEmployeeList();
  });
}


// Add Employee - MODIFIED
function addEmployee() {
  // 1. Get the button and details
  const btn = event.target;
  const originalText = btn.textContent;
  
  let empid = document.getElementById("empid").value;
  let name = document.getElementById("empname").value;
  let email = document.getElementById("empemail").value;
  let dept = document.getElementById("empdept").value;
  let weekoff = document.getElementById("empweekoff").value;
  let username = document.getElementById("empusername").value;
  let password = document.getElementById("emppassword").value;

  // Simple validation (ensure fields are filled)
  if (!empid || !name || !email || !dept || !weekoff || !username || !password) {
    alert("Please fill all employee details.");
    return;
  }

  // 2. Show Loader
  btn.textContent = "Loading...";
  btn.disabled = true;

  fetch(`${apiURL}?action=addEmployee&employeeid=${empid}&name=${name}&email=${email}&department=${dept}&weekoff=${weekoff}&username=${username}&password=${password}`)
    .then(res => res.json()) // Assuming the API returns a success object
    .then(json => {
      if (json.success) {
        alert("Employee added successfully! ✅");
        document.querySelector('#add-employee form').reset(); // Clear form on success
      } else {
        alert("Failed to add employee: " + (json.message || "Unknown error ❌"));
      }
      loadAllData();
    })
    .catch(err => {
      alert("Network error: " + err.message + " ❌");
      loadAllData(); // Reload data even on network error
    })
    .finally(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    });
}


// Add Holiday - MODIFIED
function addHoliday() {
  const btn = event.target;
  const originalText = btn.textContent;

  let date = document.getElementById("holidaydate").value;
  let name = document.getElementById("holidayname").value;
  let type = document.getElementById("holidaytype").value;
  
  if (!date || !name || !type) {
    alert("Please fill all holiday details.");
    return;
  }

  btn.textContent = "Loading...";
  btn.disabled = true;

  fetch(`${apiURL}?action=addHoliday&date=${encodeURIComponent(date)}&name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`)
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        alert("Holiday added successfully! 🎉");
        document.querySelector('#add-holiday form').reset();
      } else {
        alert("Failed to add holiday: " + (json.message || "Unknown error ❌"));
      }
      loadAllData();
    })
    .catch(err => {
      alert("Network error: " + err.message + " ❌");
      loadAllData();
    })
    .finally(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    });
}


// Add Custom WeekOff - MODIFIED
function addWeekOff() {
  const btn = event.target;
  const originalText = btn.textContent;

  let date = document.getElementById("cweekoffdate").value;
  let name = document.getElementById("cweekoffname").value;
  let reason = document.getElementById("cweekoffreason").value;

  if (!date || !name || !reason) {
    alert("Please fill all custom weekoff details.");
    return;
  }

  btn.textContent = "Loading...";
  btn.disabled = true;

  fetch(`${apiURL}?action=addWeekOff&date=${date}&name=${name}&reason=${reason}`)
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        alert("Custom WeekOff added successfully! 📅");
        document.querySelector('#add-weekoff form').reset();
      } else {
        alert("Failed to add custom weekoff: " + (json.message || "Unknown error ❌"));
      }
      loadAllData();
    })
    .catch(err => {
      alert("Network error: " + err.message + " ❌");
      loadAllData();
    })
    .finally(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    });
}


// ------------ Calendar Render ----------------
function renderCalendar(month = currentMonth, year = currentYear) {
  const calendarDays = document.getElementById('calendarDays');
  const monthYear = document.getElementById('monthYear');
  calendarDays.innerHTML = '';
  const date = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = date.getDay();
  monthYear.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });

  for(let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.classList.add('inactive');
    calendarDays.appendChild(blank);
  }
  for(let d = 1; d <= daysInMonth; d++) {
  const cell = document.createElement('div');
  const cellDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // Basic date (always show)
  let cellContent = `<div>${d}</div>`;

  // If it is a holiday, show type (e.g. PH, CH, BDAY, WO) below date
  if(holidays[cellDate]) {
    cell.classList.add('holiday');
    cellContent += `<div class="holiday-type">${holidays[cellDate].type}</div>`;
    cell.setAttribute('title', `${holidays[cellDate].name} (${holidays[cellDate].type})`);
  }

  // Today highlight
  if(year === new Date().getFullYear() && month === new Date().getMonth() && d === new Date().getDate()) {
    cell.classList.add('today');
  }

  cell.innerHTML = cellContent;
  calendarDays.appendChild(cell);
}

}


// ------------ Events Render - MODIFIED FOR BUTTON ACTIONS -----------------
function renderEvents(data) {
  let rows = [];
  for(let i=1; i<data.holidays.length; i++) {
    // 👈 FIX 1: Get clean date for holiday
    let cleanDate = getCleanDate(data.holidays[i][0]);
    let eventName = data.holidays[i][1];
    let type = data.holidays[i][2] || "-";
    
    rows.push(`<tr>
      <td>${cleanDate}</td>
      <td>${eventName}</td>
      <td>${type}</td>
      <td><button id='delH_${i}' onclick="deleteEvent(event, '${encodeURIComponent(cleanDate)}','${encodeURIComponent(eventName)}')">Delete</button></td>
    </tr>`);
  }
  for(let i=1; i<data.weekoffs.length; i++) {
    // 👈 FIX 2: Get clean date for custom week-off
    let cleanDate = getCleanDate(data.weekoffs[i][0]);
    
    rows.push(`<tr>
      <td>${cleanDate}</td>
      <td>${data.weekoffs[i][1]}</td>
      <td>WO</td>
      <td><button id='delW_${i}' onclick="deleteEventW(event, '${encodeURIComponent(cleanDate)}','${encodeURIComponent(data.weekoffs[i][1])}')">Delete</button></td>
    </tr>`);
  }
  document.getElementById("events").innerHTML =
    "<tr><th>Date</th><th>Event</th><th>Type</th><th>Action</th></tr>" + rows.join('');
}

// Delete Holiday - MODIFIED
function deleteEvent(e, date, name) {
  const btn = e.target;
  const originalText = btn.textContent;
  
  if(!confirm("Are you sure you want to delete this event?")) return;

  btn.textContent = "Deleting...";
  btn.disabled = true;

  fetch(`${apiURL}?action=deleteHoliday&date=${date}&name=${name}`)
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        alert("Holiday deleted successfully! ✅");
        loadAllData();
      }
      else {
        alert("Failed to delete event: " + (json.message || "Unknown error ❌"));
        // Only restore button if loadAllData() wasn't called (i.e., on error)
        btn.textContent = originalText;
        btn.disabled = false;
      }
    })
    .catch(() => {
      alert("Error deleting event. ❌");
      btn.textContent = originalText;
      btn.disabled = false;
    });
}


// Delete Custom WeekOff - MODIFIED
function deleteEventW(e, date, name) {
  const btn = e.target;
  const originalText = btn.textContent;
  
  if(!confirm("Are you sure you want to delete this custom weekoff?")) return;
  
  btn.textContent = "Deleting...";
  btn.disabled = true;

  fetch(`${apiURL}?action=deleteWeekOff&date=${date}&name=${name}`)
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        alert("Custom WeekOff deleted successfully! ✅");
        loadAllData();
      }
      else {
        alert("Failed to delete weekoff: " + (json.message || "Unknown error ❌"));
        // Only restore button if loadAllData() wasn't called (i.e., on error)
        btn.textContent = originalText;
        btn.disabled = false;
      }
    })
    .catch(() => {
      alert("Error deleting weekoff. ❌");
      btn.textContent = originalText;
      btn.disabled = false;
    });
}


// ------------ Leave Requests Render - MODIFIED FOR BUTTON ACTIONS -------------
// ------------ Leave Requests Render - MODIFIED FOR BUTTON ACTIONS -------------
function loadLeaveRequests() {
  fetch(`${apiURL}?action=getAllLeaves`)
    .then(res => res.json())
    .then(data => {
      let rows = data.map(leave => {
        const leaveDate = leave[4].substring(0, 10);
        // Action buttons still use the ID (leave[0]), but we won't display it.
        const actionButtons = leave[5] == "Pending"
          ? `<button onclick="approveLeave(event, '${leave[0]}','${leaveDate}')">Approve</button>
             <button onclick="rejectLeave(event, '${leave[0]}','${leaveDate}')">Reject</button>`
          : `<button onclick="undoLeave(event, '${leave[0]}','${leaveDate}')">Undo</button>`;
        
        // UPDATED: Removed the cells for ID (leave[0]) and Email (leave[2])
        return `<tr>
          <td>${leave[1]}</td>
          <td>${leave[3]}</td>
          <td>${leaveDate}</td>
          <td>${leave[5]}</td>
          <td>${actionButtons}</td>
        </tr>`;
      }).join('');
      
      // UPDATED: Removed the headers for "ID" and "Email"
      document.getElementById("admin-leave-requests").innerHTML =
        "<tr><th>Name</th><th>Type</th><th>Date</th><th>Status</th><th>Action</th></tr>" + rows;
    });
}
// Helper function to handle button loading state
function handleLeaveAction(e, action, id, date, successMsg) {
  const btn = e.target;
  const originalText = btn.textContent;
  
  // Disable all buttons in the same cell while one is processing
  const actionCell = btn.parentElement;
  Array.from(actionCell.children).forEach(b => b.disabled = true);
  btn.textContent = "Loading...";

  fetch(`${apiURL}?action=${action}Leave&id=${id}&date=${date}`)
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        alert(successMsg + " ✅");
        loadLeaveRequests();
      } else {
        alert(`Operation failed: ${json.message || "Unknown error"} ❌`);
        loadLeaveRequests(); // Still refresh in case of partial update
      }
    })
    .catch(err => {
      alert("Network error: " + err.message + " ❌");
      // Restore buttons manually on network error since loadLeaveRequests won't run
      Array.from(actionCell.children).forEach(b => b.disabled = false);
      btn.textContent = originalText;
    });
}


// Approve Leave - MODIFIED
function approveLeave(e, id, date) {
  handleLeaveAction(e, 'approve', id, date, "Leave approved successfully");
}


// Reject Leave - MODIFIED
function rejectLeave(e, id, date) {
  handleLeaveAction(e, 'reject', id, date, "Leave rejected successfully");
}


// Undo Leave - MODIFIED
function undoLeave(e, id, date) {
  handleLeaveAction(e, 'undo', id, date, "Leave status reverted successfully");
}


// ----- New: Employee list with search and modal details -------


function renderEmployeeList() {
  const empList = document.getElementById("employeeList");
  empList.innerHTML = "";
  allEmployees.forEach(emp => {
    let li = document.createElement("li");
    li.textContent = `${emp[1]} (${emp[0]})`; // Name (ID)
    li.style.cursor = "pointer";
    li.onclick = () => showEmployeeDetails(emp);
    empList.appendChild(li);
  });
}


function filterEmployees() {
  let searchVal = document.getElementById("empSearch").value.toLowerCase();
  const empList = document.getElementById("employeeList");
  empList.innerHTML = "";
  allEmployees.filter(emp => 
    emp[1].toLowerCase().includes(searchVal) || emp[0].toLowerCase().includes(searchVal)
  ).forEach(emp => {
    let li = document.createElement("li");
    li.textContent = `${emp[1]} (${emp[0]})`;
    li.style.cursor = "pointer";
    li.onclick = () => showEmployeeDetails(emp);
    empList.appendChild(li);
  });
}


// --- UPDATED MODAL LOGIC FOR DYNAMIC MONTH/YEAR WITH NAVIGATION ---

function showEmployeeDetails(emp) {
  currentDetailEmp = emp;
  modalCurMonth = new Date().getMonth();
  modalCurYear = new Date().getFullYear();

  document.getElementById("employeeModal").style.display = "flex";
  document.getElementById("modalEmpName").textContent = emp[1];
  document.getElementById("modalEmpId").textContent = emp[0];
  document.getElementById("modalEmpEmail").textContent = emp[2];
  document.getElementById("modalEmpDept").textContent = emp[3];
  document.getElementById("modalEmpWeekOff").textContent = emp[4];

  function renderCalendarForMonth() {
    getEmployeeApprovedLeaves(emp[0], modalCurMonth, modalCurYear, function(approvedLeaves){
      renderEmployeeCalendarModal(emp, modalCurMonth, modalCurYear, approvedLeaves);
      document.getElementById("modalMonthYear").textContent =
        new Date(modalCurYear, modalCurMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
    });
  }
  renderCalendarForMonth();

  document.getElementById("modalPrevMonth").onclick = () => {
    modalCurMonth--;
    if (modalCurMonth < 0) {
      modalCurMonth = 11;
      modalCurYear--;
    }
    renderCalendarForMonth();
  };

  document.getElementById("modalNextMonth").onclick = () => {
    modalCurMonth++;
    if (modalCurMonth > 11) {
      modalCurMonth = 0;
      modalCurYear++;
    }
    renderCalendarForMonth();
  };
}


function renderEmployeeCalendarModal(emp, month, year, approvedLeaves=[]) {
  const calendarDays = document.getElementById('modalEmpCalendar');
  calendarDays.innerHTML = '';
  const date = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = date.getDay();

  for(let i=0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.classList.add('inactive');
    calendarDays.appendChild(blank);
  }
  for(let d=1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    let dt = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cell.textContent = d;

    if(year === new Date().getFullYear() && month === new Date().getMonth() && d === new Date().getDate()) {
      cell.classList.add('today');
    }
    if(holidays[dt]) {
      cell.classList.add('holiday');
      cell.title = `${holidays[dt].name} (${holidays[dt].type})`;
    }
    let weekdayName = new Date(dt).toLocaleString('en-US', {weekday: 'long'});
    if(weekdayName === emp[4]) {
      cell.classList.add('weekoff');
      cell.title = `Standard Week Off (${emp[4]})`;
    }
    if(approvedLeaves.includes(dt)){
      cell.classList.add('leave');
      cell.title = "Leave Approved";
    }
    calendarDays.appendChild(cell);
  }
}




function getEmployeeApprovedLeaves(empId, month, year, callback) {
  fetch(`${apiURL}?action=getLeaves&id=${empId}`)
    .then(res => res.json())
    .then(leaves => {
      // Only Approved Leaves, and same month/year
      let approved = leaves.filter(l =>
        l[5] === "Approved" &&
        new Date(l[4]).getMonth() === month &&
        new Date(l[4]).getFullYear() === year
      ).map(l => l[4].substring(0,10));
      callback(approved);
    });
}




function closeEmployeeModal() {
  document.getElementById("employeeModal").style.display = "none";
}