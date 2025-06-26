import React from 'react';
import { GraduationCap, Users } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: 'teacher' | 'student';
  onRoleChange: (role: 'teacher' | 'student') => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleChange }) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onRoleChange('teacher')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm ${
          selectedRole === 'teacher'
            ? 'bg-white text-black shadow-sm'
            : 'text-gray-600 hover:text-black'
        }`}
      >
        <Users size={16} />
        Teacher
      </button>
      <button
        onClick={() => onRoleChange('student')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm ${
          selectedRole === 'student'
            ? 'bg-white text-black shadow-sm'
            : 'text-gray-600 hover:text-black'
        }`}
      >
        <GraduationCap size={16} />
        Student
      </button>
    </div>
  );
};