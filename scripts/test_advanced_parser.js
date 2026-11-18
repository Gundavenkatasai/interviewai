const mongoose = require('mongoose');

function cleanBullet(text) {
  return text.replace(/^[-•*·\d.)\s]+/, '').trim();
}

function parseResumeAdvanced(rawText) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Personal / Basics
  const emailMatch = rawText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = rawText.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = rawText.match(/https?:\/\/(?:www\.)?github\.com\/[\w-]+/i);

  let name = '';
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const l = lines[i];
    if (!l.includes('@') && !l.includes('http') && !l.includes('+') && l.length < 40 && !/^(skills|education|experience|projects)/i.test(l)) {
      name = l;
      break;
    }
  }

  const basics = {
    name: name || 'Candidate',
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    location: '',
    links: []
  };
  if (linkedinMatch) basics.links.push({ label: 'LinkedIn', url: linkedinMatch[0] });
  if (githubMatch) basics.links.push({ label: 'GitHub', url: githubMatch[0] });

  // 2. Partition into Section Chunks
  const sectionHeaders = [
    { key: 'skills', regex: /^(?:skills|technical skills|technologies|core competencies)\s*$/i },
    { key: 'experience', regex: /^(?:experience|work experience|employment history|professional experience)\s*$/i },
    { key: 'internships', regex: /^(?:internships|internship experience)\s*$/i },
    { key: 'projects', regex: /^(?:projects|personal projects|key projects|academic projects)\s*$/i },
    { key: 'training', regex: /^(?:training|trainings|vocational training|coursework)\s*$/i },
    { key: 'certifications', regex: /^(?:certifications|licenses & certifications|certificates)\s*$/i },
    { key: 'achievements', regex: /^(?:achievements|awards & achievements|honors & awards|awards)\s*$/i },
    { key: 'education', regex: /^(?:education|academic background|qualifications)\s*$/i },
    { key: 'publications', regex: /^(?:publications|research papers)\s*$/i },
    { key: 'languages', regex: /^(?:languages|language proficiencies)\s*$/i },
    { key: 'summary', regex: /^(?:summary|professional summary|profile|about me)\s*$/i }
  ];

  const sectionChunks = {};
  sectionHeaders.forEach(h => { sectionChunks[h.key] = []; });

  let currentKey = null;
  for (const line of lines) {
    const matched = sectionHeaders.find(h => h.regex.test(line));
    if (matched) {
      currentKey = matched.key;
      continue;
    }
    if (currentKey) {
      sectionChunks[currentKey].push(line);
    }
  }

  // 3. Parse Skills (Category-aware)
  const skills = [];
  (sectionChunks.skills || []).forEach(line => {
    const cleaned = line.replace(/^[-•*·]\s*/, '');
    const colIdx = cleaned.indexOf(':');
    if (colIdx !== -1) {
      const category = cleaned.slice(0, colIdx).trim();
      const items = cleaned.slice(colIdx + 1).split(/[,|•]/).map(s => s.trim()).filter(Boolean);
      if (items.length) {
        skills.push({ category, items });
      }
    } else {
      const items = cleaned.split(/[,|•]/).map(s => s.trim()).filter(Boolean);
      if (items.length) {
        skills.push({ category: 'Technical Skills', items });
      }
    }
  });

  // 4. Parse Projects
  const projects = [];
  let curProj = null;

  (sectionChunks.projects || []).forEach(line => {
    const isBullet = /^[-•*·]\s*/.test(line);
    const isTechLine = /^tech(?:nologies)?:\s*/i.test(line);

    // Date regex e.g. Nov’ 25 – Jan’ 26, Aug 2023 - Present
    const dateMatch = line.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}\s*[-–to]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}|present))/i);

    // A project header line typically has project name and dates, or pipeline separator
    const isProjectHeader = !isBullet && !isTechLine && (dateMatch || line.includes(' | ') || line.includes(' - ') || line.includes(' – '));

    if (isProjectHeader) {
      if (curProj) projects.push(curProj);

      let pName = line;
      let pDesc = '';
      let pDate = dateMatch ? dateMatch[0] : '';

      // Clean date out of name
      if (pDate) {
        pName = pName.replace(pDate, '').trim();
      }

      // Check for subtitle e.g. "PizzaCraft - Unified Full-Stack..."
      const dashParts = pName.split(/\s*[-–]\s*/);
      if (dashParts.length > 1) {
        pName = dashParts[0].trim();
        pDesc = dashParts.slice(1).join(' - ').replace(/\|\s*(?:GitHub|Live|Link).*/i, '').trim();
      } else {
        const pipeParts = pName.split(/\s*\|\s*/);
        pName = pipeParts[0].trim();
        if (pipeParts.length > 1) {
          pDesc = pipeParts.slice(1).filter(p => !/^(GitHub|Live|Link)/i.test(p)).join(' | ').trim();
        }
      }

      // Clean trailing separators
      pName = pName.replace(/\|\s*$/, '').trim();

      curProj = {
        name: pName,
        role: 'Developer',
        technologies: [],
        description: pDesc,
        bullets: [],
        githubUrl: line.includes('GitHub') ? 'https://github.com' : undefined,
        liveUrl: line.includes('Live') ? 'https://live-demo.com' : undefined,
        startDate: pDate ? pDate.split(/[-–to]/)[0].trim() : '',
        endDate: pDate ? pDate.split(/[-–to]/)[1]?.trim() : ''
      };
    } else if (isTechLine && curProj) {
      const techStr = line.replace(/^tech(?:nologies)?:\s*/i, '');
      const techs = techStr.split(/[,|•]/).map(t => t.trim()).filter(Boolean);
      curProj.technologies = techs;
    } else if (isBullet && curProj) {
      curProj.bullets.push(cleanBullet(line));
    } else if (curProj && curProj.bullets.length > 0) {
      // Continuation of previous bullet!
      const lastIdx = curProj.bullets.length - 1;
      curProj.bullets[lastIdx] += ' ' + line.trim();
    }
  });
  if (curProj) projects.push(curProj);

  // 5. Parse Education
  const education = [];
  const eduLines = sectionChunks.education || [];
  for (let i = 0; i < eduLines.length; i++) {
    const l1 = eduLines[i];
    const l2 = eduLines[i + 1] || '';

    // Check if l2 has degree/date
    const dateMatch = (l1 + ' ' + l2).match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}\s*[-–to]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}|present)|\b(?:19|20)\d{2}\s*[-–to]\s*(?:(?:19|20)\d{2}|present)\b)/i);
    const scoreMatch = (l1 + ' ' + l2).match(/(?:CGPA|GPA|Percentage):\s*[\d.]+/i);

    if (l2 && (dateMatch || scoreMatch || /bachelor|master|b\.tech|intermediate|ssc|high school/i.test(l2))) {
      // l1 is institution, l2 is degree
      const dateStr = dateMatch ? dateMatch[0] : '';
      let degreeLine = l2.replace(dateStr, '').trim();
      const scoreStr = scoreMatch ? scoreMatch[0] : '';
      if (scoreStr) degreeLine = degreeLine.replace(scoreStr, '').replace(/\|\s*$/, '').trim();

      const pipeParts = degreeLine.split('|').map(s => s.trim()).filter(Boolean);

      education.push({
        institution: l1,
        degree: pipeParts[0] || 'Degree',
        gpa: scoreStr,
        startDate: dateStr.split(/[-–to]/)[0]?.trim() || '',
        endDate: dateStr.split(/[-–to]/)[1]?.trim() || ''
      });
      i++; // skip l2
    } else if (dateMatch || /bachelor|master|b\.tech|intermediate|ssc|school/i.test(l1)) {
      education.push({
        institution: l1.split(/[,|\-]/)[0]?.trim() || 'Institution',
        degree: l1.split(/[,|\-]/)[1]?.trim() || 'Degree',
        gpa: scoreMatch ? scoreMatch[0] : '',
        endDate: dateMatch ? dateMatch[0] : ''
      });
    }
  }

  // 6. Parse Certifications
  const certifications = [];
  (sectionChunks.certifications || []).forEach(line => {
    const cleaned = cleanBullet(line);
    const dateMatch = cleaned.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}/i);
    const dateStr = dateMatch ? dateMatch[0] : '';
    let namePart = cleaned.replace(dateStr, '').trim();
    const parts = namePart.split(/\s*[-–]\s*/);
    let name = parts[0];
    let issuer = parts[1] || 'Accredited Issuer';
    if (parts.length > 2) {
      name = parts.slice(0, parts.length - 1).join(' - ');
      issuer = parts[parts.length - 1];
    }
    certifications.push({
      name: name.trim(),
      issuer: issuer.trim(),
      date: dateStr
    });
  });

  // 7. Parse Achievements
  const achievements = [];
  (sectionChunks.achievements || []).forEach(line => {
    const cleaned = cleanBullet(line);
    if (cleaned.length > 5) {
      achievements.push({
        title: cleaned.slice(0, 80),
        description: cleaned
      });
    }
  });

  // 8. Parse Training
  const training = [];
  (sectionChunks.training || []).forEach(line => {
    const isBullet = /^[-•*·]\s*/.test(line);
    if (!isBullet) {
      training.push({ title: line, bullets: [] });
    } else if (training.length > 0) {
      training[training.length - 1].bullets.push(cleanBullet(line));
    }
  });

  return {
    basics,
    summary: '',
    skills,
    projects,
    experience: [],
    internships: [],
    education,
    certifications,
    achievements,
    training
  };
}

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/interviewai');
  const db = mongoose.connection.db;
  const resume = await db.collection('resumes').findOne({ name: 'venkatasaicv' });
  const parsed = parseResumeAdvanced(resume.rawText);
  console.log('=== ADVANCED PARSED RESUME ===');
  console.log(JSON.stringify(parsed, null, 2));
  process.exit(0);
}

test();
