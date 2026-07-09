/* ===================================================
   Internship Portal — application logic
   - Saves each section's form data to localStorage
   - Ticks/unticks the checklist based on completeness
   - Builds a downloadable .doc summary on submit
   No CSS or visual structure is touched by this file.
=================================================== */

const STORAGE_KEYS = {
  personal: 'app_personal',
  education: 'app_education',
  experience: 'app_experience',
  skills: 'app_skills',
  completion: 'app_completion'
};

/* ---------------- helpers ---------------- */

function getCompletion() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.completion) || '{}');
}

function setCompletion(section, isComplete) {
  const completion = getCompletion();
  completion[section] = isComplete;
  localStorage.setItem(STORAGE_KEYS.completion, JSON.stringify(completion));
}

function isFieldEmpty(el) {
  if (el.type === 'checkbox') return false;
  if (el.tagName === 'SELECT') {
    const val = el.value.trim();
    return val === '' || /^select/i.test(val);
  }
  return el.value.trim() === '';
}

// Reads every [name] field inside the given container(s), saves the values
// to localStorage, and returns whether all required (non data-optional)
// fields were filled in.
function saveSection(containerSelectors, storageKey, completionKey) {
  const data = {};
  let complete = true;

  containerSelectors.forEach(sel => {
    document.querySelectorAll(sel + ' [name]').forEach(el => {
      const value = el.type === 'checkbox' ? el.checked : el.value.trim();
      data[el.name] = value;

      if (!el.hasAttribute('data-optional') && isFieldEmpty(el)) {
        complete = false;
      }
    });
  });

  localStorage.setItem(storageKey, JSON.stringify(data));
  setCompletion(completionKey, complete);
  return complete;
}

function wireSaveNext(linkId, containerSelectors, storageKey, completionKey) {
  const link = document.getElementById(linkId);
  if (!link) return;
  // localStorage writes are synchronous, so the normal <a href> navigation
  // that follows this handler is safe to let happen.
  link.addEventListener('click', function () {
    saveSection(containerSelectors, storageKey, completionKey);
  });
}

function buildSectionTable(title, labels, data) {
  let rows = '';
  Object.keys(labels).forEach(key => {
    let value = data ? data[key] : '';
    if (value === undefined || value === null || value === '') value = '&mdash;';
    rows += `<tr>
      <td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;width:40%;">${labels[key]}</td>
      <td style="padding:6px 10px;border:1px solid #ccc;">${value}</td>
    </tr>`;
  });
  return `<h2 style="color:#0B3D91;margin-top:24px;">${title}</h2>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">${rows}</table>`;
}

/* ---------------- label maps (must match the "name" attributes in the HTML) ---------------- */

const PERSONAL_LABELS = {
  firstName: 'First Name', lastName: 'Last Name', email: 'Email Address',
  mobile: 'Mobile Number', dob: 'Date of Birth', gender: 'Gender',
  address: 'Address', city: 'City', state: 'State', pincode: 'PIN Code',
  nationality: 'Nationality', aadhaar: 'Aadhaar Number', linkedin: 'LinkedIn Profile'
};

const EDUCATION_LABELS = {
  college: 'College / University', university: 'University', degree: 'Degree',
  branch: 'Branch / Specialization', currentYear: 'Current Year', currentSemester: 'Current Semester',
  cgpa: 'CGPA / Percentage', gradYear: 'Expected Graduation Year', backlogs: 'Current Backlogs',
  board12: 'Class 12 Board', school12: 'Class 12 School Name', percentage12: 'Class 12 Percentage', passingYear12: 'Class 12 Passing Year',
  board10: 'Class 10 Board', school10: 'Class 10 School Name', percentage10: 'Class 10 Percentage', passingYear10: 'Class 10 Passing Year'
};

const EXPERIENCE_LABELS = {
  expType: 'Experience Type', companyName: 'Company Name', jobTitle: 'Job Title',
  startDate: 'Start Date', endDate: 'End Date', responsibilities: 'Responsibilities',
  projectTitle: 'Project Title', projectDescription: 'Project Description', technologies: 'Technologies Used',
  projectLink: 'Project Link', achievements: 'Achievements', certificationsExp: 'Certifications'
};

