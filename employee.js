console.log("role:", localStorage.getItem("role"));
console.log("emp:", localStorage.getItem("emp"));


let empHolidays = [];
let empWeekOffs = [];
let empCurrentMonth = new Date().getMonth();
let empCurrentYear = new Date().getFullYear();
let empApprovedLeaves = [];

// --- NEW HELPER: Safely extracts the YYYY-MM-DD date part from the API response ---
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
    // Use LOCAL getters to avoid UTC shift
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return String(dateInput).substring(0, 10);
  }
}

// -----------------------------------------------------------------------------------


// Wait for DOM
window.onload = () => {
  if(localStorage.getItem("role") !== "employee") logout();
  let emp = JSON.parse(localStorage.getItem("emp"));
  document.getElementById("emp-name").textContent = emp[1];

  // Auto-fill leave form details
  document.getElementById("leave-id").value = emp[0];
  document.getElementById("leave-name").value = emp[1];
  document.getElementById("leave-email").value = emp[2];
  document.getElementById("leave-id").readOnly = true;
  document.getElementById("leave-name").readOnly = true;
  document.getElementById("leave-email").readOnly = true;

  loadEmployeeData(emp, () => {
    renderEmployeeEvents();
    renderEmployeeLeaves(emp[0]);
    renderEmployeeCalendar(emp);
  });
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

function loadEmployeeData(emp, callback) {
  getData(data => {
    empHolidays = [];
    for(let i=1;i<data.holidays.length;i++) {
      empHolidays.push({
        date: getCleanDate(data.holidays[i][0]), // Use getCleanDate here too
        name: data.holidays[i][1],
        type: data.holidays[i][2]
      });
    }
    empWeekOffs = [];
    for(let i=1;i<data.weekoffs.length;i++) {
      if(data.weekoffs[i][1] === emp[1]) {
        empWeekOffs.push({
          date: getCleanDate(data.weekoffs[i][0]), // Use getCleanDate here too
          reason: data.weekoffs[i][2]
        });
      }
    }
    if(callback) callback();
  });
}

function renderEmployeeEvents() {
  let rows = [];
  for(let h of empHolidays) {
    rows.push(`<tr><td>${h.date}</td><td>${h.name}</td><td>${h.type || '-'}</td></tr>`);
  }
  for(let w of empWeekOffs) {
    rows.push(`<tr><td>${w.date}</td><td>Week Off</td><td>${w.reason || '-'}</td></tr>`);
  }
  document.getElementById("emp-events").innerHTML =
    "<tr><th>Date</th><th>Event</th><th>Type</th></tr>" + rows.join('');
}

function renderEmployeeCalendar(emp, month = empCurrentMonth, year = empCurrentYear) {
  const calendarDays = document.getElementById('empCalendarDays');
  const monthYear = document.getElementById('empMonthYear');
  calendarDays.innerHTML = '';

  const date = new Date(year, month, 1);
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = date.getDay();

  monthYear.textContent = date.toLocaleString('default', {month:'long', year:'numeric'});

  for(let i=0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.classList.add('inactive');
    calendarDays.appendChild(blank);
  }
  for(let d=1; d <= daysInMonth; d++) {
  const cell = document.createElement('div');
  let dt = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  let cellContent = `<div>${d}</div>`;

  let holiday = empHolidays.find(h => h.date === dt);
  if(holiday) {
    cell.classList.add('holiday');
    cellContent += `<div class="holiday-type">${holiday.type}</div>`;
    cell.setAttribute('title', `${holiday.name} (${holiday.type || '-'})`);
  }

  let weekOffDay = empWeekOffs.find(w => w.date === dt);
  if(weekOffDay) {
    cell.classList.add('weekoff');
    cell.setAttribute('title', `Week Off (${weekOffDay.reason || '-'})`);
  }
  if(emp[4]) {
    let cellDay = new Date(dt).toLocaleString('en-US', {weekday: 'long'}).toLowerCase();
    let empWeekOffDay = emp[4].trim().toLowerCase();
    if(cellDay === empWeekOffDay) {
      cell.classList.add('weekoff');
      cell.setAttribute('title', `Standard Week Off (${emp[4]})`);
    }
  }
  if(empApprovedLeaves && empApprovedLeaves.includes(dt)){
    cell.classList.add('leave');
    cell.setAttribute('title', `Leave Approved`);
  }
  if(year === new Date().getFullYear() && month === new Date().getMonth() && d === new Date().getDate()) {
    cell.classList.add('today');
  }
  cell.innerHTML = cellContent;
  calendarDays.appendChild(cell);
}

}

document.getElementById('empPrevMonth').onclick = () => {
  empCurrentMonth--;
  if(empCurrentMonth < 0) {
    empCurrentMonth = 11;
    empCurrentYear--;
  }
  renderEmployeeCalendar(JSON.parse(localStorage.getItem("emp")), empCurrentMonth, empCurrentYear);
};

document.getElementById('empNextMonth').onclick = () => {
  empCurrentMonth++;
  if(empCurrentMonth > 11) {
    empCurrentMonth = 0;
    empCurrentYear++;
  }
  renderEmployeeCalendar(JSON.parse(localStorage.getItem("emp")), empCurrentMonth, empCurrentYear);
};

function applyLeave() {
  let emp = JSON.parse(localStorage.getItem("emp"));
  let id = document.getElementById("leave-id").value;
  let name = document.getElementById("leave-name").value;
  let email = document.getElementById("leave-email").value;
  let date = document.getElementById("leave-date").value.substring(0,10); // Should be YYYY-MM-DD
  let type = document.getElementById("leave-type").value;
  fetch(`${apiURL}?action=applyLeave&id=${id}&name=${name}&email=${email}&date=${date}&type=${type}`)
    .then(res => res.json())
    .then(json => {
      document.getElementById("leave-msg").textContent = json.message;
      if(json.success) {
        renderEmployeeLeaves(id);
        document.getElementById("leave-date").value = '';
        document.getElementById("leave-type").value = '';
      }
    });
}

// --- MODIFIED: Uses getCleanDate to correctly format the date from the API response ---
function renderEmployeeLeaves(empId) {
  fetch(`${apiURL}?action=getLeaves&id=${empId}`)
    .then(res => res.json())
    .then(leaves => {
      let rows = leaves.map(leave => {
        const leaveDate = getCleanDate(leave[4]); // Use the new function here!
        return `<tr><td>${leave[3]}</td><td>${leaveDate}</td><td>${leave[5]}</td></tr>`;
      }).join('');
      
      document.getElementById("emp-leave-table").innerHTML =
        "<table><tr><th>Type</th><th>Date</th><th>Status</th></tr>" + rows + "</table>";
      
      // Update empApprovedLeaves using the new function too
      empApprovedLeaves = leaves.filter(leave => leave[5] === "Approved").map(leave => getCleanDate(leave[4]));
      
      renderEmployeeCalendar(JSON.parse(localStorage.getItem("emp")), empCurrentMonth, empCurrentYear);
    });
}