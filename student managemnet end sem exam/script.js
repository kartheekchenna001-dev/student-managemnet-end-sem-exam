// Student Management System - Vanilla JavaScript (no React, Babel or libraries)
const STORAGE_KEY = "studentManagementSystem.students.v1";
const PASS_MARK = 40;
const sampleStudents = [
  { id: 1, name: "Ram", marks: 85 },
  { id: 2, name: "Ravi", marks: 35 },
  { id: 3, name: "Sita", marks: 75 },
  { id: 4, name: "John", marks: 25 },
  { id: 5, name: "Priya", marks: 90 }
];

const form = document.getElementById("student-form");
const nameInput = document.getElementById("student-name");
const marksInput = document.getElementById("student-marks");
const saveButton = document.getElementById("save-button");
const cancelEditButton = document.getElementById("cancel-edit");
const formHeading = document.getElementById("form-heading");
const formMessage = document.getElementById("form-message");
const tableBody = document.getElementById("student-table-body");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const emptyState = document.getElementById("empty-state");
const recordCount = document.getElementById("record-count");

let students = loadStudents();
let editingId = null;

function loadStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return sampleStudents.map(student => ({ ...student }));
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return sampleStudents.map(student => ({ ...student }));
    return parsed.filter(student => student && Number.isInteger(student.id) && typeof student.name === "string" && Number.isFinite(student.marks));
  } catch (error) {
    return sampleStudents.map(student => ({ ...student }));
  }
}

function saveStudents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch (error) {
    showMessage("Could not save data in this browser. Check your browser storage settings.", true);
  }
}

function getResult(marks) {
  return marks >= PASS_MARK ? "PASS" : "FAIL";
}

function getGrade(marks) {
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 70) return "B";
  if (marks >= 60) return "C";
  if (marks >= 50) return "D";
  if (marks >= PASS_MARK) return "E";
  return "F";
}

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle("error", isError);
}

function renderStats() {
  const passed = students.filter(student => getResult(student.marks) === "PASS").length;
  const failed = students.length - passed;
  const percentage = students.length ? Math.round((passed / students.length) * 100) : 0;
  document.getElementById("total-count").textContent = students.length;
  document.getElementById("pass-count").textContent = passed;
  document.getElementById("fail-count").textContent = failed;
  document.getElementById("pass-rate").textContent = percentage + "%";
}

function renderStudents() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filter = statusFilter.value;
  const visibleStudents = students.filter(student => {
    const matchesName = student.name.toLowerCase().includes(searchTerm);
    const matchesStatus = filter === "all" || getResult(student.marks).toLowerCase() === filter;
    return matchesName && matchesStatus;
  });

  tableBody.replaceChildren();
  const rows = visibleStudents.map((student, index) => {
    const row = document.createElement("tr");
    const result = getResult(student.marks);
    const cells = [
      { text: String(index + 1) },
      { text: student.name, className: "student-name-cell" },
      { text: student.marks + " / 100", className: "marks-cell" },
      { text: getGrade(student.marks), className: "grade" }
    ];
    cells.forEach(cellData => {
      const cell = document.createElement("td");
      cell.textContent = cellData.text;
      if (cellData.className) cell.className = cellData.className;
      row.appendChild(cell);
    });

    const resultCell = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = "result-pill " + (result === "PASS" ? "result-pass" : "result-fail");
    pill.textContent = result;
    resultCell.appendChild(pill);
    row.appendChild(resultCell);

    const actionCell = document.createElement("td");
    const actionGroup = document.createElement("div");
    actionGroup.className = "action-group";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "action-button";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", "Edit " + student.name);
    editButton.addEventListener("click", () => startEditing(student.id));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "action-button delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", "Delete " + student.name);
    deleteButton.addEventListener("click", () => deleteStudent(student.id));
    actionGroup.append(editButton, deleteButton);
    actionCell.appendChild(actionGroup);
    row.appendChild(actionCell);
    return row;
  });
  tableBody.replaceChildren(...rows);

  emptyState.classList.toggle("hidden", visibleStudents.length !== 0);
  recordCount.textContent = `Showing ${visibleStudents.length} of ${students.length} students`;
  renderStats();
}

function resetForm() {
  editingId = null;
  form.reset();
  formHeading.textContent = "Add a student";
  saveButton.textContent = "Add Student";
  cancelEditButton.classList.add("hidden");
}

function startEditing(id) {
  const student = students.find(item => item.id === id);
  if (!student) return;
  editingId = id;
  nameInput.value = student.name;
  marksInput.value = student.marks;
  formHeading.textContent = "Edit student";
  saveButton.textContent = "Save Changes";
  cancelEditButton.classList.remove("hidden");
  showMessage("Update the details and select Save Changes.");
  nameInput.focus();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteStudent(id) {
  const student = students.find(item => item.id === id);
  if (!student) return;
  if (!window.confirm(`Delete ${student.name}'s record?`)) return;
  students = students.filter(item => item.id !== id);
  if (editingId === id) resetForm();
  saveStudents();
  renderStudents();
  showMessage("Student record deleted.");
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const marks = Number(marksInput.value);
  if (!name) return showMessage("Please enter the student's name.", true);
  if (!Number.isInteger(marks) || marks < 0 || marks > 100) return showMessage("Enter whole-number marks from 0 to 100.", true);

  if (editingId !== null) {
    students = students.map(student => student.id === editingId ? { ...student, name, marks } : student);
    showMessage(`${name}'s record updated: ${getResult(marks)} (${getGrade(marks)}).`);
  } else {
    const nextId = students.reduce((max, student) => Math.max(max, student.id), 0) + 1;
    students.push({ id: nextId, name, marks });
    showMessage(`${name} added successfully: ${getResult(marks)} (${getGrade(marks)}).`);
  }
  saveStudents();
  resetForm();
  renderStudents();
});

cancelEditButton.addEventListener("click", () => {
  resetForm();
  showMessage("Edit cancelled.");
});
searchInput.addEventListener("input", renderStudents);
statusFilter.addEventListener("change", renderStudents);
document.getElementById("reset-button").addEventListener("click", () => {
  if (!window.confirm("Restore the five sample students? This will replace the current records.")) return;
  students = sampleStudents.map(student => ({ ...student }));
  saveStudents();
  resetForm();
  searchInput.value = "";
  statusFilter.value = "all";
  renderStudents();
  showMessage("Sample student records restored.");
});

renderStudents();