const SKILLS_LABELS = {
  programmingLanguages: 'Programming Languages', webTechnologies: 'Web Technologies',
  database: 'Database', tools: 'Tools & Software', softSkills: 'Soft Skills',
  languages: 'Languages Known', certifications: 'Certifications', github: 'GitHub Profile',
  linkedinProfile: 'LinkedIn Profile', portfolio: 'Portfolio Website', careerObjective: 'Career Objective'
};

/* ---------------- page wiring ---------------- */

document.addEventListener('DOMContentLoaded', function () {
  const page = document.body.dataset.page;

  if (page === 'index') renderDashboardProgress();
  if (page === 'personal') wireSaveNext('save-next', ['#personalForm'], STORAGE_KEYS.personal, 'personal');
  if (page === 'education') wireSaveNext('save-next', ['#educationForm'], STORAGE_KEYS.education, 'education');
  if (page === 'experience') wireSaveNext('save-next', ['#experienceForm'], STORAGE_KEYS.experience, 'experience');
  if (page === 'skills') wireSaveNext('save-next', ['#skillsForm'], STORAGE_KEYS.skills, 'skills');
  if (page === 'resume') initResumePage();
});

/* ---------------- dashboard progress list ---------------- */

function renderDashboardProgress() {
  const completion = getCompletion();
  ['personal', 'education', 'experience', 'skills', 'documents'].forEach(key => {
    const item = document.getElementById('progress-' + key);
    if (!item) return;
    item.textContent = (completion[key] ? '✅ ' : '⬜ ') + item.dataset.label;
  });
}

/* ---------------- resume / checklist / submit page ---------------- */

function initResumePage() {
  renderChecklist();

  ['resume-upload', 'photo-upload', 'id-upload'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updateDocumentsStatus);
  });

  const form = document.getElementById('resumeForm');
  if (form) form.addEventListener('submit', handleSubmit);
}

function renderChecklist() {
  const completion = getCompletion();
  updateRow('row-personal', completion.personal);
  updateRow('row-education', completion.education);
  updateRow('row-experience', completion.experience);
  updateRow('row-skills', completion.skills);
  updateRow('row-documents', completion.documents);
}

function updateRow(rowId, isComplete) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const cell = row.querySelector('.status-cell');
  if (!cell) return;
  cell.textContent = isComplete ? '✔ Completed' : 'Pending';
}

function updateDocumentsStatus() {
  const resume = document.getElementById('resume-upload');
  const photo = document.getElementById('photo-upload');
  const idProof = document.getElementById('id-upload');
  const complete = !!(resume && resume.files.length && photo && photo.files.length && idProof && idProof.files.length);
  setCompletion('documents', complete);
  updateRow('row-documents', complete);
}

function handleSubmit(e) {
  e.preventDefault();

  const declaration = document.getElementById('declaration-check');
  if (!declaration || !declaration.checked) {
    alert('Please confirm the declaration checkbox before submitting.');
    return;
  }

  // Incomplete sections no longer block submission — the checklist above
  // still shows what's Pending, but the applicant can submit regardless.
  generateApplicationDoc();

  const msgBox = document.getElementById('submit-message');
  if (msgBox) msgBox.style.display = 'block';
}

function generateApplicationDoc() {
  const personal = JSON.parse(localStorage.getItem(STORAGE_KEYS.personal) || '{}');
  const education = JSON.parse(localStorage.getItem(STORAGE_KEYS.education) || '{}');
  const experience = JSON.parse(localStorage.getItem(STORAGE_KEYS.experience) || '{}');
  const skills = JSON.parse(localStorage.getItem(STORAGE_KEYS.skills) || '{}');

  const applicantName = [personal.firstName, personal.lastName].filter(Boolean).join(' ') || 'Applicant';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Internship Application — ${applicantName}</title></head>
    <body style="font-family: Calibri, Arial, sans-serif; color:#222; padding:20px;">
      <h1 style="color:#0B3D91;margin-bottom:0;">Internship Application Summary</h1>
      <p style="color:#666;margin-top:4px;">Generated on ${new Date().toLocaleString()}</p>
      ${buildSectionTable('Personal Details', PERSONAL_LABELS, personal)}
      ${buildSectionTable('Education Details', EDUCATION_LABELS, education)}
      ${buildSectionTable('Work Experience', EXPERIENCE_LABELS, experience)}
      ${buildSectionTable('Skills & Professional Profile', SKILLS_LABELS, skills)}
    </body></html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Application_${applicantName.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
