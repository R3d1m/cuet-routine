import { Course } from '../types';

export interface TermCurriculum {
  level: number;
  term: string;
  title: string;
  courses: Course[];
}

export const CUET_CSE_CURRICULUM: Record<string, TermCurriculum> = {
  'L1T1': {
    level: 1,
    term: 'Term-I',
    title: 'Level-1, Term-I (Batch: 2025)',
    courses: [
      { code: 'CSE-141', title: 'Structured Programming', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'EE-181', title: 'Basic Electrical Engineering', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'Math-141', title: 'Differential and Integral Calculus', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'Phy-141', title: 'Physics', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'Hum-141', title: 'English', credit: 2.0, type: 'theory', contactHours: 2 },
      { code: 'CSE-100', title: 'Computer Fundamentals and Ethics (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-comp' },
      { code: 'CSE-142', title: 'Structured Programming (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-compiler' },
      { code: 'EE-182', title: 'Basic Electrical Engineering (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-mp' },
      { code: 'Phy-142', title: 'Physics (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-physics' },
    ]
  },
  'L1T2': {
    level: 1,
    term: 'Term-II',
    title: 'Level-1, Term-II',
    courses: [
      { code: 'CSE-111', title: 'Discrete Mathematics', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-143', title: 'Object Oriented Programming', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'Math-143', title: 'Co-ordinate Geometry and Differential Equation', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'EE-183', title: 'Electronic Devices and Circuits', credit: 4.0, type: 'theory', contactHours: 4 },
      { code: 'Chem-141', title: 'Chemistry', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-144', title: 'Object Oriented Programming (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-compiler' },
      { code: 'EE-184', title: 'Electronic Devices and Circuits (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-mp' },
      { code: 'Chem-142', title: 'Chemistry (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-chem' },
      { code: 'Hum-144', title: 'English Skill Development (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-comp' },
    ]
  },
  'L2T1': {
    level: 2,
    term: 'Term-I',
    title: 'Level-2, Term-I (Batch: 2024)',
    courses: [
      { code: 'CSE-241', title: 'Data Structures', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-221', title: 'Digital Logic Design', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-231', title: 'Applied Statistics', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'Math-241', title: 'Fourier Analysis and Laplace Transformation', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'Hum-243', title: 'Engineering Economics', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-242', title: 'Data Structures (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-compiler' },
      { code: 'CSE-222', title: 'Digital Logic Design (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-network' },
      { code: 'ME-246', title: 'Engineering Drawing & CAD (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-drawing' },
      { code: 'CSE-200', title: 'Competitive Programming (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-os' },
    ]
  },
  'L2T2': {
    level: 2,
    term: 'Term-II',
    title: 'Level-2, Term-II (Batch: 2023)',
    courses: [
      { code: 'CSE-223', title: 'Digital Signal Processing', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-243', title: 'Algorithms Design and Analysis', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-251', title: 'Database Management Systems', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'EE-283', title: 'Electrical Drives and Instrumentation', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'Math-243', title: 'Vector Calculus, Linear Algebra and Complex Variables', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-224', title: 'Digital Signal Processing (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-compiler' },
      { code: 'CSE-244', title: 'Algorithms Design and Analysis (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-os' },
      { code: 'CSE-252', title: 'Database Management Systems (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-multimedia' },
      { code: 'EE-284', title: 'Electrical Drives and Instrumentation (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-machine' },
      { code: 'CSE-202', title: 'Software Development with JAVA (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'room-3406' },
    ]
  },
  'L3T1': {
    level: 3,
    term: 'Term-I',
    title: 'Level-3, Term-I',
    courses: [
      { code: 'CSE-313', title: 'Data Communication', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-331', title: 'Theory of Computing', credit: 2.0, type: 'theory', contactHours: 2 },
      { code: 'CSE-333', title: 'Microprocessors and Interfacing', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-353', title: 'System Analysis and Design', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-335', title: 'Operating Systems', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-314', title: 'Data Communication (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-network' },
      { code: 'CSE-334', title: 'Microprocessors and Interfacing (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-mp' },
      { code: 'CSE-354', title: 'System Analysis and Design (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-compiler' },
      { code: 'CSE-336', title: 'Operating Systems (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-os' },
      { code: 'CSE-326', title: 'Internet Programming (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-multimedia' },
    ]
  },
  'L3T2': {
    level: 3,
    term: 'Term-II',
    title: 'Level-3, Term-II (Batch: 2022)',
    courses: [
      { code: 'CSE-311', title: 'Computer Networks', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-321', title: 'Computer Architecture', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-355', title: 'Software Engineering', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-345', title: 'Artificial Intelligence', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-347', title: 'Introduction to Mathematical Programming', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-312', title: 'Computer Networks (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-network' },
      { code: 'CSE-356', title: 'Software Engineering (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-compiler' },
      { code: 'CSE-346', title: 'Artificial Intelligence with Python (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-multimedia' },
      { code: 'CSE-300', title: 'Software Development Project (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-os' },
      { code: 'CSE-302', title: 'Technical Writing and Presentation (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'room-3403' },
    ]
  },
  'L4T1': {
    level: 4,
    term: 'Term-I',
    title: 'Level-4, Term-I (Batch: 2021)',
    courses: [
      { code: 'CSE-437', title: 'Fundamentals of Internet of Things', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-435', title: 'Information Security', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-445', title: 'Machine Learning', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-436', title: 'Information Security (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-network' },
      { code: 'CSE-438', title: 'Fundamentals of Internet of Things (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-mp' },
      { code: 'CSE-446', title: 'Machine Learning (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-multimedia' },
      { code: 'CSE-400', title: 'Project & Thesis', credit: 1.0, type: 'sessional', contactHours: 2, defaultLabId: 'lab-os' },
      { code: 'CSE-402', title: 'Industrial Attachment (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-comp' },
    ]
  },
  'L4T2': {
    level: 4,
    term: 'Term-II',
    title: 'Level-4, Term-II',
    courses: [
      { code: 'CSE-431', title: 'Compiler Design', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'CSE-457', title: 'Computer Graphics', credit: 3.0, type: 'theory', contactHours: 3 },
      { code: 'Hum-445', title: 'Engineering Management', credit: 2.0, type: 'theory', contactHours: 2 },
      { code: 'Hum-447', title: 'Financial, Cost and Managerial Accounting', credit: 2.0, type: 'theory', contactHours: 2 },
      { code: 'CSE-432', title: 'Compiler Design (Sessional)', credit: 1.5, type: 'sessional', contactHours: 3, defaultLabId: 'lab-compiler' },
      { code: 'CSE-458', title: 'Computer Graphics (Sessional)', credit: 0.75, type: 'sessional', contactHours: 1.5, defaultLabId: 'lab-multimedia' },
      { code: 'CSE-400', title: 'Project & Thesis', credit: 3.0, type: 'sessional', contactHours: 6, defaultLabId: 'lab-os' },
    ]
  }
};
