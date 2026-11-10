import { Room } from '../types';

export const CUET_CSE_ROOMS: Room[] = [
  // --- Classrooms (Theory Home Rooms) ---
  { id: 'room-3303', name: 'Room 3303 (Sec A)', shortName: '3303 (Sec A)', building: 'Academic Building-3', floor: '1st Floor', roomType: 'classroom', capacity: 65 },
  { id: 'room-3307', name: 'Room 3307 (Sec B)', shortName: '3307 (Sec B)', building: 'Academic Building-3', floor: '1st Floor', roomType: 'classroom', capacity: 65 },
  { id: 'room-3306', name: 'Room 3306 (Sec A)', shortName: '3306 (Sec A)', building: 'Academic Building-3', floor: '1st Floor', roomType: 'classroom', capacity: 65 },
  { id: 'room-3308', name: 'Room 3308 (Sec B)', shortName: '3308 (Sec B)', building: 'Academic Building-3', floor: '1st Floor', roomType: 'classroom', capacity: 65 },
  { id: 'room-3406', name: 'Room 3406 (Sec A)', shortName: '3406 (Sec A)', building: 'Academic Building-3', floor: '2nd Floor', roomType: 'classroom', capacity: 65 },
  { id: 'room-3408', name: 'Room 3408 (Sec B)', shortName: '3408 (Sec B)', building: 'Academic Building-3', floor: '2nd Floor', roomType: 'classroom', capacity: 65 },
  { id: 'room-3403', name: 'Room 3403 (Sec A)', shortName: '3403 (Sec A)', building: 'Academic Building-3', floor: '2nd Floor', roomType: 'classroom', capacity: 65 },
  { id: 'room-3305', name: 'Room 3305 (Sec B)', shortName: '3305 (Sec B)', building: 'Academic Building-3', floor: '1st Floor', roomType: 'classroom', capacity: 65 },

  // --- In-House CSE Laboratories ---
  { id: 'lab-compiler', name: 'Compiler Lab (5th Floor)', shortName: 'Compiler Lab', building: 'Academic Building-3', floor: '5th Floor', roomType: 'inhouse_lab', capacity: 40 },
  { id: 'lab-multimedia', name: 'Multimedia Lab (5th Floor)', shortName: 'Multimedia Lab', building: 'Academic Building-3', floor: '5th Floor', roomType: 'inhouse_lab', capacity: 40 },
  { id: 'lab-network', name: 'Network & Communication Lab (5th Floor)', shortName: 'Network Lab', building: 'Academic Building-3', floor: '5th Floor', roomType: 'inhouse_lab', capacity: 40 },
  { id: 'lab-mp', name: 'Microprocessor & Interfacing Lab (5th Floor)', shortName: 'Microprocessor Lab', building: 'Academic Building-3', floor: '5th Floor', roomType: 'inhouse_lab', capacity: 40 },
  { id: 'lab-os', name: 'Operating System Lab (3rd Floor)', shortName: 'OS Lab', building: 'Academic Building-3', floor: '3rd Floor', roomType: 'inhouse_lab', capacity: 40 },
  { id: 'lab-comp', name: 'Computer Lab', shortName: 'Computer Lab', building: 'Academic Building-3', floor: '3rd Floor', roomType: 'inhouse_lab', capacity: 40 },

  // --- External / Allied Department Labs ---
  { id: 'lab-physics', name: 'Physics Lab (Dept. of Physics)', shortName: 'Physics Lab', building: 'Science Building', floor: 'Ground Floor', roomType: 'external_lab', capacity: 60 },
  { id: 'lab-machine', name: 'Machine Lab, Dept. of EEE (Ground Floor)', shortName: 'EEE Machine Lab', building: 'EEE Building', floor: 'Ground Floor', roomType: 'external_lab', capacity: 50 },
  { id: 'lab-drawing', name: 'Drawing Lab (Mechanical Dept.)', shortName: 'ME Drawing Lab', building: 'Mechanical Building', floor: '2nd Floor', roomType: 'external_lab', capacity: 60 },
  { id: 'lab-chem', name: 'Chemistry Lab', shortName: 'Chemistry Lab', building: 'Science Building', floor: '1st Floor', roomType: 'external_lab', capacity: 50 },
];
