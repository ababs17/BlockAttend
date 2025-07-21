import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, GraduationCap, Users, Mail, Phone, Building, BookOpen, Car as IdCard, Save, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface UserProfileSetupProps {
  walletAddress: string;
  onProfileComplete: (profile: UserProfile) => void;
}

export const UserProfileSetup: React.FC<UserProfileSetupProps> = ({
  walletAddress,
  onProfileComplete
}) => {
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
    department: '',
    studentId: '',
    employeeId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.institution.trim()) {
      newErrors.institution = 'Institution name is required';
    }

    if (selectedRole === 'student' && !formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }

    if (selectedRole === 'teacher' && !formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleSelect = (role: 'teacher' | 'student') => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedRole) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const profile: UserProfile = {
        id: '',
        address: walletAddress,
        role: selectedRole,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        institution: formData.institution.trim(),
        department: formData.department.trim() || undefined,
        studentId: selectedRole === 'student' ? formData.studentId.trim() : undefined,
        employeeId: selectedRole === 'teacher' ? formData.employeeId.trim() : undefined,
        verified: false, // Will be verified by admin later
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await onProfileComplete(profile);
    } catch (error) {
      console.error('Failed to create profile:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('role');
      setSelectedRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-black rounded-2xl mb-4">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-semibold text-black mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Connected as {formatAddress(walletAddress)}
          </p>
        </div>

        {step === 'role' ? (
          /* Role Selection */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-medium text-black text-center mb-6">
              What's your role?
            </h2>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('student')}
              className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-black transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <GraduationCap size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-black">Student</h3>
                  <p className="text-sm text-gray-600">
                    Mark attendance and track your progress
                  </p>
                </div>
                <ArrowRight size={20} className="text-gray-400 ml-auto group-hover:text-black transition-colors" />
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('teacher')}
              className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-black transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                  <Users size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-black">Teacher/Lecturer</h3>
                  <p className="text-sm text-gray-600">
                    Declare sessions and manage attendance
                  </p>
                </div>
                <ArrowRight size={20} className="text-gray-400 ml-auto group-hover:text-black transition-colors" />
              </div>
            </motion.button>
          </motion.div>
        ) : (
          /* Details Form */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowRight size={16} className="rotate-180" />
              </button>
              <div className="flex items-center gap-2">
                {selectedRole === 'student' ? (
                  <GraduationCap size={20} className="text-blue-600" />
                ) : (
                  <Users size={20} className="text-green-600" />
                )}
                <h2 className="text-lg font-medium text-black">
                  {selectedRole === 'student' ? 'Student' : 'Teacher'} Details
                </h2>
              </div>
            </div>

            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
              >
                <AlertCircle size={16} />
                <span className="text-sm">{submitError}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                  <User size={14} />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input w-full ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                  <Mail size={14} />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input w-full ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                  <Phone size={14} />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`input w-full ${errors.phone ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Institution */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                  <Building size={14} />
                  Institution *
                </label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  className={`input w-full ${errors.institution ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="University/College name"
                />
                {errors.institution && (
                  <p className="text-red-600 text-xs mt-1">{errors.institution}</p>
                )}
              </div>

              {/* Department (Optional) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                  <BookOpen size={14} />
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Computer Science, Mathematics, etc."
                />
              </div>

              {/* Role-specific fields */}
              {selectedRole === 'student' ? (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                    <IdCard size={14} />
                    Student ID *
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className={`input w-full ${errors.studentId ? 'border-red-300 focus:ring-red-500' : ''}`}
                    placeholder="Your student ID number"
                  />
                  {errors.studentId && (
                    <p className="text-red-600 text-xs mt-1">{errors.studentId}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                    <IdCard size={14} />
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className={`input w-full ${errors.employeeId ? 'border-red-300 focus:ring-red-500' : ''}`}
                    placeholder="Your employee ID number"
                  />
                  {errors.employeeId && (
                    <p className="text-red-600 text-xs mt-1">{errors.employeeId}</p>
                  )}
                </div>
              )}

              {/* Verification Notice */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} className="text-gray-600" />
                  <span className="text-sm font-medium text-black">Account Verification</span>
                </div>
                <p className="text-xs text-gray-600">
                  Your account will be verified by the institution administrator. 
                  You'll receive an email confirmation once approved.
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'Creating Profile...'
                ) : (
                  <>
                    <Save size={16} />
                    Complete Setup
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};